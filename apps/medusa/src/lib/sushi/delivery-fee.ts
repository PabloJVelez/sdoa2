/**
 * Delivery fee in cents from driving miles and price per mile (USD).
 * Rounds to the nearest cent.
 */
export function calculateDeliveryFeeCents(
  miles: number,
  pricePerMile: number,
): number {
  if (!Number.isFinite(miles) || miles < 0) {
    throw new Error("Invalid delivery distance")
  }
  if (!Number.isFinite(pricePerMile) || pricePerMile < 0) {
    throw new Error("Invalid price per mile")
  }
  return Math.round(miles * pricePerMile * 100)
}

export function roundMiles(miles: number): number {
  return Math.round(miles * 100) / 100
}

export function isWithinDeliveryRadius(
  miles: number,
  maxRadiusMiles: number,
): boolean {
  return miles <= maxRadiusMiles
}
