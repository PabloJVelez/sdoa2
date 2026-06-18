import { getCartId } from '@libs/util/server/cookies.server';
import { baseMedusaConfig } from '@libs/util/server/client.server';
import { config } from '@libs/util/server/config.server';
import type { ActionFunctionArgs } from 'react-router';
import { data } from 'react-router';
import { z } from 'zod';

const schema = z.object({
  fulfillment_type: z.enum(['pickup', 'delivery']),
  scheduled_at: z.string().min(1),
  delivery_address: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
  const cartId = await getCartId(request.headers);
  if (!cartId) {
    return data({ error: 'No cart found' }, { status: 400 });
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
    return data({ error: 'Invalid fulfillment details' }, { status: 400 });
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
    return data(
      { error: payload.message ?? 'Failed to save fulfillment details' },
      { status: response.status },
    );
  }

  if (payload.in_range === false && payload.order_request_id) {
    return data({
      outOfRange: true,
      orderRequestId: payload.order_request_id,
      miles: payload.miles,
      deliveryFeeCents: payload.delivery_fee_cents,
    });
  }

  return data({
    outOfRange: false,
    miles: payload.miles,
    deliveryFeeCents: payload.delivery_fee_cents,
    cart: payload.cart,
  });
}
