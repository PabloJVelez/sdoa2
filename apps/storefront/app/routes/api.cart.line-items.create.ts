import { zodResolver } from '@hookform/resolvers/zod';
import { getVariantBySelectedOptions } from '@libs/util/products';
import { setCartId } from '@libs/util/server/cookies.server';
import { addToCart } from '@libs/util/server/data/cart.server';
import { getProductsById } from '@libs/util/server/data/products.server';
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

  console.log('Cart API Debug:', {
    productId,
    options,
    quantity,
    formDataEntries: Array.from(formData.entries())
  });

  const region = await getSelectedRegion(request.headers);

  const [product] = await getProductsById({
    ids: [productId],
    regionId: region.id,
  }).catch(() => []);

  if (!product) {
    return data({ errors: { root: { message: 'Product not found.' } } as FieldErrors }, { status: 400 });
  }

  console.log('Product Debug:', {
    productId: product.id,
    productTitle: product.title,
    variants: product.variants?.map(v => ({
      id: v.id,
      sku: v.sku,
      options: v.options?.map(o => ({
        option_id: o.option_id,
        value: o.value
      }))
    }))
  });

  const variant = getVariantBySelectedOptions(product.variants || [], options);

  console.log('Variant Match Debug:', {
    options,
    foundVariant: variant ? {
      id: variant.id,
      sku: variant.sku,
      options: variant.options?.map(o => ({
        option_id: o.option_id,
        value: o.value
      }))
    } : null
  });

  // If no variant found with options, try to get the first variant for products with only one variant (like event products)
  const finalVariant = variant || (product.variants?.length === 1 ? product.variants[0] : null);

  console.log('Final Variant Debug:', {
    variantFromOptions: variant ? variant.id : null,
    singleVariant: product.variants?.length === 1 ? product.variants[0]?.id : null,
    finalVariantId: finalVariant?.id,
    productVariantCount: product.variants?.length
  });

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

  const responseHeaders = new Headers();

  const { cart } = await addToCart(request, {
    variantId: finalVariant.id!,
    quantity,
  });

  await setCartId(responseHeaders, cart.id);

  return data({ cart }, { headers: responseHeaders });
}
