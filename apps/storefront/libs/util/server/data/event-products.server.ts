// apps/storefront/libs/util/server/data/event-products.server.ts
import { parseEventSku } from '@libs/util/products';
import type { StoreProduct } from '@medusajs/types';

const resolveBackendUrl = () =>
  (process.env.INTERNAL_MEDUSA_API_URL ??
    process.env.PUBLIC_MEDUSA_API_URL ??
    process.env.MEDUSA_BACKEND_URL ??
    process.env.VITE_MEDUSA_BACKEND_URL ??
    'http://localhost:9000').replace(/\/+$/, '');

const resolvePublishableKey = () =>
  process.env.MEDUSA_PUBLISHABLE_KEY ?? ''; // do not hardcode secrets

export const fetchChefEventForProduct = async (product: StoreProduct) => {
  const eventVariant = product.variants?.find(v => v.sku?.startsWith('EVENT-'));
  if (!eventVariant?.sku) return null;

  const eventInfo = parseEventSku(eventVariant.sku);
  if (!eventInfo) return null;

  try {
    const backendUrl = resolveBackendUrl();
    const publishableKey = resolvePublishableKey();
    const url = `${backendUrl}/store/chef-events/${eventInfo.eventId}`;

    const response = await fetch(url, {
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-publishable-api-key': publishableKey,
      },
    });

    if (!response.ok) {
      try { console.warn('chef-events error:', response.status, await response.text()); }
      catch { /* ignore */ }
      return null;
    }

    const data = await response.json();
    return data.chefEvent ?? null;
  } catch (err) {
    console.error('Error fetching chef event:', err);
    return null;
  }
};

export const fetchMenuForProduct = async () => null;
