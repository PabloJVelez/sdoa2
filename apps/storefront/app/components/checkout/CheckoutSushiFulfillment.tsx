import { Button } from '@app/components/common/buttons/Button';
import { SushiSchedulePicker } from '@app/components/sushi/SushiSchedulePicker';
import { useCheckout } from '@app/hooks/useCheckout';
import { cartContainsSushiItems } from '@libs/util/sushi';
import { formatPrice } from '@libs/util/prices';
import { FC, useEffect, useState } from 'react';
import { useFetcher } from 'react-router';

type DeliverySettings = {
  enable_pickup: boolean;
  enable_delivery: boolean;
  allowed_days: Array<{ day: string; windows: Array<{ start: string; end: string }> }>;
  store_timezone: string;
  price_per_mile: number;
  max_radius_miles: number;
};

export const CheckoutSushiFulfillment: FC = () => {
  const { cart } = useCheckout();
  const fetcher = useFetcher<{ error?: string; outOfRange?: boolean; orderRequestId?: string; miles?: number; deliveryFeeCents?: number }>();
  const settingsFetcher = useFetcher<{ settings?: DeliverySettings | null }>();

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [scheduledAt, setScheduledAt] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [quote, setQuote] = useState<{ miles: number; deliveryFeeCents: number } | null>(null);

  const isSushi = cartContainsSushiItems(cart);
  const metadata = (cart?.metadata ?? {}) as Record<string, unknown>;

  useEffect(() => {
    if (isSushi) {
      settingsFetcher.load('/api/sushi/delivery-settings');
    }
  }, [isSushi]);

  useEffect(() => {
    if (fetcher.data?.outOfRange && fetcher.data.orderRequestId) {
      window.location.href = `/sushi/request-confirmed?order_request_id=${fetcher.data.orderRequestId}`;
    }
    if (fetcher.data && !fetcher.data.outOfRange && fetcher.data.deliveryFeeCents != null) {
      setQuote({
        miles: fetcher.data.miles ?? 0,
        deliveryFeeCents: fetcher.data.deliveryFeeCents,
      });
    }
  }, [fetcher.data]);

  if (!isSushi) return null;

  const settings = settingsFetcher.data?.settings;
  const pendingOutOfRange = metadata.delivery_out_of_range === true;

  const handleSubmit = () => {
    const formData = new FormData();
    formData.set('fulfillment_type', fulfillmentType);
    formData.set('scheduled_at', scheduledAt);
    if (fulfillmentType === 'delivery') {
      formData.set('delivery_address', deliveryAddress);
    }
    if (cart?.email) formData.set('customer_email', cart.email);
    fetcher.submit(formData, {
      method: 'post',
      action: '/api/checkout/sushi-fulfillment',
    });
  };

  return (
    <>
      <hr className="my-10" />
      <h2 className="text-2xl font-bold text-gray-900">Pickup or delivery</h2>
      {pendingOutOfRange && (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          Delivery is pending chef confirmation. Complete payment only after the chef confirms your
          request.
        </p>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          {settings?.enable_pickup && (
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fulfillment_type"
                checked={fulfillmentType === 'pickup'}
                onChange={() => setFulfillmentType('pickup')}
              />
              Pickup
            </label>
          )}
          {settings?.enable_delivery && (
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="fulfillment_type"
                checked={fulfillmentType === 'delivery'}
                onChange={() => setFulfillmentType('delivery')}
              />
              Delivery
            </label>
          )}
        </div>

        {settings ? (
          <div>
            <p className="text-sm font-medium text-gray-700">Date &amp; time</p>
            <div className="mt-1">
              <SushiSchedulePicker
                allowedDays={settings.allowed_days}
                storeTimezone={settings.store_timezone}
                value={scheduledAt}
                onChange={setScheduledAt}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">Loading available pickup and delivery times…</p>
        )}

        {fulfillmentType === 'delivery' && (
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor="delivery_address">
              Delivery address
            </label>
            <textarea
              id="delivery_address"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
            />
            {settings && (
              <p className="mt-1 text-xs text-gray-500">
                Delivery within {settings.max_radius_miles} miles ·{' '}
                {formatPrice(settings.price_per_mile, { currency: 'usd' })}/mile
              </p>
            )}
          </div>
        )}

        {quote && fulfillmentType === 'delivery' && (
          <p className="text-sm text-gray-700">
            Estimated {quote.miles} mi · delivery fee{' '}
            {formatPrice(quote.deliveryFeeCents, { currency: 'usd', inCents: true })}
          </p>
        )}

        {fetcher.data?.error && (
          <p className="text-sm text-red-600">{fetcher.data.error}</p>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={fetcher.state !== 'idle' || !scheduledAt || !settings}
        >
          {fetcher.state !== 'idle' ? 'Saving…' : 'Save fulfillment details'}
        </Button>
      </div>
    </>
  );
};
