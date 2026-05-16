import type { PaginationConfig } from '@app/components/common/Pagination';
import { PaginationWithContext } from '@app/components/common/Pagination/pagination-with-context';
import { MenuGrid, type MenuListProps } from '@app/components/menu/MenuGrid';
import type { StoreMenuDTO } from '@libs/util/server/data/menus.server';
import type { FC } from 'react';

export interface MenuListWithPaginationProps extends MenuListProps {
  menus?: StoreMenuDTO[];
  paginationConfig?: PaginationConfig;
  context: string;
}

export const MenuListWithPagination: FC<MenuListWithPaginationProps> = ({
  context,
  paginationConfig,
  ...props
}) => (
  <div>
    <MenuGrid {...props} />
    {paginationConfig && <PaginationWithContext context={context} paginationConfig={paginationConfig} />}
  </div>
); 