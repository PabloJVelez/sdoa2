import {
  calculateDeliveryFeeCents,
  isWithinDeliveryRadius,
  roundMiles,
} from "../sushi/delivery-fee"
import { computeFoodSubtotalCents, resolveOrderRequestFoodSubtotalCents } from "../sushi/cart-snapshot"
import {
  buildSushiPaymentCheckoutUrl,
} from "../sushi/email-helpers"
import {
  cartContainsEventItems,
  cartContainsSushiItems,
  isSushiProduct,
} from "../sushi/product"
import { validateScheduledSlot } from "../sushi/schedule"

describe("sushi cart snapshot subtotal", () => {
  it("sums line unit_price in major units and returns cents", () => {
    expect(
      computeFoodSubtotalCents([
        { unit_price: 250, quantity: 2 },
      ]),
    ).toBe(50000)
  })

  it("excludes delivery fee lines from food subtotal", () => {
    expect(
      computeFoodSubtotalCents([
        { unit_price: 250, quantity: 1 },
        {
          unit_price: 19.99,
          quantity: 1,
          variant_sku: "SUSHI-DELIVERY-FEE",
          metadata: { kind: "sushi_delivery_fee" },
        },
      ]),
    ).toBe(25000)
  })
})

describe("resolveOrderRequestFoodSubtotalCents", () => {
  it("prefers cart snapshot over stored subtotal_cents", () => {
    expect(
      resolveOrderRequestFoodSubtotalCents({
        subtotal_cents: 5_000_000,
        cart_snapshot: {
          items: [{ unit_price: 250, quantity: 2 }],
        },
      }),
    ).toBe(50000)
  })
})

describe("sushi payment link", () => {
  it("builds pay route on storefront", () => {
    expect(buildSushiPaymentCheckoutUrl("req_abc123")).toBe(
      "http://localhost:3000/sushi/pay/req_abc123",
    )
  })
})

describe("sushi delivery fee", () => {
  it("calculates fee as miles times price per mile rounded to cents", () => {
    expect(calculateDeliveryFeeCents(10, 2)).toBe(2000)
    expect(calculateDeliveryFeeCents(3.5, 2)).toBe(700)
    expect(calculateDeliveryFeeCents(2.333, 2)).toBe(467)
  })

  it("rounds miles to two decimal places", () => {
    expect(roundMiles(12.3456)).toBe(12.35)
  })

  it("checks delivery radius inclusively at max", () => {
    expect(isWithinDeliveryRadius(15, 15)).toBe(true)
    expect(isWithinDeliveryRadius(15.01, 15)).toBe(false)
  })
})

describe("sushi product helpers", () => {
  it("detects sushi via metadata and collection", () => {
    expect(isSushiProduct({ metadata: { order_flow: "sushi" } })).toBe(true)
    expect(isSushiProduct({ collection: { handle: "sushi" } })).toBe(true)
    expect(
      isSushiProduct({
        metadata: {},
        collection: { handle: "sushi" },
      }),
    ).toBe(true)
    expect(isSushiProduct({ metadata: {} })).toBe(false)
  })

  it("does not treat delivery fee SKU as sushi food", () => {
    expect(
      cartContainsSushiItems([
        { variant_sku: "SUSHI-DELIVERY-FEE", metadata: { kind: "sushi_delivery_fee" } },
      ]),
    ).toBe(false)
  })

  it("detects sushi food via SUSHI-* SKU", () => {
    expect(
      cartContainsSushiItems([{ variant_sku: "SUSHI-spicy-tuna", metadata: {} }]),
    ).toBe(true)
  })

  it("detects sushi and event items in carts", () => {
    expect(
      cartContainsSushiItems([
        { metadata: { order_flow: "sushi" }, variant_sku: "SUSHI-1" },
      ]),
    ).toBe(true)
    expect(
      cartContainsEventItems([
        { variant_sku: "EVENT-abc-2026-01-01-class", metadata: {} },
      ]),
    ).toBe(true)
    expect(
      cartContainsEventItems([
        { metadata: { chef_event_id: "evt_1" }, variant_sku: "SYS" },
      ]),
    ).toBe(true)
  })
})

describe("event checkout isolation", () => {
  it("does not treat event ticket lines as sushi", () => {
    expect(
      cartContainsSushiItems([
        { variant_sku: "EVENT-x-2026-01-01-class", metadata: {} },
      ]),
    ).toBe(false)
    expect(
      cartContainsEventItems([
        { variant_sku: "EVENT-x-2026-01-01-class", metadata: {} },
      ]),
    ).toBe(true)
  })
})

describe("sushi schedule validation", () => {
  const allowedDays = [
    {
      day: "friday",
      windows: [{ start: "11:00", end: "20:00" }],
    },
  ]

  it("rejects times outside allowed windows", () => {
    const fridayMorning = new Date()
    fridayMorning.setDate(
      fridayMorning.getDate() + ((5 - fridayMorning.getDay() + 7) % 7 || 7),
    )
    fridayMorning.setHours(9, 0, 0, 0)

    const result = validateScheduledSlot(
      fridayMorning.toISOString(),
      allowedDays,
    )
    expect(result.valid).toBe(false)
  })

  it("accepts a valid future slot on an allowed day", () => {
    const fridayAfternoon = new Date()
    const daysUntilFriday = (5 - fridayAfternoon.getDay() + 7) % 7 || 7
    fridayAfternoon.setDate(fridayAfternoon.getDate() + daysUntilFriday)
    fridayAfternoon.setHours(14, 0, 0, 0)

    const result = validateScheduledSlot(
      fridayAfternoon.toISOString(),
      allowedDays,
    )
    expect(result.valid).toBe(true)
  })
})
