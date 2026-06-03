import { StoreCart, StoreProduct } from '@medusajs/types';

export const SUSHI_ORDER_FLOW = 'sushi';
export const SUSHI_FOOD_SKU_PREFIX = 'SUSHI-';
export const SUSHI_DELIVERY_FEE_SKU = 'SUSHI-DELIVERY-FEE';

export function isSushiFoodSku(sku: string | null | undefined): boolean {
  if (!sku || typeof sku !== 'string') return false;
  return sku.startsWith(SUSHI_FOOD_SKU_PREFIX) && sku !== SUSHI_DELIVERY_FEE_SKU;
}

export function getLineItemSku(item: {
  variant_sku?: string | null;
  variant?: { sku?: string | null } | null;
}): string | null {
  const sku = item.variant_sku ?? item.variant?.sku ?? null;
  return typeof sku === 'string' ? sku : null;
}

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
  return metadata.kind === 'sushi_delivery_fee' || item.variant_sku === SUSHI_DELIVERY_FEE_SKU;
}

function lineItemIsSushiFood(item: StoreCart['items'][number]): boolean {
  if (isSushiDeliveryFeeLine(item as never)) return false;

  const line = item as unknown as Record<string, unknown>;
  const lineMetadata = (line.metadata ?? {}) as Record<string, unknown>;
  if (lineMetadata.order_flow === SUSHI_ORDER_FLOW) return true;

  const sku = getLineItemSku(item as never);
  if (isSushiFoodSku(sku)) return true;

  const productMetadata =
    (line.product as { metadata?: Record<string, unknown> } | undefined)?.metadata ??
    (item.variant as { product?: { metadata?: Record<string, unknown> } } | undefined)?.product
      ?.metadata;

  return productMetadata?.order_flow === SUSHI_ORDER_FLOW;
}

export function cartHasSushiFoodItems(cart: StoreCart | null): boolean {
  if (!cart?.items?.length) return false;

  return cart.items.some(lineItemIsSushiFood);
}

export function cartContainsSushiItems(cart: StoreCart | null): boolean {
  if (!cart) return false;

  const metadata = (cart.metadata ?? {}) as Record<string, unknown>;
  if (metadata.order_flow === SUSHI_ORDER_FLOW) return true;

  return cartHasSushiFoodItems(cart);
}

export function isSushiDeliveryCart(cart: StoreCart | null): boolean {
  if (!cartContainsSushiItems(cart)) return false;
  const metadata = (cart?.metadata ?? {}) as Record<string, unknown>;
  return metadata.sushi_fulfillment_type === 'delivery';
}

export function cartContainsEventItems(cart: StoreCart | null): boolean {
  if (!cart?.items?.length) return false;
  return cart.items.some((item) => lineItemIsChefEvent(item as never));
}

function lineItemIsChefEvent(item: {
  metadata?: Record<string, unknown> | null;
  variant_sku?: string | null;
}): boolean {
  const metadata = (item.metadata ?? {}) as Record<string, unknown>;
  if (typeof metadata.chef_event_id === 'string') return true;
  if (metadata.kind === 'chef_event_additional_charge') return true;
  if (metadata.kind === 'chef_event_ticket') return true;
  const sku = item.variant_sku;
  return typeof sku === 'string' && sku.startsWith('EVENT-');
}

/** Chef event and sushi carts store Medusa amounts in major currency units. */
export function usesMedusaMajorUnits(
  cartOrOrder: {
    metadata?: Record<string, unknown> | null;
    items?: Array<{
      metadata?: Record<string, unknown> | null;
      variant_sku?: string | null;
    }> | null;
  } | null,
): boolean {
  if (!cartOrOrder) return false;

  const metadata = (cartOrOrder.metadata ?? {}) as Record<string, unknown>;
  if (metadata.order_flow === SUSHI_ORDER_FLOW) return true;

  if (cartOrOrder.items?.some((item) => lineItemIsChefEvent(item) || lineItemIsSushiFood(item as never))) {
    return true;
  }

  return false;
}

export function isSushiCart(cart: StoreCart | null): boolean {
  return cartContainsSushiItems(cart);
}
