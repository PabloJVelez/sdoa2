import { getCartId } from '@libs/util/server/cookies.server';
import { baseMedusaConfig } from '@libs/util/server/client.server';
import { config } from '@libs/util/server/config.server';
import { z } from 'zod';

const schema = z
  .object({
    fulfillment_type: z.enum(['pickup', 'delivery']),
    scheduled_at: z.string().min(1),
    delivery_address: z.string().optional(),
    customer_email: z.string().email(),
    customer_name: z.string().optional(),
    customer_phone: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillment_type === 'delivery' && !data.delivery_address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Delivery address is required',
        path: ['delivery_address'],
      });
    }
  });

export type SushiFulfillmentResult =
  | { ok: false; status: number; error: string }
  | {
      ok: true;
      fulfillmentType: 'pickup' | 'delivery';
      orderRequestId?: string;
      cart?: unknown;
    };

export async function submitSushiFulfillment(request: Request): Promise<SushiFulfillmentResult> {
  const cartId = await getCartId(request.headers);
  if (!cartId) {
    return { ok: false, status: 400, error: 'No cart found' };
  }

  const formData = await request.formData();
  const parsed = schema.safeParse({
    fulfillment_type: formData.get('fulfillment_type'),
    scheduled_at: formData.get('scheduled_at'),
    delivery_address: formData.get('delivery_address') || undefined,
    customer_email: formData.get('customer_email') || undefined,
    customer_name: formData.get('customer_name') || undefined,
    customer_phone: formData.get('customer_phone') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, status: 400, error: 'Invalid fulfillment details' };
  }

  const response = await fetch(`${baseMedusaConfig.baseUrl}/store/sushi/fulfillment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.MEDUSA_PUBLISHABLE_KEY
        ? { 'x-publishable-api-key': config.MEDUSA_PUBLISHABLE_KEY }
        : {}),
    },
    body: JSON.stringify({
      cart_id: cartId,
      ...parsed.data,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: payload.message ?? 'Failed to save fulfillment details',
    };
  }

  if (payload.fulfillment_type === 'delivery' && payload.order_request_id) {
    return {
      ok: true,
      fulfillmentType: 'delivery',
      orderRequestId: payload.order_request_id,
    };
  }

  return {
    ok: true,
    fulfillmentType: 'pickup',
    cart: payload.cart,
  };
}
