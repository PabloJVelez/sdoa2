import { submitSushiFulfillment } from '@libs/util/server/sushi-fulfillment.server';
import type { ActionFunctionArgs } from 'react-router';
import { data } from 'react-router';

export async function action({ request }: ActionFunctionArgs) {
  const result = await submitSushiFulfillment(request);

  if (!result.ok) {
    return data({ error: result.error }, { status: result.status });
  }

  if (result.outOfRange) {
    return data({
      outOfRange: true,
      orderRequestId: result.orderRequestId,
      miles: result.miles,
      deliveryFeeCents: result.deliveryFeeCents,
    });
  }

  return data({
    outOfRange: false,
    miles: result.miles,
    deliveryFeeCents: result.deliveryFeeCents,
    cart: result.cart,
  });
}
