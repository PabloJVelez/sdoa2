import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUSHI_COLLECTION_HANDLE, SUSHI_ORDER_FLOW } from "./constants"

/**
 * Ensures a sushi bundle is published to the default sales channel, sushi collection,
 * and carries sushi metadata so the storefront can discover it.
 */
export async function ensureSushiProductStoreReady(
  container: { resolve: (key: string) => unknown },
  productId: string,
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{ data?: Array<Record<string, unknown>> }>
  }
  const storeModule = container.resolve(Modules.STORE) as {
    listStores: () => Promise<Array<{ default_sales_channel_id?: string | null }>>
  }

  const [store] = await storeModule.listStores()
  const salesChannelId = store?.default_sales_channel_id
  if (!salesChannelId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Store default sales channel is not configured. Run init first.",
    )
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "metadata",
      "collection_id",
      "shipping_profile_id",
      "sales_channels.id",
    ],
    filters: { id: productId },
  })
  const product = products?.[0]
  if (!product) return

  const linkedChannels = (product.sales_channels as Array<{ id?: string }> | undefined) ?? []
  const alreadyLinked = linkedChannels.some((channel) => channel.id === salesChannelId)
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const hasSushiMetadata = metadata.order_flow === SUSHI_ORDER_FLOW

  const { data: collections } = await query.graph({
    entity: "product_collection",
    fields: ["id"],
    filters: { handle: SUSHI_COLLECTION_HANDLE },
  })
  const sushiCollectionId = collections?.[0]?.id as string | undefined
  const needsCollection =
    typeof sushiCollectionId === "string" &&
    product.collection_id !== sushiCollectionId

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })
  const defaultShippingProfileId = shippingProfiles?.[0]?.id as string | undefined
  const needsShippingProfile =
    typeof defaultShippingProfileId === "string" &&
    product.shipping_profile_id !== defaultShippingProfileId

  if (
    alreadyLinked &&
    hasSushiMetadata &&
    !needsCollection &&
    !needsShippingProfile
  ) {
    return
  }

  await updateProductsWorkflow(container as never).run({
    input: {
      products: [
        {
          id: productId,
          metadata: {
            ...metadata,
            order_flow: SUSHI_ORDER_FLOW,
          },
          ...(typeof sushiCollectionId === "string"
            ? { collection_id: sushiCollectionId }
            : {}),
          ...(needsShippingProfile && defaultShippingProfileId
            ? { shipping_profile_id: defaultShippingProfileId }
            : {}),
          sales_channels: [{ id: salesChannelId }],
        },
      ],
    },
  })
}
