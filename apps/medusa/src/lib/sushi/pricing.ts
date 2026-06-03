/** Convert integer cents (API / delivery quotes) to Medusa major currency units. */
export function majorUnitsFromCents(cents: number): number {
  return Math.round(cents) / 100
}
