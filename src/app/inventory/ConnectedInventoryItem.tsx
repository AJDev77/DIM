import _ from 'lodash';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { searchFilterSelector } from '../search/search-filter';
import { wishListSelector } from '../wishlists/selectors';
import { getNotes, getTag } from './dim-item-info';
import InventoryItem from './InventoryItem';
import { DimItem } from './item-types';
import { isNewSelector, itemHashTagsSelector, itemInfosSelector } from './selectors';

/**
 * An item that can load its auxiliary state directly from Redux. Not suitable
 * for showing a ton of items, but useful!
 */
export default function ConnectedInventoryItem({
  item,
  onClick,
  onShiftClick,
  onDoubleClick,
  selectedSuperDisplay,
  dimArchived,
  allowFilter,
  innerRef,
}: {
  item: DimItem;
  allowFilter?: boolean;
  selectedSuperDisplay?: 'enabled' | 'disabled' | 'v3SubclassesOnly';
  innerRef?: React.Ref<HTMLDivElement>;
  onClick?(e: React.MouseEvent): void;
  onShiftClick?(e: React.MouseEvent): void;
  onDoubleClick?(e: React.MouseEvent): void;
  dimArchived?: boolean;
}) {
  const itemInfos = useSelector(itemInfosSelector);
  const itemHashTags = useSelector(itemHashTagsSelector);
  const tag = getTag(item, itemInfos, itemHashTags);
  const currentFilter = useSelector(searchFilterSelector);
  const defaultFilterActive = currentFilter === _.stubTrue;

  const isNew = useSelector(isNewSelector(item));
  const notes = getNotes(item, itemInfos, itemHashTags) ? true : false;
  const wishlistRoll = useSelector(wishListSelector(item));
  const searchHidden =
    // dim this item if there's no search filter and it's archived
    (dimArchived && defaultFilterActive && tag === 'archive') ||
    // or if there is filtering and it doesn't meet the condition
    (allowFilter && !currentFilter(item));

  return useMemo(
    () => (
      <InventoryItem
        item={item}
        isNew={isNew}
        tag={tag}
        notes={notes}
        wishlistRoll={wishlistRoll}
        onClick={onClick}
        onShiftClick={onShiftClick}
        onDoubleClick={onDoubleClick}
        searchHidden={searchHidden}
        selectedSuperDisplay={selectedSuperDisplay}
        innerRef={innerRef}
      />
    ),
    [
      innerRef,
      isNew,
      item,
      notes,
      onClick,
      onDoubleClick,
      onShiftClick,
      searchHidden,
      selectedSuperDisplay,
      tag,
      wishlistRoll,
    ]
  );
}
