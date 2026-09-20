'use strict';

const http = require('node:http');
const { createHash } = require('node:crypto');

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const PORT = Number(process.env.PASSWORD_SERVICE_PORT ?? 3020);
const INTERNAL_ACCOUNT_DOMAIN = 'local.test';
const UNICODE_ACCOUNT_PREFIX = 'u-';
const ACCOUNT_NAME_PATTERN =
  /^[\p{Script=Han}a-z0-9][\p{Script=Han}a-z0-9._·-]{0,31}$/u;
const LEGACY_ASCII_ACCOUNT_PATTERN = /^[a-z0-9][a-z0-9._-]{0,31}$/;
const PASSWORD_PATTERN = /^.{8,50}$/;
const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_ATTEMPTS = 10;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('invalid-password-value', 10);

const pool = new Pool({ connectionString: process.env.PG_DATABASE_URL });
const attemptsByKey = new Map();
const rateLimitCleanup = setInterval(() => {
  const now = Date.now();

  for (const [key, attempt] of attemptsByKey) {
    if (attempt.expiresAt <= now) {
      attemptsByKey.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

rateLimitCleanup.unref();

const normalizeAccount = (account) =>
  account.trim().normalize('NFC').toLowerCase();

const toInternalIdentity = (account) => {
  const normalized = normalizeAccount(account);

  if (!normalized) {
    throw new Error('请输入账号');
  }

  if (normalized.includes('@')) {
    return normalized;
  }

  if (!ACCOUNT_NAME_PATTERN.test(normalized)) {
    throw new Error('账号格式不正确');
  }

  if (LEGACY_ASCII_ACCOUNT_PATTERN.test(normalized)) {
    return `${normalized}@${INTERNAL_ACCOUNT_DOMAIN}`;
  }

  const accountHash = createHash('sha256')
    .update(normalized)
    .digest('base64url')
    .toLowerCase();

  return `${UNICODE_ACCOUNT_PREFIX}${accountHash}@${INTERNAL_ACCOUNT_DOMAIN}`;
};

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
};

const readJsonBody = async (request) => {
  const chunks = [];
  let byteLength = 0;

  for await (const chunk of request) {
    byteLength += chunk.length;

    if (byteLength > MAX_BODY_BYTES) {
      const error = new Error('请求内容过大');
      error.statusCode = 413;
      throw error;
    }

    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('请求格式不正确');
    error.statusCode = 400;
    throw error;
  }
};

const getClientIp = (request) => {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.socket.remoteAddress ?? 'unknown';
};

const consumeAttempt = (key) => {
  const now = Date.now();
  const existing = attemptsByKey.get(key);

  if (!existing || existing.expiresAt <= now) {
    attemptsByKey.set(key, {
      count: 1,
      expiresAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (existing.count >= RATE_LIMIT_ATTEMPTS) {
    return false;
  }

  existing.count += 1;
  return true;
};

const changePassword = async ({
  account,
  currentPassword,
  newPassword,
  clientIp,
}) => {
  if (
    typeof account !== 'string' ||
    typeof currentPassword !== 'string' ||
    typeof newPassword !== 'string'
  ) {
    return { statusCode: 400, message: '请完整填写账号和密码' };
  }

  let email;

  try {
    email = toInternalIdentity(account);
  } catch (error) {
    return { statusCode: 400, message: error.message };
  }

  const rateKey = createHash('sha256')
    .update(`${clientIp}|${email}`)
    .digest('hex');

  if (!consumeAttempt(rateKey)) {
    return { statusCode: 429, message: '操作过于频繁，请十分钟后再试' };
  }

  if (!PASSWORD_PATTERN.test(newPassword)) {
    return { statusCode: 400, message: '新密码须为 8–50 位字符' };
  }

  if (currentPassword === newPassword) {
    return { statusCode: 400, message: '新密码不能与当前密码相同' };
  }

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await client.query('BEGIN');
    transactionStarted = true;

    const userResult = await client.query(
      `SELECT id, "passwordHash", disabled
       FROM core."user"
       WHERE email = $1 AND "deletedAt" IS NULL
       LIMIT 1
       FOR UPDATE`,
      [email],
    );
    const user = userResult.rows[0];
    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );

    if (!user || user.disabled || !passwordMatches) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return { statusCode: 401, message: '账号或当前密码错误' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await client.query(
      `UPDATE core."user"
       SET "passwordHash" = $1, "updatedAt" = NOW()
       WHERE id = $2`,
      [passwordHash, user.id],
    );
    await client.query(
      `DELETE FROM core."appToken"
       WHERE "userId" = $1 AND type = 'REFRESH_TOKEN'`,
      [user.id],
    );
    await client.query('COMMIT');
    transactionStarted = false;
    attemptsByKey.delete(rateKey);

    return {
      statusCode: 200,
      message: '密码修改成功，请使用新密码重新登录',
    };
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK').catch(() => undefined);
    }

    throw error;
  } finally {
    client.release();
  }
};

const server = http.createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/healthz') {
    try {
      await pool.query('SELECT 1');
      sendJson(response, 200, { status: 'ok' });
    } catch {
      sendJson(response, 503, { status: 'unavailable' });
    }
    return;
  }

  if (request.method !== 'POST' || request.url !== '/change-password') {
    sendJson(response, 404, { message: 'Not found' });
    return;
  }

  if (!request.headers['content-type']?.startsWith('application/json')) {
    sendJson(response, 415, { message: '请求格式不正确' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const result = await changePassword({
      account: body.account,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword,
      clientIp: getClientIp(request),
    });

    sendJson(response, result.statusCode, {
      success: result.statusCode === 200,
      message: result.message,
    });
  } catch (error) {
    if (error.statusCode) {
      sendJson(response, error.statusCode, { message: error.message });
      return;
    }

    console.error('Password change request failed', error);
    sendJson(response, 500, { message: '服务暂时不可用，请稍后重试' });
  }
});

server.requestTimeout = 10_000;
server.headersTimeout = 10_000;
server.keepAliveTimeout = 5_000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Password service listening on port ${PORT}`);
});

const shutdown = () => {
  clearInterval(rateLimitCleanup);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
