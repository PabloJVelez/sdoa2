import { cartContainsSushiItems, isSushiDeliveryFeeLine, isSushiFoodSku, getLineItemSku } from '@libs/util/sushi';
import { StoreCart, StoreCartShippingOption } from '@medusajs/types';

/**
 * Check if a shipping option represents digital delivery ($0, name contains "digital").
 */
export function isDigitalShippingOption(option: StoreCartShippingOption): boolean {
  return option.amount === 0 && option.name.toLowerCase().includes('digital');
}

/**
 * Check if every item in the cart is a digital product.
 * Uses two signals from the line item snapshot:
 *  - requires_shipping === false (set on inventory items for digital products)
 *  - variant_sku starts with EVENT- (convention for event ticket products)
 */
export function hasOnlyDigitalItems(cart: StoreCart | null): boolean {
  if (!cart || !cart.items?.length) return false;
  if (cartContainsSushiItems(cart)) return false;

  return cart.items.every((item) => {
    const lineItem = item as unknown as Record<string, unknown>;
    if (isSushiDeliveryFeeLine(lineItem as never)) return false;
    if (lineItem.requires_shipping === false) return true;
    const metadata =
      typeof lineItem.metadata === "object" && lineItem.metadata !== null
        ? (lineItem.metadata as Record<string, unknown>)
        : null;
    if (metadata?.order_flow === 'sushi') return false;
    if (metadata?.kind === "chef_event_additional_charge") return true;
    const sku = getLineItemSku(lineItem as never);
    if (isSushiFoodSku(sku)) return false;
    return typeof sku === 'string' && sku.startsWith('EVENT-');
  });
}

export function isSushiPickupShippingOption(option: StoreCartShippingOption): boolean {
  return option.name.toLowerCase().includes('sushi pickup');
}

export function isSushiDeliveryShippingOption(option: StoreCartShippingOption): boolean {
  return option.name.toLowerCase().includes('sushi delivery');
}

export function filterShippingOptionsForSushiCart(
  cart: StoreCart | null,
  shippingOptions: StoreCartShippingOption[],
): StoreCartShippingOption[] {
  if (!cartContainsSushiItems(cart)) return shippingOptions;

  const metadata = (cart?.metadata ?? {}) as Record<string, unknown>;
  const fulfillmentType = metadata.sushi_fulfillment_type;

  const sushiOptions = shippingOptions.filter((option) => {
    if (fulfillmentType === 'delivery') {
      return isSushiDeliveryShippingOption(option);
    }
    return isSushiPickupShippingOption(option);
  });

  return sushiOptions.length > 0 ? sushiOptions : shippingOptions;
}

/**
 * Check if a cart contains only digital products.
 *
 * Two detection paths:
 *  1. Shipping options already filtered to a single free digital option (fast path)
 *  2. All cart items are digital AND at least one digital shipping option exists
 */
export function isDigitalOnlyCart(cart: StoreCart | null, shippingOptions: StoreCartShippingOption[]): boolean {
  if (!cart || !cart.items?.length) return false;

  if (shippingOptions.length === 1 && isDigitalShippingOption(shippingOptions[0])) {
    return true;
  }

  if (hasOnlyDigitalItems(cart)) {
    return shippingOptions.some(isDigitalShippingOption);
  }

  return false;
}

/**
 * Check if a cart requires a shipping address (inverse of digital-only).
 */
export function requiresShippingAddress(cart: StoreCart | null, shippingOptions: StoreCartShippingOption[]): boolean {
  return !isDigitalOnlyCart(cart, shippingOptions);
}

/**
 * For digital-only carts, strip out physical shipping options so
 * downstream components (delivery method, order summary) only see
 * the free digital delivery option.
 */
export function filterShippingOptionsForCart(
  cart: StoreCart | null,
  shippingOptions: StoreCartShippingOption[],
): StoreCartShippingOption[] {
  if (cartContainsSushiItems(cart)) {
    return filterShippingOptionsForSushiCart(cart, shippingOptions);
  }

  if (!hasOnlyDigitalItems(cart)) return shippingOptions;

  const digitalOptions = shippingOptions.filter(isDigitalShippingOption);
  return digitalOptions.length > 0 ? digitalOptions : shippingOptions;
}
