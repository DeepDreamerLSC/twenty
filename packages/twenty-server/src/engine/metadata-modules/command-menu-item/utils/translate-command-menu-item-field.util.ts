import { type I18n } from '@lingui/core';
import { isNonEmptyString } from '@sniptt/guards';

import { translateStandardLabel } from 'src/engine/core-modules/i18n/utils/translate-standard-label.util';
import { STANDARD_COMMAND_MENU_ITEM_MESSAGE_BY_SOURCE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-command-menu-item-i18n.constant';

export const translateCommandMenuItemField = ({
  sourceValue,
  isStandardCommandMenuItem,
  applicationCatalog,
  i18nInstance,
}: {
  sourceValue: string | undefined;
  isStandardCommandMenuItem: boolean;
  applicationCatalog: Record<string, string> | undefined;
  i18nInstance: I18n;
}): string | undefined => {
  if (!isNonEmptyString(sourceValue)) {
    return sourceValue;
  }

  if (isStandardCommandMenuItem) {
    const descriptor =
      STANDARD_COMMAND_MENU_ITEM_MESSAGE_BY_SOURCE.get(sourceValue);

    if (descriptor) {
      return i18nInstance._(descriptor);
    }
  }

  return translateStandardLabel({
    sourceValue,
    isStandardApp: isStandardCommandMenuItem,
    applicationCatalog,
    i18nInstance,
  });
};
