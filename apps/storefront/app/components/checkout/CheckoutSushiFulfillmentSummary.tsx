import { Alert } from '@app/components/common/alert/Alert';
import { cartContainsSushiItems } from '@libs/util/sushi';
import type { StoreCart } from '@medusajs/types';
import { Link } from 'react-router';
import type { FC } from 'react';

function formatScheduledAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const CheckoutSushiFulfillmentSummary: FC<{ cart: StoreCart }> = ({ cart }) => {
  if (!cartContainsSushiItems(cart)) return null;

  const metadata = (cart.metadata ?? {}) as Record<string, unknown>;
  const fulfillmentType = metadata.sushi_fulfillment_type;
  const scheduledAt =
    typeof metadata.sushi_scheduled_at === 'string' ? metadata.sushi_scheduled_at : null;

  if (fulfillmentType !== 'pickup' && fulfillmentType !== 'delivery') {
    return (
      <Alert type="warning" className="mb-8">
        Choose pickup or delivery before checkout.{' '}
        <Link to="/sushi/checkout" className="font-semibold underline">
          Continue to sushi checkout
        </Link>
      </Alert>
    );
  }

  const label = fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery';

  return (
    <Alert type="info" className="mb-8">
      <span className="font-semibold">{label}</span>
      {scheduledAt ? <> scheduled for {formatScheduledAt(scheduledAt)}</> : null}
      {fulfillmentType === 'pickup' && (
        <>
          {' '}
          ·{' '}
          <Link to="/sushi/checkout" className="font-semibold underline">
            Change
          </Link>
        </>
      )}
      {fulfillmentType === 'delivery' && (
        <span className="mt-1 block text-sm">
          Delivery fee is included in your order total from the chef&apos;s confirmation.
        </span>
      )}
    </Alert>
  );
};
