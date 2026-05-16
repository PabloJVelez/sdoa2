import { CheckoutContext, CheckoutContextValue, CheckoutStep, useNextStep } from '@app/providers/checkout-provider';
import { FetcherCartKeyPrefix } from '@libs/util/fetcher-keys';
import { useContext } from 'react';
import { useFetchers } from 'react-router';

const actions = ({ dispatch }: CheckoutContextValue) => ({
  setStep: (step: CheckoutStep) => dispatch({ name: 'setStep', payload: step }),
});

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  
  if (!context.state) {
    throw new Error('CheckoutProvider state is null');
  }
  
  const nextStep = useNextStep(context.state);
  const { state } = context;
  const fetchers = useFetchers();
  const cartMutationFetchers = fetchers.filter((f) => f.key.startsWith(FetcherCartKeyPrefix));

  if (!state.step) throw new Error('useCheckout must be used within a CheckoutProvider');

  return {
    ...state,
    ...actions(context),
    goToNextStep: () => context.dispatch({ name: 'setStep', payload: nextStep }),
    isCartMutating: cartMutationFetchers.some((f) => ['loading', 'submitting'].includes(f.state)),
  };
};
