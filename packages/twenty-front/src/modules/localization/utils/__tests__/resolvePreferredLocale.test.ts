import { resolvePreferredLocale } from '@/localization/utils/resolvePreferredLocale';

describe('resolvePreferredLocale', () => {
  it('uses the active client locale before the persisted member locale', () => {
    expect(
      resolvePreferredLocale({
        activeClientLocale: 'zh-CN',
        workspaceMemberLocale: 'en',
      }),
    ).toBe('zh-CN');
  });

  it('uses the persisted member locale when the client locale is absent', () => {
    expect(
      resolvePreferredLocale({
        activeClientLocale: undefined,
        workspaceMemberLocale: 'zh-CN',
      }),
    ).toBe('zh-CN');
  });

  it('normalizes supported language aliases', () => {
    expect(
      resolvePreferredLocale({
        activeClientLocale: 'zh',
        workspaceMemberLocale: 'en',
      }),
    ).toBe('zh-CN');
  });

  it('ignores invalid client locale values', () => {
    expect(
      resolvePreferredLocale({
        activeClientLocale: 'not-a-locale',
        workspaceMemberLocale: 'zh-CN',
      }),
    ).toBe('zh-CN');
  });

  it('falls back to the source locale when neither value is valid', () => {
    expect(
      resolvePreferredLocale({
        activeClientLocale: undefined,
        workspaceMemberLocale: undefined,
      }),
    ).toBe('en');
  });
});
