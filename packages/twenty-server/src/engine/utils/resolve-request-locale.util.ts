import { APP_LOCALES, SOURCE_LOCALE } from 'twenty-shared/translations';
import { isValidLocale, normalizeLocale } from 'twenty-shared/utils';

const normalizeValidLocale = (
  locale: string | undefined,
): keyof typeof APP_LOCALES | undefined => {
  const trimmedLocale = locale?.trim();

  if (!trimmedLocale) {
    return undefined;
  }

  const hasSupportedLanguage = Object.keys(APP_LOCALES).some(
    (supportedLocale) =>
      supportedLocale.split('-')[0].toLowerCase() ===
      trimmedLocale.split('-')[0].toLowerCase(),
  );

  if (!hasSupportedLanguage) {
    return undefined;
  }

  const normalizedLocale = normalizeLocale(trimmedLocale);

  return isValidLocale(normalizedLocale) ? normalizedLocale : undefined;
};

export const resolveRequestLocale = ({
  headerLocale,
  userWorkspaceLocale,
}: {
  headerLocale: string | string[] | undefined;
  userWorkspaceLocale: string | undefined;
}): keyof typeof APP_LOCALES => {
  const normalizedHeaderLocale = normalizeValidLocale(
    Array.isArray(headerLocale) ? headerLocale[0] : headerLocale,
  );

  if (normalizedHeaderLocale) {
    return normalizedHeaderLocale;
  }

  return normalizeValidLocale(userWorkspaceLocale) ?? SOURCE_LOCALE;
};
