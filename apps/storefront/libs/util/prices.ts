import { StoreCart, StoreCartLineItem, StoreProduct, StoreProductVariant } from '@medusajs/types';
import isNumber from 'lodash/isNumber';
import merge from 'lodash/merge';
import { usesMedusaMajorUnits } from '@libs/util/sushi';

const locale = 'en-US';
export interface FormatPriceOptions {
  currency: Intl.NumberFormatOptions['currency'];
  quantity?: number;
  /** Amount is in minor units (e.g. cents). Catalog PDP prices use this; sushi/event carts use major units. */
  inCents?: boolean;
}

export function formatPrice(amount: number | null, options: FormatPriceOptions) {
  const defaultOptions = {
    currency: 'usd',
    quantity: 1,
    inCents: false,
  };
  const { currency, quantity, inCents } = merge({}, defaultOptions, options);
  const majorUnits = inCents ? (amount || 0) / 100 : amount || 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(majorUnits * quantity);
}

export function sortProductVariantsByPrice(product: StoreProduct) {
  if (!product.variants) return [];
  return product.variants.sort((a, b) => getVariantFinalPrice(a) - getVariantFinalPrice(b));
}

export function getVariantPrices(variant: StoreProductVariant) {
  return {
    calculated: variant.calculated_price?.calculated_amount,
    original: variant.calculated_price?.original_amount,
  };
}

export function getVariantFinalPrice(variant: StoreProductVariant) {
  const { calculated, original } = getVariantPrices(variant);

  return (isNumber(calculated) ? calculated : original) as number;
}

export function getCheapestProductVariant(product: StoreProduct) {
  return sortProductVariantsByPrice(product)[0];
}

export function formatLineItemPrice(
  lineItem: StoreCartLineItem,
  regionCurrency: string,
  cart?: StoreCart | null,
) {
  const inMajorUnits = cart ? usesMedusaMajorUnits(cart) : usesMedusaMajorUnits({ items: [lineItem] });
  return formatPrice(lineItem.unit_price || 0, {
    currency: regionCurrency,
    quantity: lineItem.quantity,
    inCents: !inMajorUnits,
  });
}

export function formatCartSubtotal(cart: StoreCart) {
  return formatCartAmount(cart.item_subtotal, cart.region?.currency_code, 1, cart);
}

/** Format cart/order monetary fields from Medusa. */
export function formatCartAmount(
  amount: number | null | undefined,
  currency: string | undefined,
  quantity = 1,
  cart?: Parameters<typeof usesMedusaMajorUnits>[0] | null,
) {
  const inMajorUnits = cart ? usesMedusaMajorUnits(cart) : false;
  return formatPrice(amount || 0, {
    currency,
    quantity,
    inCents: !inMajorUnits,
  });
}
