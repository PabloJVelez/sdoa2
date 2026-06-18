import { CheckoutFlow } from '@app/components/checkout/CheckoutFlow';
import { CheckoutSidebar } from '@app/components/checkout/CheckoutSidebar';
import { Empty } from '@app/components/common/Empty/Empty';
import { Button } from '@app/components/common/buttons/Button';
import { CheckoutProvider } from '@app/providers/checkout-provider';
import ShoppingCartIcon from '@heroicons/react/24/outline/ShoppingCartIcon';
import {
  filterShippingOptionsForCart,
  hasOnlyDigitalItems,
  isDigitalShippingOption,
  isSushiDeliveryShippingOption,
  isSushiPickupShippingOption,
} from '@libs/util/cart/cart-helpers';
import { cartContainsSushiItems, cartHasSushiFoodItems } from '@libs/util/sushi';
import { sdk, baseMedusaConfig } from '@libs/util/server/client.server';
import { config } from '@libs/util/server/config.server';
import { getCartId, removeCartId } from '@libs/util/server/cookies.server';
import { initiatePaymentSession, retrieveCart, setShippingMethod } from '@libs/util/server/data/cart.server';
import { listCartPaymentProviders } from '@libs/util/server/data/payment.server';
import {
  STRIPE_CONNECT_PROVIDER_ID,
  hasValidStripeConnectPaymentSession,
  isStaleStripeConnectPaymentSession,
} from '@libs/util/stripe/stripe-connect-session';
import { CartDTO, StoreCart, StoreCartShippingOption, StorePaymentProvider } from '@medusajs/types';
import { BasePaymentSession } from '@medusajs/types/dist/http/payment/common';
import { LoaderFunctionArgs, redirect } from 'react-router';
import { Link, useLoaderData } from 'react-router';

const SYSTEM_PROVIDER_ID = 'pp_system_default';

const fetchShippingOptions = async (cartId: string) => {
  if (!cartId) return [];

  try {
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
      cart_id: cartId,
    });
    return shipping_options;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const findCheapestShippingOption = (shippingOptions: StoreCartShippingOption[]) => {
  return shippingOptions.reduce((cheapest, current) => {
    return cheapest.amount <= current.amount ? cheapest : current;
  }, shippingOptions[0]);
};

const prepareSushiCheckout = async (cartId: string, refreshPaymentSessions: boolean) => {
  try {
    await fetch(`${baseMedusaConfig.baseUrl}/store/sushi/carts/${cartId}/prepare-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.MEDUSA_PUBLISHABLE_KEY
          ? { 'x-publishable-api-key': config.MEDUSA_PUBLISHABLE_KEY }
          : {}),
      },
      body: JSON.stringify({ refresh_payment_sessions: refreshPaymentSessions }),
    });
  } catch (e) {
    console.error('Failed to prepare sushi checkout', e);
  }
};

const ensureSelectedCartShippingMethod = async (request: Request, cart: StoreCart) => {
  const shippingOptions = await fetchShippingOptions(cart.id);
  if (shippingOptions.length === 0) return;

  if (cartContainsSushiItems(cart)) {
    const metadata = (cart.metadata ?? {}) as Record<string, unknown>;
    const fulfillmentType = metadata.sushi_fulfillment_type;
    const sushiOption = shippingOptions.find((option) => {
      if (fulfillmentType === 'delivery') {
        return isSushiDeliveryShippingOption(option);
      }
      return isSushiPickupShippingOption(option);
    });

    if (sushiOption) {
      const currentMethod = cart.shipping_methods?.[0];
      if (!currentMethod || currentMethod.shipping_option_id !== sushiOption.id) {
        await setShippingMethod(request, { cartId: cart.id, shippingOptionId: sushiOption.id });
      }
    }
    return;
  }

  // For digital-only carts, always ensure the digital delivery option is selected
  if (hasOnlyDigitalItems(cart)) {
    const digitalOption = shippingOptions.find(isDigitalShippingOption);
    if (digitalOption) {
      const currentMethod = cart.shipping_methods?.[0];
      if (!currentMethod || currentMethod.shipping_option_id !== digitalOption.id) {
        await setShippingMethod(request, { cartId: cart.id, shippingOptionId: digitalOption.id });
      }
      return;
    }
  }

  // For non-digital carts, only auto-select if no method is already set
  if (cart.shipping_methods?.[0]) return;

  if (shippingOptions.length === 1) {
    await setShippingMethod(request, { cartId: cart.id, shippingOptionId: shippingOptions[0].id });
    return;
  }

  const cheapestShippingOption = findCheapestShippingOption(shippingOptions);
  if (cheapestShippingOption) {
    await setShippingMethod(request, { cartId: cart.id, shippingOptionId: cheapestShippingOption.id });
  }
};

const ensureCartPaymentSessions = async (request: Request, cart: StoreCart) => {
  if (!cart) throw new Error('Cart was not provided.');

  let activeSession = cart.payment_collection?.payment_sessions?.find((session) => session.status === 'pending');

  if (!activeSession) {
    const paymentProviders = await listCartPaymentProviders(cart.region_id!);
    if (!paymentProviders.length) return activeSession;

    const provider = paymentProviders.find((p) => p.id !== SYSTEM_PROVIDER_ID) || paymentProviders[0];

    const { payment_collection } = await initiatePaymentSession(request, cart, {
      provider_id: provider.id,
      data: { cart_id: cart.id },
    });

    activeSession = payment_collection.payment_sessions?.find((session) => session.status === 'pending');
  }

  if (activeSession && isStaleStripeConnectPaymentSession(activeSession)) {
    const { payment_collection } = await initiatePaymentSession(request, cart, {
      provider_id: STRIPE_CONNECT_PROVIDER_ID,
      data: { cart_id: cart.id },
    });
    activeSession =
      payment_collection.payment_sessions?.find((session) => session.status === 'pending') ?? activeSession;
  }

  return activeSession as BasePaymentSession;
};

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<{
  cart: StoreCart | null;
  shippingOptions: StoreCartShippingOption[];
  paymentProviders: StorePaymentProvider[];
  activePaymentSession: BasePaymentSession | null;
}> => {
  const cartId = await getCartId(request.headers);

  if (!cartId) {
    return {
      cart: null,
      shippingOptions: [],
      paymentProviders: [],
      activePaymentSession: null,
    };
  }

  let cart = await retrieveCart(request).catch(() => null);

  if (!cart) {
    throw redirect('/');
  }

  if ((cart as { completed_at?: string }).completed_at) {
    const headers = new Headers();
    await removeCartId(headers);

    throw redirect(`/`, { headers });
  }

  if (cartHasSushiFoodItems(cart)) {
    const metadata = (cart.metadata ?? {}) as Record<string, unknown>;
    if (!metadata.sushi_fulfillment_type) {
      throw redirect('/sushi/checkout');
    }
    await prepareSushiCheckout(
      cart.id,
      !hasValidStripeConnectPaymentSession(cart),
    );
    cart = (await retrieveCart(request)) ?? cart;
  }

  await ensureSelectedCartShippingMethod(request, cart);
  cart = (await retrieveCart(request)) ?? cart;

  const [shippingOptions, paymentProviders, activePaymentSession] = await Promise.all([
    fetchShippingOptions(cartId),
    (await listCartPaymentProviders(cart.region_id!)) as StorePaymentProvider[],
    ensureCartPaymentSessions(request, cart),
  ]);

  const updatedCart = (await retrieveCart(request)) ?? cart;
  const resolvedPaymentSession =
    updatedCart.payment_collection?.payment_sessions?.find((session) => session.status === 'pending') ??
    activePaymentSession;

  return {
    cart: updatedCart,
    shippingOptions: filterShippingOptionsForCart(updatedCart, shippingOptions),
    paymentProviders: paymentProviders,
    activePaymentSession: resolvedPaymentSession as BasePaymentSession,
  };
};

export default function CheckoutIndexRoute() {
  const { shippingOptions, paymentProviders, activePaymentSession, cart } = useLoaderData<typeof loader>();

  if (!cart || !cart.items?.length)
    return (
      <Empty
        icon={ShoppingCartIcon}
        title="No items in your cart."
        description="Add items to your cart"
        action={
          <Button variant="primary" as={(buttonProps) => <Link to="/products" {...buttonProps} />}>
            Start shopping
          </Button>
        }
      />
    );

  return (
    <CheckoutProvider
      data={{
        cart: cart as StoreCart | null,
        activePaymentSession: activePaymentSession,
        shippingOptions: shippingOptions,
        paymentProviders: paymentProviders,
      }}
    >
      <section>
        <div className="mx-auto max-w-2xl px-4 pb-8 pt-6 sm:px-6 sm:pb-16 sm:pt-8 lg:max-w-7xl lg:px-8 lg:pb-24 lg:pt-16">
          <div className="lg:grid lg:grid-cols-[4fr_3fr] lg:gap-x-12 xl:gap-x-16">
            <CheckoutFlow />
            <CheckoutSidebar />
          </div>
        </div>
      </section>
    </CheckoutProvider>
  );
}
