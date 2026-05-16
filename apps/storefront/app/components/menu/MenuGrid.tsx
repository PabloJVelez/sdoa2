import type { StoreMenuDTO } from '@libs/util/server/data/menus.server';
import clsx from 'clsx';
import type { FC } from 'react';
import { NavLink, useNavigation } from 'react-router';
import { MenuGridSkeleton } from './MenuGridSkeleton';
import { MenuListHeader, type MenuListHeaderProps } from './MenuListHeader';
import { MenuListItem } from './MenuListItem';

export interface MenuListProps {
  menus?: StoreMenuDTO[];
  className?: string;
  heading?: string;
  actions?: import('@libs/types').CustomAction[];
}

export const MenuGrid: FC<MenuListProps> = ({
  heading,
  actions,
  menus,
  className = 'grid grid-cols-1 gap-y-6 @md:grid-cols-2 gap-x-4 @2xl:!grid-cols-3 @4xl:!grid-cols-4 @4xl:gap-x-4 justify-items-stretch items-stretch',
}) => {
  const navigation = useNavigation();
  const isLoading = navigation.state !== 'idle';

  if (!menus) return <MenuGridSkeleton length={5} />;

  return (
    <div
      className={clsx('@container', {
        'animate-pulse': isLoading,
      })}
    >
      <MenuListHeader heading={heading} actions={actions} />

      <div className={className}>
        {menus?.map((menu, index) => (
          <NavLink
            prefetch="viewport"
            key={menu.id}
            to={`/menus/${menu.id}`}
            viewTransition
            className={
              // Feature the first menu with a larger span on medium+ screens
              index === 0
                ? '@md:col-span-2 @2xl:col-span-2'
                : undefined
            }
          >
            {({ isTransitioning }) => (
              <MenuListItem
                isTransitioning={isTransitioning}
                menu={menu}
                className="h-full"
              />
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

// required for lazy loading this component
export default MenuGrid; 