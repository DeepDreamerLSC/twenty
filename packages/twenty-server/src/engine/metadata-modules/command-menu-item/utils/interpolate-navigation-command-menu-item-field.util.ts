import { type I18n } from '@lingui/core';
import { isNonEmptyString } from '@sniptt/guards';
import { type APP_LOCALES } from 'twenty-shared/translations';
import {
  interpolateCommandMenuItemTemplate,
  isDefined,
} from 'twenty-shared/utils';

import { type CommandMenuItemDTO } from 'src/engine/metadata-modules/command-menu-item/dtos/command-menu-item.dto';
import { EngineComponentKey } from 'src/engine/metadata-modules/command-menu-item/enums/engine-component-key.enum';
import { buildNavigationInterpolationContext } from 'src/engine/metadata-modules/command-menu-item/utils/build-navigation-interpolation-context.util';
import { isObjectMetadataCommandMenuItemPayload } from 'src/engine/metadata-modules/command-menu-item/utils/is-object-metadata-command-menu-item-payload.util';
import { type ObjectMetadataDTO } from 'src/engine/metadata-modules/object-metadata/dtos/object-metadata.dto';
import { translateCommandMenuItemField } from 'src/engine/metadata-modules/command-menu-item/utils/translate-command-menu-item-field.util';

export const interpolateNavigationCommandMenuItemField = ({
  commandMenuItem,
  fieldName,
  objectMetadata,
  isStandardObjectMetadata,
  isStandardCommandMenuItem,
  locale,
  i18nInstance,
  objectMetadataApplicationCatalog,
  commandMenuItemApplicationCatalog,
}: {
  commandMenuItem: CommandMenuItemDTO;
  fieldName: 'label' | 'shortLabel' | 'icon';
  objectMetadata: ObjectMetadataDTO | null;
  isStandardObjectMetadata: boolean;
  isStandardCommandMenuItem: boolean;
  locale: keyof typeof APP_LOCALES | undefined;
  i18nInstance: I18n;
  objectMetadataApplicationCatalog?: Record<string, string>;
  commandMenuItemApplicationCatalog?: Record<string, string>;
}): string | undefined => {
  const rawValue = commandMenuItem[fieldName];
  const translatedValue =
    fieldName === 'icon'
      ? rawValue
      : translateCommandMenuItemField({
          sourceValue: rawValue,
          isStandardCommandMenuItem,
          applicationCatalog: commandMenuItemApplicationCatalog,
          i18nInstance,
        });

  if (
    commandMenuItem.engineComponentKey !== EngineComponentKey.NAVIGATION ||
    !isObjectMetadataCommandMenuItemPayload(commandMenuItem.payload)
  ) {
    return translatedValue;
  }

  if (!isDefined(objectMetadata)) {
    return undefined;
  }

  if (!isNonEmptyString(translatedValue)) {
    return translatedValue;
  }

  const context = buildNavigationInterpolationContext({
    objectMetadata,
    isStandardApp: isStandardObjectMetadata,
    locale,
    i18nInstance,
    applicationCatalog: objectMetadataApplicationCatalog,
  });

  return (
    interpolateCommandMenuItemTemplate({
      label: translatedValue,
      context,
    }) ?? rawValue
  );
};
