/**
 * Pure helpers mirroring Medusa complete-cart shipping profile validation.
 */
export function getMissingShippingProfileIds(
  requiredProfileIds: Array<string | undefined | null>,
  availableProfileIds: Array<string | undefined | null>,
): string[] {
  const available = availableProfileIds.filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  )

  const missing = new Set<string>()

  for (const profileId of requiredProfileIds) {
    if (!profileId) {
      missing.add("__undefined__")
      continue
    }
    if (!available.includes(profileId)) {
      missing.add(profileId)
    }
  }

  return [...missing]
}

export function cartShippingProfilesAreSatisfied(input: {
  itemProfileIds: Array<string | undefined | null>
  shippingMethodProfileIds: Array<string | undefined | null>
}): boolean {
  return (
    getMissingShippingProfileIds(
      input.itemProfileIds,
      input.shippingMethodProfileIds,
    ).length === 0
  )
}
