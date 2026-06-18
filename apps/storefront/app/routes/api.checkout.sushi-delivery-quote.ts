import { baseMedusaConfig } from '@libs/util/server/client.server';
import { config } from '@libs/util/server/config.server';
import type { ActionFunctionArgs } from 'react-router';
import { data } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json().catch(() => null);
  const delivery_address = body?.delivery_address;
  if (!delivery_address || typeof delivery_address !== 'string') {
    return data({ error: 'Delivery address is required' }, { status: 400 });
  }

  const response = await fetch(`${baseMedusaConfig.baseUrl}/store/sushi/delivery-quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.MEDUSA_PUBLISHABLE_KEY
        ? { 'x-publishable-api-key': config.MEDUSA_PUBLISHABLE_KEY }
        : {}),
    },
    body: JSON.stringify({ delivery_address }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return data({ error: payload.message ?? 'Quote failed' }, { status: response.status });
  }

  return data(payload);
}
