import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { isSushiDeliveryFeeLine } from "./product"
import {
  resolveMainWarehouseId,
  setVariantInventoryQuantity,
} from "./variant-inventory"

export async function ensureDefaultSalesChannelStockLocationLink(
  container: { resolve: (key: string) => unknown },
): Promise<{ salesChannelId: string; stockLocationId: string }> {
  const storeModule = container.resolve(Modules.STORE) as {
    listStores: () => Promise<Array<{ default_sales_channel_id?: string | null }>>
  }
  const [store] = await storeModule.listStores()
  const salesChannelId = store?.default_sales_channel_id

  if (typeof salesChannelId !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Store default sales channel is not configured. Run init first.",
    )
  }

  const stockLocationId = await resolveMainWarehouseId(container)

  try {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocationId,
        add: [salesChannelId],
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!/already|exist|duplicate/i.test(message)) {
      throw error
    }
  }

  return { salesChannelId, stockLocationId }
}

export async function ensureSushiCartInventoryReady(
  container: { resolve: (key: string) => unknown },
  cartId: string,
): Promise<void> {
  await ensureDefaultSalesChannelStockLocationLink(container)

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{
      data?: Array<{
        items?: Array<{
          variant_id?: string
          variant_sku?: string | null
          title?: string | null
          metadata?: Record<string, unknown> | null
          variant?: {
            id?: string
            sku?: string | null
            title?: string | null
            manage_inventory?: boolean
          } | null
        }>
      }>
    }>
  }

  const inventoryModule = container.resolve(Modules.INVENTORY) as {
    listInventoryItems: (filters: { sku: string }) => Promise<Array<{ id: string }>>
    listInventoryLevels: (filters: {
      inventory_item_id: string
      location_id?: string
    }) => Promise<Array<{ stocked_quantity?: number }>>
  }

  const stockLocationId = await resolveMainWarehouseId(container)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "items.variant_id",
      "items.variant_sku",
      "items.title",
      "items.metadata",
      "items.variant.id",
      "items.variant.sku",
      "items.variant.title",
      "items.variant.manage_inventory",
    ],
    filters: { id: cartId },
  })

  const items = carts?.[0]?.items ?? []
  const seenVariantIds = new Set<string>()

  for (const item of items) {
    if (isSushiDeliveryFeeLine(item)) continue

    const variantId = item.variant?.id ?? item.variant_id
    const variantSku = item.variant?.sku ?? item.variant_sku
    const manageInventory = item.variant?.manage_inventory

    if (typeof variantId !== "string" || seenVariantIds.has(variantId)) {
      continue
    }
    seenVariantIds.add(variantId)

    if (manageInventory === false) {
      continue
    }

    if (typeof variantSku !== "string" || !variantSku.length) {
      continue
    }

    const inventoryItems = await inventoryModule.listInventoryItems({
      sku: variantSku,
    })
    const inventoryItem = inventoryItems[0]

    let stockedQuantity = 0
    if (inventoryItem) {
      const levels = await inventoryModule.listInventoryLevels({
        inventory_item_id: inventoryItem.id,
        location_id: stockLocationId,
      })
      stockedQuantity = Number(levels[0]?.stocked_quantity ?? 0)
    }

    await setVariantInventoryQuantity(container, {
      variantId,
      variantSku,
      variantTitle: item.variant?.title ?? item.title ?? "Sushi bundle",
      quantity: stockedQuantity,
    })
  }
}
