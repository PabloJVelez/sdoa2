import { Button } from '@app/components/common/buttons/Button';
import { Container } from '@app/components/common/container';
import { SushiSchedulePicker } from '@app/components/sushi/SushiSchedulePicker';
import { useCart } from '@app/hooks/useCart';
import { formatPrice } from '@libs/util/prices';
import { cartHasSushiFoodItems } from '@libs/util/sushi';
import { baseMedusaConfig } from '@libs/util/server/client.server';
import { submitSushiFulfillment } from '@libs/util/server/sushi-fulfillment.server';
import { getCartId, removeCartId } from '@libs/util/server/cookies.server';
import { retrieveCart } from '@libs/util/server/data/cart.server';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';
import { useState } from 'react';

type DeliverySettings = {
  enable_pickup: boolean;
  enable_delivery: boolean;
  allowed_days: Array<{ day: string; windows: Array<{ start: string; end: string }> }>;
  store_timezone: string;
  price_per_mile: number;
  max_radius_miles: number;
};

export const meta: MetaFunction = () => [
  { title: 'Sushi checkout' },
  { name: 'description', content: 'Choose pickup or delivery and schedule your sushi order.' },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cartId = await getCartId(request.headers);
  if (!cartId) {
    throw redirect('/sushi');
  }

  const cart = await retrieveCart(request).catch(() => null);
  if (!cart || !cartHasSushiFoodItems(cart)) {
    throw redirect('/sushi');
  }

  const settingsResponse = await fetch(`${baseMedusaConfig.baseUrl}/store/sushi/delivery-settings`, {
    headers: baseMedusaConfig.publishableKey
      ? { 'x-publishable-api-key': baseMedusaConfig.publishableKey }
      : {},
  });

  const settingsPayload = await settingsResponse.json().catch(() => ({}));

  if (!settingsResponse.ok || !settingsPayload.settings) {
    throw new Response('Unable to load pickup and delivery settings. Please try again later.', {
      status: 503,
    });
  }

  const settings = settingsPayload.settings as DeliverySettings;

  return { cart, settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await submitSushiFulfillment(request);

  if (!result.ok) {
    return { error: result.error };
  }

  if (result.fulfillmentType === 'delivery' && result.orderRequestId) {
    const headers = new Headers();
    await removeCartId(headers);
    throw redirect(`/sushi/request-confirmed?order_request_id=${result.orderRequestId}`, { headers });
  }

  throw redirect('/checkout');
};

export default function SushiCheckoutRoute() {
  const { cart, settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const { closeCartDrawerForCheckout } = useCart();

  const defaultFulfillmentType = settings.enable_pickup
    ? 'pickup'
    : settings.enable_delivery
      ? 'delivery'
      : 'pickup';

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>(defaultFulfillmentType);
  const [scheduledAt, setScheduledAt] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerEmail, setCustomerEmail] = useState(cart.email ?? '');
  const storeTimezone = settings.store_timezone;
  const allowedDays = settings.allowed_days;

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <Link to="/sushi" className="text-sm text-primary-600 hover:underline">
            &larr; Back to sushi menu
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-gray-900">Pickup or delivery</h1>
          <p className="mt-2 text-gray-600">
            Choose how you would like to receive your order and pick a date and time.
          </p>
        </div>

        <Form
          method="post"
          className="flex flex-col gap-6"
          onSubmit={() => closeCartDrawerForCheckout()}
        >
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="customer_email">
              Email
            </label>
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              autoComplete="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {fulfillmentType === 'delivery'
                ? 'We will email you when your delivery request is confirmed.'
                : 'Used for your order confirmation and receipt.'}
            </p>
          </div>

          <fieldset className="flex gap-6">
            {settings.enable_pickup && (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="fulfillment_type"
                  value="pickup"
                  checked={fulfillmentType === 'pickup'}
                  onChange={() => setFulfillmentType('pickup')}
                />
                Pickup
              </label>
            )}
            {settings.enable_delivery && (
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="fulfillment_type"
                  value="delivery"
                  checked={fulfillmentType === 'delivery'}
                  onChange={() => setFulfillmentType('delivery')}
                />
                Delivery
              </label>
            )}
          </fieldset>

          <div>
            <p className="text-sm font-medium text-gray-700">Date &amp; time</p>
            <div className="mt-1">
              <SushiSchedulePicker
                allowedDays={allowedDays}
                storeTimezone={storeTimezone}
                value={scheduledAt}
                onChange={setScheduledAt}
              />
            </div>
          </div>

          {fulfillmentType === 'delivery' && (
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="delivery_address">
                Delivery address
              </label>
              <textarea
                id="delivery_address"
                name="delivery_address"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Delivery within {settings.max_radius_miles} miles ·{' '}
                {formatPrice(settings.price_per_mile, { currency: 'usd' })}/mile
              </p>
            </div>
          )}

          {actionData?.error && <p className="text-sm text-red-600">{actionData.error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting || !scheduledAt}
            className="w-full"
          >
            {isSubmitting
              ? 'Saving…'
              : fulfillmentType === 'delivery'
                ? 'Submit delivery request'
                : 'Continue to checkout'}
          </Button>
        </Form>
      </div>
    </Container>
  );
}
