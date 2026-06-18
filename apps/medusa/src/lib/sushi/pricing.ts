/** Medusa product/cart amounts use major currency units; sushi APIs use cents. */
export function majorUnitsFromCents(cents: number): number {
  return cents / 100
}
