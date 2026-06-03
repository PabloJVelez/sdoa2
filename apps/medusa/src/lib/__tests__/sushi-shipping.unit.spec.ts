import {
  buildDesiredFoodLinesFromSnapshot,
  foodLineQuantitiesMatch,
  groupFoodQuantitiesByVariant,
} from "../sushi/repair-payment-cart-helpers"
import {
  cartShippingProfilesAreSatisfied,
  getMissingShippingProfileIds,
} from "../sushi/shipping-profile-validation"

describe("shipping profile validation", () => {
  it("detects when cart item profiles are not covered by shipping methods", () => {
    const physicalProfile = "sp_physical"
    const digitalProfile = "sp_digital"

    expect(
      cartShippingProfilesAreSatisfied({
        itemProfileIds: [physicalProfile, physicalProfile],
        shippingMethodProfileIds: [physicalProfile],
      }),
    ).toBe(true)

    expect(
      cartShippingProfilesAreSatisfied({
        itemProfileIds: [physicalProfile],
        shippingMethodProfileIds: [digitalProfile],
      }),
    ).toBe(false)

    expect(
      getMissingShippingProfileIds([physicalProfile], [digitalProfile]),
    ).toEqual([physicalProfile])
  })

  it("flags missing profiles when product shipping profile is undefined", () => {
    expect(
      getMissingShippingProfileIds([undefined], ["sp_default"]),
    ).toEqual(["__undefined__"])
  })
})

describe("sushi payment cart food line rebuild helpers", () => {
  const requestId = "req_original"

  it("prefers snapshot lines tagged with the order request id", () => {
    const lines = buildDesiredFoodLinesFromSnapshot(
      {
        items: [
          {
            variant_id: "variant_a",
            quantity: 2,
            metadata: { sushi_order_request_id: requestId },
          },
          {
            variant_id: "variant_a",
            quantity: 1,
            metadata: { order_flow: "sushi" },
          },
        ],
      },
      requestId,
      { order_flow: "sushi", sushi_order_request_id: requestId },
    )

    expect(lines).toEqual([
      {
        variant_id: "variant_a",
        quantity: 2,
        metadata: { order_flow: "sushi", sushi_order_request_id: requestId },
      },
    ])
  })

  it("groups duplicate variant lines by total quantity when no request id filter applies", () => {
    const lines = buildDesiredFoodLinesFromSnapshot(
      {
        items: [
          { variant_id: "variant_a", quantity: 1 },
          { variant_id: "variant_a", quantity: 2 },
        ],
      },
      null,
      { order_flow: "sushi" },
    )

    expect(lines).toEqual([
      {
        variant_id: "variant_a",
        quantity: 3,
        metadata: { order_flow: "sushi" },
      },
    ])
  })

  it("compares grouped food line quantities", () => {
    const desired = groupFoodQuantitiesByVariant([
      { variant_id: "variant_a", quantity: 2 },
    ])
    const matching = groupFoodQuantitiesByVariant([
      { variant_id: "variant_a", quantity: 2 },
    ])
    const mismatch = groupFoodQuantitiesByVariant([
      { variant_id: "variant_a", quantity: 1 },
    ])

    expect(foodLineQuantitiesMatch(desired, matching)).toBe(true)
    expect(foodLineQuantitiesMatch(desired, mismatch)).toBe(false)
  })
})
