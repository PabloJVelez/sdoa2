import { roundMiles } from "./delivery-fee"

export type DrivingDistanceResult =
  | { ok: true; miles: number }
  | { ok: false; error: string }

type RoutesApiResponse = {
  routes?: Array<{
    distanceMeters?: number
  }>
  error?: { message?: string }
}

/**
 * Computes driving distance in miles using Google Routes API (server-side only).
 */
export async function computeDrivingDistanceMiles(
  originAddress: string,
  destinationAddress: string,
  apiKey?: string,
): Promise<DrivingDistanceResult> {
  const key = apiKey ?? process.env.GOOGLE_ROUTES_API_KEY
  if (!key) {
    return { ok: false, error: "Google Routes API key is not configured" }
  }

  if (!originAddress.trim() || !destinationAddress.trim()) {
    return { ok: false, error: "Origin and destination addresses are required" }
  }

  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: originAddress },
          destination: { address: destinationAddress },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
          units: "IMPERIAL",
        }),
      },
    )

    const payload = (await response.json()) as RoutesApiResponse

    if (!response.ok) {
      return {
        ok: false,
        error: payload.error?.message ?? "Failed to calculate driving distance",
      }
    }

    const meters = payload.routes?.[0]?.distanceMeters
    if (typeof meters !== "number") {
      return { ok: false, error: "No route found for the provided addresses" }
    }

    const miles = roundMiles(meters / 1609.344)
    return { ok: true, miles }
  } catch {
    return { ok: false, error: "Unable to reach Google Routes API" }
  }
}
