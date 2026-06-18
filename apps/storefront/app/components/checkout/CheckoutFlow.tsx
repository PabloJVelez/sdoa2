import { Alert } from '@app/components/common/alert/Alert';
import { useCheckout } from '@app/hooks/useCheckout';
import { useCustomer } from '@app/hooks/useCustomer';
import { isDigitalOnlyCart } from '@libs/util/cart/cart-helpers';
import { cartContainsSushiItems, isSushiDeliveryCart } from '@libs/util/sushi';
import { FC, useEffect } from 'react';
import { CheckoutAccountDetails } from './CheckoutAccountDetails';
import { CheckoutDeliveryMethod } from './CheckoutDeliveryMethod';
import { CheckoutPayment } from './CheckoutPayment';
import { CheckoutSushiFulfillmentSummary } from './CheckoutSushiFulfillmentSummary';
import { StripeExpressCheckout } from './StripePayment/StripeExpressPayment';

export const CheckoutFlow: FC = () => {
  const { customer } = useCustomer();
  const { goToNextStep, cart, shippingOptions } = useCheckout();
  const isLoggedIn = !!customer?.id;
  const isDigitalOnly = isDigitalOnlyCart(cart, shippingOptions);
  const isSushiCheckout = cartContainsSushiItems(cart);
  const isSushiDelivery = isSushiDeliveryCart(cart);

  if (!cart) return;

  useEffect(() => {
    if (isLoggedIn) goToNextStep();
    return () => goToNextStep();
  }, [isLoggedIn]); // Only depend on isLoggedIn, not goToNextStep!

  return (
    <>
      <div className="lg:min-h-[calc(100vh-320px)] lg:pl-8">
        {isLoggedIn && (
          <Alert type="info" className="mb-8">
            Checking out as:{' '}
            <strong className="font-bold">
              {customer.first_name} {customer.last_name} ({customer.email})
            </strong>
          </Alert>
        )}

        {!isSushiCheckout && <StripeExpressCheckout cart={cart} />}

        <CheckoutSushiFulfillmentSummary cart={cart} />

        <CheckoutAccountDetails
          isDigitalOnly={isDigitalOnly}
          shippingAddressLabel={isSushiDelivery ? 'Delivery address' : 'Shipping Address'}
        />

        {!isDigitalOnly && !isSushiCheckout && (
          <>
            <hr className="my-10" />
            <CheckoutDeliveryMethod />
          </>
        )}

        <CheckoutPayment isDigitalOnly={isDigitalOnly} />
      </div>
    </>
  );
};
