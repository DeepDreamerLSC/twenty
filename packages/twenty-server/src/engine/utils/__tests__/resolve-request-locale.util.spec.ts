import { resolveRequestLocale } from 'src/engine/utils/resolve-request-locale.util';

describe('resolveRequestLocale', () => {
  it('uses the active client locale before the persisted member locale', () => {
    expect(
      resolveRequestLocale({
        headerLocale: 'zh-CN',
        userWorkspaceLocale: 'en',
      }),
    ).toBe('zh-CN');
  });

  it('uses the persisted member locale when the client header is absent', () => {
    expect(
      resolveRequestLocale({
        headerLocale: undefined,
        userWorkspaceLocale: 'zh-CN',
      }),
    ).toBe('zh-CN');
  });

  it('ignores invalid client locale values', () => {
    expect(
      resolveRequestLocale({
        headerLocale: 'not-a-locale',
        userWorkspaceLocale: 'zh-CN',
      }),
    ).toBe('zh-CN');
  });

  it('falls back to the source locale when neither value is valid', () => {
    expect(
      resolveRequestLocale({
        headerLocale: undefined,
        userWorkspaceLocale: undefined,
      }),
    ).toBe('en');
  });
});
