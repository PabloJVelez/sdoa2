import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExecArgs } from "@medusajs/types"
import {
  addToCartWorkflow,
  createCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  assertSushiCartShippingProfilesSatisfied,
  ensureSushiDeliveryFeeProductShippingProfile,
  prepareSushiPaymentCart,
  resolvePhysicalShippingProfileId,
  SUSHI_ORDER_FLOW,
} from "../../src/lib/sushi"
import ensureSushiDeliveryFeeProduct from "../../src/scripts/ensure-sushi-delivery-fee-product"
import init from "../../src/scripts/init"
import { createSushiProductWorkflow } from "../../src/workflows/create-sushi-product"
import { upsertSushiDeliveryFeeLineWorkflow } from "../../src/workflows/upsert-sushi-delivery-fee-line"

jest.setTimeout(180 * 1000)

async function ensureTestStoreSeed(container: ExecArgs["container"]) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id"],
  })

  if (!regions?.length) {
    await init({ container } as ExecArgs)
  }

  await ensureSushiDeliveryFeeProduct({ container } as ExecArgs)
  await ensureSushiDeliveryFeeProductShippingProfile(container)
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    describe("sushi payment checkout preparation", () => {
      it("creates sushi product, prepares payment cart, and satisfies shipping profiles", async () => {
        const container = getContainer()
        await ensureTestStoreSeed(container)

        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        const { data: regions } = await query.graph({
          entity: "region",
          fields: ["id", "currency_code"],
        })
        const region = regions?.[0]
        expect(region?.id).toBeDefined()

        const physicalProfileId =
          await resolvePhysicalShippingProfileId(container)

        const { result: product } = await createSushiProductWorkflow(
          container,
        ).run({
          input: {
            title: `Integration Sushi ${Date.now()}`,
            description: "Integration test sushi product",
            price_cents: 25000,
            inventory_quantity: 5,
          },
        })

        const variantId = product.variants?.[0]?.id
        expect(variantId).toBeDefined()

        const { data: createdProductRows } = await query.graph({
          entity: "product",
          fields: ["id", "shipping_profile.id"],
          filters: { id: product.id },
        })
        expect(createdProductRows?.[0]?.shipping_profile?.id).toEqual(
          physicalProfileId,
        )

        const { result: cart } = await createCartWorkflow(container).run({
          input: {
            region_id: region!.id,
            metadata: {
              order_flow: SUSHI_ORDER_FLOW,
              sushi_fulfillment_type: "delivery",
            },
          },
        })

        await addToCartWorkflow(container).run({
          input: {
            cart_id: cart.id,
            items: [
              {
                variant_id: String(variantId),
                quantity: 2,
                metadata: { order_flow: SUSHI_ORDER_FLOW },
              },
            ],
          },
        })

        await upsertSushiDeliveryFeeLineWorkflow(container).run({
          input: {
            cart_id: cart.id,
            delivery_fee_cents: 1999,
          },
        })

        await prepareSushiPaymentCart(container, cart.id)

        await expect(
          assertSushiCartShippingProfilesSatisfied(container, cart.id),
        ).resolves.toBeUndefined()

        const { data: feeVariantRows } = await query.graph({
          entity: "product_variant",
          fields: ["product_id"],
          filters: { sku: "SUSHI-DELIVERY-FEE" },
        })

        const feeProductId = feeVariantRows?.[0]?.product_id
        expect(feeProductId).toBeDefined()

        const { data: feeProductRows } = await query.graph({
          entity: "product",
          fields: ["id", "shipping_profile.id"],
          filters: { id: feeProductId },
        })

        expect(feeProductRows?.[0]?.shipping_profile?.id).toEqual(
          physicalProfileId,
        )
      })
    })
  },
})
