import { getCurrencyFieldDisplayFormat } from './getCurrencyFieldDisplayFormat';

describe('getCurrencyFieldDisplayFormat', () => {
  it('prefers the current format setting', () => {
    expect(getCurrencyFieldDisplayFormat({ format: 'short' })).toBe('short');
    expect(getCurrencyFieldDisplayFormat({ format: 'full' })).toBe('full');
  });

  it('supports legacy displayFormat settings', () => {
    expect(getCurrencyFieldDisplayFormat({ displayFormat: 'SHORT' })).toBe(
      'short',
    );
    expect(getCurrencyFieldDisplayFormat({ displayFormat: 'FULL' })).toBe(
      'full',
    );
  });

  it('defaults to full values when no format is configured', () => {
    expect(getCurrencyFieldDisplayFormat()).toBe('full');
  });
});
