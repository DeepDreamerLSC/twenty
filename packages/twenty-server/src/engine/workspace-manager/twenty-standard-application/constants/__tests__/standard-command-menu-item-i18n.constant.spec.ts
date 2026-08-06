import { STANDARD_COMMAND_MENU_ITEMS } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-command-menu-item.constant';
import { STANDARD_COMMAND_MENU_ITEM_MESSAGE_BY_SOURCE } from 'src/engine/workspace-manager/twenty-standard-application/constants/standard-command-menu-item-i18n.constant';

describe('STANDARD_COMMAND_MENU_ITEM_MESSAGE_BY_SOURCE', () => {
  it('covers every standard command label and short label', () => {
    const sourceValues = new Set(
      Object.values(STANDARD_COMMAND_MENU_ITEMS).flatMap((item) =>
        [item.label, item.shortLabel].filter(
          (value): value is string => typeof value === 'string',
        ),
      ),
    );

    expect(
      [...sourceValues].filter(
        (sourceValue) =>
          !STANDARD_COMMAND_MENU_ITEM_MESSAGE_BY_SOURCE.has(sourceValue),
      ),
    ).toEqual([]);

    expect(
      STANDARD_COMMAND_MENU_ITEM_MESSAGE_BY_SOURCE.has(
        'Go to ${navigateToObjectMetadataItem.labelPlural}',
      ),
    ).toBe(true);
  });
});
