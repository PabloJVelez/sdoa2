import { ActionList } from '@app/components/common/actions-list/ActionList';
import type { CustomAction } from '@libs/types';
import type { FC } from 'react';

export interface MenuListHeaderProps {
  heading?: string;
  actions?: CustomAction[];
}

export const MenuListHeader: FC<MenuListHeaderProps> = ({ heading, actions }) => {
  if (!heading && !actions?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      {heading && (
        <h2 className="text-2xl md:text-3xl font-italiana text-gray-900">
          {heading}
        </h2>
      )}
      {actions?.length && (
        <ActionList actions={actions} className="flex-wrap" />
      )}
    </div>
  );
}; 