import { getSmallestUnit } from '../../modules/stripe-connect/utils/get-smallest-unit';

describe('getSmallestUnit', () => {
  it('multiplies USD major units by 100', () => {
    expect(getSmallestUnit(14.99, 'usd')).toBe(1499);
    expect(getSmallestUnit(250, 'usd')).toBe(25000);
  });
});
