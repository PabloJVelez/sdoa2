import { zodResolver } from '@hookform/resolvers/zod';
import { getVariantBySelectedOptions } from '@libs/util/products';
import { cartContainsEventItems, isSushiProduct } from '@libs/util/sushi';
import { removeCartId, setCartId } from '@libs/util/server/cookies.server';
import { addToCart, retrieveCart } from '@libs/util/server/data/cart.server';
import { getProductsById } from '@libs/util/server/data/products.server';
import { fetchSushiProductById } from '@libs/util/server/sushi-products.server';
import { getSelectedRegion } from '@libs/util/server/data/regions.server';
import { FieldErrors } from 'react-hook-form';
import { type ActionFunctionArgs, data } from 'react-router';
import { getValidatedFormData } from 'remix-hook-form';
import { z } from 'zod';

export const createLineItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

type CreateLineItemFormData = z.infer<typeof createLineItemSchema>;

export async function action({ request }: ActionFunctionArgs) {
  // Read form data once
  const formData = await request.formData();
  
  // Extract fields manually
  const productId = formData.get('productId') as string;
  const quantityStr = formData.get('quantity') as string;
  
  // Parse and validate
  if (!productId) {
    return data({ errors: { root: { message: 'Product ID is required' } } as FieldErrors }, { status: 400 });
  }
  
  const quantity = parseInt(quantityStr, 10);
  if (isNaN(quantity) || quantity < 1) {
    return data({ errors: { root: { message: 'Quantity must be at least 1' } } as FieldErrors }, { status: 400 });
  }
  
  // Extract options from form data
  const options: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith('options.') && typeof value === 'string') {
      const optionId = key.replace('options.', '');
      options[optionId] = value;
    }
  }

  const region = await getSelectedRegion(request.headers);

  const [storeProduct] = await getProductsById({
    ids: [productId],
    regionId: region.id,
  }).catch(() => []);

  const product =
    storeProduct ?? (await fetchSushiProductById(productId));

  if (!product) {
    return data({ errors: { root: { message: 'Product not found.' } } as FieldErrors }, { status: 400 });
  }

  const variantIdFromForm = formData.get('variantId');
  const variantFromForm =
    typeof variantIdFromForm === 'string'
      ? product.variants?.find((v) => v.id === variantIdFromForm)
      : undefined;

  const variant = variantFromForm ?? getVariantBySelectedOptions(product.variants || [], options);

  // If no variant found with options, use the sole variant (sushi bundles, event tickets)
  const finalVariant = variant || (product.variants?.length === 1 ? product.variants[0] : null);

  if (!finalVariant) {
    return data(
      {
        errors: {
          root: {
            message: 'Product variant not found. Please select all required options.',
          },
        },
      },
      { status: 400 },
    );
  }

  const replaceCart = formData.get('replaceCart') === 'true';
  const responseHeaders = new Headers();
  const existingCart = await retrieveCart(request);
  const addingSushi = isSushiProduct(product);

  if (
    addingSushi &&
    existingCart &&
    cartContainsEventItems(existingCart) &&
    !replaceCart
  ) {
    return data(
      {
        cartConflict: 'event_to_sushi',
        message:
          'Your cart has chef event tickets. Adding sushi will clear the current cart.',
      },
      { status: 409 },
    );
  }

  if (replaceCart && existingCart) {
    await removeCartId(responseHeaders);
  }

  try {
    const { cart } = await addToCart(request, {
      variantId: finalVariant.id!,
      quantity,
      ...(addingSushi ? { metadata: { order_flow: 'sushi' } } : {}),
    });

    await setCartId(responseHeaders, cart.id);
    return data({ cart }, { headers: responseHeaders });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error);
    if (message.includes('SUSHI_EVENT_CART_CONFLICT')) {
      return data(
        {
          cartConflict: 'event_to_sushi',
          message:
            'Your cart has chef event tickets. Adding sushi will clear the current cart.',
        },
        { status: 409 },
      );
    }
    throw error;
  }
}
