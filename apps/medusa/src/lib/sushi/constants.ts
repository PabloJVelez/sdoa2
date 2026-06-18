export const SUSHI_ORDER_FLOW = "sushi" as const
export const SUSHI_DELIVERY_FEE_LINE_KIND = "sushi_delivery_fee"
export const SUSHI_DELIVERY_FEE_SKU = "SUSHI-DELIVERY-FEE"
export const SUSHI_COLLECTION_HANDLE = "sushi"

export type SushiFulfillmentType = "pickup" | "delivery"

export type SushiCartMetadata = {
  order_flow?: typeof SUSHI_ORDER_FLOW
  sushi_fulfillment_type?: SushiFulfillmentType
  sushi_scheduled_at?: string
  delivery_address?: string
  delivery_miles?: number
  delivery_fee_cents?: number
  delivery_out_of_range?: boolean
}
