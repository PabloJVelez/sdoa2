import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

const MAIN_WAREHOUSE_NAME = "Main Warehouse"

type InventoryModule = {
  listInventoryItems: (filters: { sku: string }) => Promise<
    Array<{ id: string; requires_shipping?: boolean }>
  >
  createInventoryItems: (data: Record<string, unknown>) => Promise<{
    id: string
    requires_shipping?: boolean
  }>
  updateInventoryItems: (data: {
    id: string
    requires_shipping: boolean
  }) => Promise<{ id: string; requires_shipping?: boolean }>
  listInventoryLevels: (filters: {
    inventory_item_id: string
    location_id?: string
  }) => Promise<
    Array<{
      stocked_quantity?: number
      reserved_quantity?: number
    }>
  >
  createInventoryLevels: (data: {
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }) => Promise<unknown>
  updateInventoryLevels: (data: {
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }) => Promise<unknown>
}

async function resolveMainWarehouseId(
  container: { resolve: (key: string) => unknown },
): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: {
      entity: string
      fields: string[]
    }) => Promise<{ data?: Array<{ id?: string; name?: string }> }>
  }

  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const stockLocation =
    stockLocations?.find((loc) => loc.name === MAIN_WAREHOUSE_NAME) ??
    stockLocations?.[0]
  const stockLocationId = stockLocation?.id
  if (typeof stockLocationId !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stock location not found. Run init first.",
    )
  }
  return stockLocationId
}

async function ensureVariantInventoryLink(
  container: { resolve: (key: string) => unknown },
  input: { variantId: string; inventoryItemId: string },
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: {
      entity: string
      fields: string[]
      filters?: Record<string, unknown>
    }) => Promise<{
      data?: Array<{
        inventory_items?: Array<{ inventory_item_id?: string }>
      }>
    }>
  }
  const remoteLink = container.resolve(ContainerRegistrationKeys.LINK) as {
    create: (links: Array<Record<string, unknown>>) => Promise<unknown>
  }

  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["id", "inventory_items.inventory_item_id"],
    filters: { id: input.variantId },
  })

  const linkedIds = (data?.[0]?.inventory_items ?? [])
    .map((row) => row.inventory_item_id)
    .filter((id): id is string => typeof id === "string")

  if (linkedIds.includes(input.inventoryItemId)) {
    return
  }

  await remoteLink.create([
    {
      [Modules.PRODUCT]: { variant_id: input.variantId },
      [Modules.INVENTORY]: { inventory_item_id: input.inventoryItemId },
      data: { required_quantity: 1 },
    },
  ])
}

export async function getVariantAvailableQuantity(
  container: { resolve: (key: string) => unknown },
  input: { variantSku: string },
): Promise<number> {
  const inventoryModule = container.resolve(
    Modules.INVENTORY,
  ) as InventoryModule
  const stockLocationId = await resolveMainWarehouseId(container)

  const items = await inventoryModule.listInventoryItems({ sku: input.variantSku })
  if (!items.length) {
    return 0
  }

  const levels = await inventoryModule.listInventoryLevels({
    inventory_item_id: items[0].id,
    location_id: stockLocationId,
  })

  return levels.reduce((total, level) => {
    const stocked = Number(level.stocked_quantity ?? 0)
    const reserved = Number(level.reserved_quantity ?? 0)
    return total + Math.max(0, stocked - reserved)
  }, 0)
}

export async function setVariantInventoryQuantity(
  container: { resolve: (key: string) => unknown },
  input: {
    variantId: string
    variantSku: string
    variantTitle: string
    quantity: number
  },
) {
  const inventoryModule = container.resolve(
    Modules.INVENTORY,
  ) as InventoryModule
  const stockLocationId = await resolveMainWarehouseId(container)
  const quantity = Math.max(0, input.quantity)

  const existingItems = await inventoryModule.listInventoryItems({
    sku: input.variantSku,
  })
  let inventoryItem = existingItems[0]

  if (!inventoryItem) {
    inventoryItem = await inventoryModule.createInventoryItems({
      sku: input.variantSku,
      requires_shipping: true,
      title: input.variantTitle,
    })
  } else if (inventoryItem.requires_shipping !== true) {
    inventoryItem = await inventoryModule.updateInventoryItems({
      id: inventoryItem.id,
      requires_shipping: true,
    })
  }

  await ensureVariantInventoryLink(container, {
    variantId: input.variantId,
    inventoryItemId: inventoryItem.id,
  })

  const existingLevels = await inventoryModule.listInventoryLevels({
    inventory_item_id: inventoryItem.id,
    location_id: stockLocationId,
  })

  if (existingLevels.length === 0) {
    await inventoryModule.createInventoryLevels({
      inventory_item_id: inventoryItem.id,
      location_id: stockLocationId,
      stocked_quantity: quantity,
    })
  } else {
    await inventoryModule.updateInventoryLevels({
      inventory_item_id: inventoryItem.id,
      location_id: stockLocationId,
      stocked_quantity: quantity,
    })
  }
}
