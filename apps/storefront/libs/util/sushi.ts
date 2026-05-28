import { StoreCart, StoreProduct } from '@medusajs/types';

export const SUSHI_ORDER_FLOW = 'sushi';

export function isSushiProduct(product: StoreProduct): boolean {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>;
  if (metadata.order_flow === SUSHI_ORDER_FLOW) return true;
  if (product.collection?.handle === 'sushi') return true;
  return product.categories?.some((c) => c.handle === 'sushi') ?? false;
}

export function isSushiDeliveryFeeLine(item: {
  metadata?: Record<string, unknown> | null;
  variant_sku?: string | null;
}): boolean {
  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  return metadata.kind === 'sushi_delivery_fee' || item.variant_sku === 'SUSHI-DELIVERY-FEE';
}

export function cartContainsSushiItems(cart: StoreCart | null): boolean {
  if (!cart?.items?.length) return false;
  const metadata = (cart.metadata ?? {}) as Record<string, unknown>;
  if (metadata.order_flow === SUSHI_ORDER_FLOW) return true;

  return cart.items.some((item) => {
    const line = item as unknown as Record<string, unknown>;
    const lineMetadata = (line.metadata ?? {}) as Record<string, unknown>;
    if (lineMetadata.order_flow === SUSHI_ORDER_FLOW) return true;
    if (isSushiDeliveryFeeLine(item as never)) return true;
    const productMetadata = (line.product as { metadata?: Record<string, unknown> } | undefined)?.metadata;
    return productMetadata?.order_flow === SUSHI_ORDER_FLOW;
  });
}

export function cartContainsEventItems(cart: StoreCart | null): boolean {
  if (!cart?.items?.length) return false;
  return cart.items.some((item) => {
    const line = item as unknown as Record<string, unknown>;
    const metadata = (line.metadata ?? {}) as Record<string, unknown>;
    if (typeof metadata.chef_event_id === 'string') return true;
    if (metadata.kind === 'chef_event_additional_charge') return true;
    const sku = line.variant_sku;
    return typeof sku === 'string' && sku.startsWith('EVENT-');
  });
}

export function isSushiCart(cart: StoreCart | null): boolean {
  return cartContainsSushiItems(cart);
}
