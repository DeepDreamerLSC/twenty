import { type FieldCurrencyFormat } from '@/object-record/record-field/ui/types/FieldMetadata';

export type CurrencyFieldDisplaySettings = {
  format?: FieldCurrencyFormat | null;
  displayFormat?: string | null;
  decimals?: number;
};

export const getCurrencyFieldDisplayFormat = (
  settings: CurrencyFieldDisplaySettings | null | undefined,
): FieldCurrencyFormat => {
  if (settings?.format === 'short' || settings?.format === 'full') {
    return settings.format;
  }

  return settings?.displayFormat?.toLowerCase() === 'short' ? 'short' : 'full';
};
