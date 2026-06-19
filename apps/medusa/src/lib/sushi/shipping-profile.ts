import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUSHI_DELIVERY_FEE_SKU } from "./constants"
import { cartShippingProfilesAreSatisfied } from "./shipping-profile-validation"

type ShippingOptionRow = {
  id?: string
  name?: string
  shipping_profile_id?: string
}

type ShippingProfileRow = {
  id?: string
  name?: string
  type?: string
}

type ProductRow = {
  id?: string
  shipping_profile?: { id?: string | null } | null
}

/**
 * Resolves the shipping profile used by physical/sushi fulfillment options.
 * Must match the profile on Sushi Delivery / Standard Shipping — not every row
 * with type "default" (seed scripts may have created duplicates).
 */
export async function resolvePhysicalShippingProfileId(
  container: MedusaContainer,
): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "shipping_profile_id"],
  })

  const normalized = (options ?? []) as ShippingOptionRow[]
  const sushiDelivery = normalized.find((option) =>
    (option.name ?? "").toLowerCase().includes("sushi delivery"),
  )
  if (typeof sushiDelivery?.shipping_profile_id === "string") {
    return sushiDelivery.shipping_profile_id
  }

  const standard = normalized.find((option) =>
    (option.name ?? "").toLowerCase().includes("standard shipping"),
  )
  if (typeof standard?.shipping_profile_id === "string") {
    return standard.shipping_profile_id
  }

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name", "type"],
    filters: { type: "default" },
  })

  const defaultProfiles = (profiles ?? []) as ShippingProfileRow[]
  const exactDefault = defaultProfiles.find((profile) => profile.name === "Default")
  if (typeof exactDefault?.id === "string") {
    return exactDefault.id
  }

  if (typeof defaultProfiles[0]?.id === "string") {
    return defaultProfiles[0].id
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    "No physical shipping profile found. Run init first.",
  )
}

export async function ensureProductsUsePhysicalShippingProfile(
  container: MedusaContainer,
  productIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))]
  if (!uniqueIds.length) return

  const shippingProfileId = await resolvePhysicalShippingProfileId(container)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "shipping_profile.id"],
    filters: { id: uniqueIds },
  })

  const toUpdate = ((products ?? []) as ProductRow[]).filter((product) => {
    const currentProfileId = product.shipping_profile?.id
    return currentProfileId !== shippingProfileId
  })

  if (!toUpdate.length) return

  await updateProductsWorkflow(container).run({
    input: {
      products: toUpdate.map((product) => ({
        id: String(product.id),
        shipping_profile_id: shippingProfileId,
      })),
    },
  })
}

export async function ensureSushiDeliveryFeeProductShippingProfile(
  container: MedusaContainer,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  type VariantRow = { id?: string; product_id?: string }
  const { data: variants } = (await query.graph({
    entity: "product_variant",
    fields: ["id", "product_id"],
    filters: { sku: SUSHI_DELIVERY_FEE_SKU },
  })) as { data?: VariantRow[] }

  const productId = variants?.[0]?.product_id
  if (typeof productId !== "string") return

  await ensureProductsUsePhysicalShippingProfile(container, [productId])
}

export async function ensureSushiCartProductsShippingProfile(
  container: MedusaContainer,
  cartId: string,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "items.id",
      "items.variant_sku",
      "items.metadata",
      "items.variant.product_id",
    ],
    filters: { id: cartId },
  })

  const items = (carts?.[0]?.items ?? []) as Array<{
    variant?: { product_id?: string | null }
  }>

  const productIds = items
    .map((item) => item.variant?.product_id)
    .filter((id): id is string => typeof id === "string")

  await ensureProductsUsePhysicalShippingProfile(container, productIds)
  await ensureSushiDeliveryFeeProductShippingProfile(container)
}

export async function assertSushiCartShippingProfilesSatisfied(
  container: MedusaContainer,
  cartId: string,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "items.requires_shipping",
      "items.variant.product.shipping_profile.id",
      "shipping_methods.shipping_option_id",
    ],
    filters: { id: cartId },
  })

  const cart = carts?.[0] as
    | {
        items?: Array<{
          requires_shipping?: boolean
          variant?: { product?: { shipping_profile?: { id?: string } } }
        }>
        shipping_methods?: Array<{ shipping_option_id?: string }>
      }
    | undefined

  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }

  const optionIds =
    cart.shipping_methods
      ?.map((method) => method.shipping_option_id)
      .filter((id): id is string => typeof id === "string") ?? []

  let shippingMethodProfileIds: Array<string | undefined> = []

  if (optionIds.length) {
    const { data: options } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "shipping_profile_id"],
      filters: { id: optionIds },
    })
    shippingMethodProfileIds = (options ?? []).map(
      (option) => option.shipping_profile_id as string | undefined,
    )
  }

  const itemProfileIds =
    cart.items
      ?.filter((item) => item.requires_shipping !== false)
      .map((item) => item.variant?.product?.shipping_profile?.id) ?? []

  if (
    !cartShippingProfilesAreSatisfied({
      itemProfileIds,
      shippingMethodProfileIds,
    })
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "The cart items require shipping profiles that are not satisfied by the current shipping methods",
    )
  }
}
