import { Calendar, ListBullet, ShoppingBag, SquaresPlus, TruckFast } from '@medusajs/icons';
import type { MenuConfig } from '@unlockable/vite-plugin-unlock/medusa';

/**
 * Patch core sidebar (main-layout useCoreRoutes).
 * - Drop Inventory, Price Lists, and Products.
 * - Add Menus, Chef Events, and Experiences (experience types) as top-level items.
 * Paths in `add` match custom routes so those entries are not duplicated under Extensions.
 */
const config: MenuConfig = {
  remove: ['/inventory', '/price-lists', '/products'],
  add: [
    {
      icon: ListBullet,
      label: 'Menus',
      to: '/menus',
    },
    {
      icon: SquaresPlus,
      label: 'Experiences',
      to: '/experience-types',
    },
    {
      icon: Calendar,
      label: 'Events',
      to: '/chef-events',
    },
    {
      icon: ShoppingBag,
      label: 'Sushi Products',
      to: '/sushi-products',
    },
    {
      icon: TruckFast,
      label: 'Delivery Settings',
      to: '/sushi-delivery-settings',
    },
  ],
  order: [
    '/chef-events',
    '/orders',
    '/sushi-products',
    '/sushi-delivery-settings',
    '/menus',
    '/experience-types',
    '/customers',
    '/promotions',
  ],
};

export default config;
