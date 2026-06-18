import { Container } from '@app/components/common/container';
import { baseMedusaConfig } from '@libs/util/server/client.server';
import { config } from '@libs/util/server/config.server';
import { setCartId } from '@libs/util/server/cookies.server';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, redirect, useLoaderData } from 'react-router';

type OrderRequest = {
  id: string;
  status: string;
  payment_cart_id?: string | null;
};

async function fetchOrderRequest(requestId: string): Promise<OrderRequest | null> {
  const response = await fetch(
    `${baseMedusaConfig.baseUrl}/store/sushi/order-requests?order_request_id=${encodeURIComponent(requestId)}`,
    {
      headers: baseMedusaConfig.publishableKey
        ? { 'x-publishable-api-key': baseMedusaConfig.publishableKey }
        : {},
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) return null;
  return payload.order_request ?? null;
}

export const meta: MetaFunction = () => [{ title: 'Pay for sushi order' }];

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const requestId = params.requestId;
  if (!requestId) {
    throw redirect('/sushi');
  }

  const orderRequest = await fetchOrderRequest(requestId);
  if (!orderRequest) {
    throw redirect('/sushi');
  }

  if (orderRequest.status === 'cancelled' || orderRequest.status === 'rejected') {
    return { alreadyPaid: false, notAvailable: true, orderRequest };
  }

  const initResponse = await fetch(
    `${baseMedusaConfig.baseUrl}/store/sushi/order-requests/${requestId}/initialize-cart`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.MEDUSA_PUBLISHABLE_KEY
          ? { 'x-publishable-api-key': config.MEDUSA_PUBLISHABLE_KEY }
          : {}),
      },
    },
  );

  const initPayload = await initResponse.json().catch(() => ({}));

  if (initResponse.ok && initPayload?.cart?.id) {
    const headers = new Headers();
    await setCartId(headers, initPayload.cart.id);
    throw redirect('/checkout', { headers });
  }

  const message = typeof initPayload.message === 'string' ? initPayload.message : '';
  const alreadyPaid =
    initResponse.status === 404 &&
    (message.toLowerCase().includes('payment cart') || message.toLowerCase().includes('not available'));

  if (orderRequest.status !== 'confirmed') {
    return { alreadyPaid: false, notAvailable: false, pending: true, orderRequest };
  }

  return { alreadyPaid, notAvailable: false, pending: false, orderRequest, error: message || 'Unable to start checkout' };
};

export default function SushiPayRoute() {
  const data = useLoaderData<typeof loader>();

  if ('alreadyPaid' in data && data.alreadyPaid) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Already paid</h1>
          <p className="mt-4 text-gray-600">This sushi order has already been paid. No further action is needed.</p>
          <div className="mt-8">
            <Link
              to="/sushi"
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Back to sushi menu
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  if ('pending' in data && data.pending) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Not ready for payment</h1>
          <p className="mt-4 text-gray-600">
            Your delivery request is still being reviewed by the chef. You will receive a link to pay once it is
            confirmed.
          </p>
          <div className="mt-8">
            <Link
              to="/sushi"
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Back to sushi menu
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  if ('notAvailable' in data && data.notAvailable) {
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Order unavailable</h1>
          <p className="mt-4 text-gray-600">This order request is no longer available for payment.</p>
          <div className="mt-8">
            <Link
              to="/sushi"
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              Back to sushi menu
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Unable to start checkout</h1>
        <p className="mt-4 text-gray-600">{'error' in data ? data.error : 'Something went wrong. Please try again.'}</p>
        <div className="mt-8">
          <Link
            to="/sushi"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Back to sushi menu
          </Link>
        </div>
      </div>
    </Container>
  );
}
