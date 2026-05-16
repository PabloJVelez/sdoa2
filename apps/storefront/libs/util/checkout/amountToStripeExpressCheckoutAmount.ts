export const amountToStripeExpressCheckoutAmount = (amount: number) => {
  // Convert dollars to cents and ensure we have a clean integer
  // Stripe requires amounts in the smallest currency unit (cents for USD)
  const amountInCents = Math.round((amount ?? 0) * 100);
  console.log('💰 amountToStripeExpressCheckoutAmount Debug:', {
    originalAmount: amount,
    amountInCents,
    isInteger: Number.isInteger(amountInCents)
  });
  return amountInCents;
};
