import {
  resolveMajorAmount,
  resolveStripeAmountInCents,
  getSmallestUnit,
} from '../../modules/stripe-connect/utils/get-smallest-unit';

describe('resolveStripeAmountInCents', () => {
  it('converts Medusa major currency amounts to Stripe cents', () => {
    expect(resolveStripeAmountInCents(1014.99, 'usd')).toBe(101499);
    expect(resolveStripeAmountInCents(515.99, 'usd')).toBe(51599);
    expect(resolveStripeAmountInCents(250, 'usd')).toBe(25000);
  });

  it('resolves Medusa BigNumber raw amounts', () => {
    expect(
      resolveStripeAmountInCents(
        { value: '1014.99', precision: 20 },
        'usd',
      ),
    ).toBe(101499);
  });

  it('resolves numeric major amounts from BigNumberInput', () => {
    expect(resolveMajorAmount({ numeric: 1014.99 })).toBe(1014.99);
  });
});

describe('getSmallestUnit', () => {
  it('multiplies USD major units by 100', () => {
    expect(getSmallestUnit(14.99, 'usd')).toBe(1499);
  });
});
