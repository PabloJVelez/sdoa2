import { baseMedusaConfig } from '@libs/util/server/client.server';
import type { LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';

export async function loader(_args: LoaderFunctionArgs) {
  const response = await fetch(`${baseMedusaConfig.baseUrl}/store/sushi/delivery-settings`, {
    headers: baseMedusaConfig.publishableKey
      ? { 'x-publishable-api-key': baseMedusaConfig.publishableKey }
      : {},
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return data({ settings: null }, { status: response.status });
  }

  return data({ settings: payload.settings });
}
