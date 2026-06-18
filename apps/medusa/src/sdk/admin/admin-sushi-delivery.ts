import type { Client } from "@medusajs/js-sdk"
import type { AllowedDaySchedule } from "../../lib/sushi/schedule"

export interface AdminSushiDeliverySettingsDTO {
  id: string
  origin_address: string
  pickup_address: string
  store_timezone: string
  price_per_mile: number
  max_radius_miles: number
  allowed_days: AllowedDaySchedule[]
  enable_pickup: boolean
  enable_delivery: boolean
}

export interface AdminUpdateSushiDeliverySettingsDTO {
  origin_address?: string
  pickup_address?: string
  store_timezone?: string
  price_per_mile?: number
  max_radius_miles?: number
  allowed_days?: AllowedDaySchedule[]
  enable_pickup?: boolean
  enable_delivery?: boolean
}

export type AdminSushiOrderRequestWarningDTO = {
  code: "discontinued_variant"
  message: string
  variant_id?: string
  product_title?: string
}

export type AdminSushiOrderRequestDTO = {
  id: string
  status: string
  customer_email?: string
  customer_name?: string | null
  delivery_address?: string | null
  scheduled_at?: string
  subtotal_cents?: number | null
  delivery_fee_cents?: number | null
  cart_snapshot?: unknown
  created_at?: string
  warnings?: AdminSushiOrderRequestWarningDTO[]
}

export interface AdminSushiProductImageDTO {
  id: string
  url: string
  rank?: number
}

export interface AdminSushiProductDTO {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string | null
  images?: AdminSushiProductImageDTO[]
  status: string
  variants?: Array<{
    id: string
    sku?: string
    inventory_quantity?: number
    prices?: Array<{ amount?: number }>
  }>
}

export type AdminSushiProductWriteDTO = {
  title: string
  description?: string
  price_cents: number
  inventory_quantity?: number
  images?: string[]
  thumbnail?: string | null
  status?: "draft" | "published"
}

export type AdminSushiProductUpdateDTO = Partial<AdminSushiProductWriteDTO>

export class AdminSushiDeliveryResource {
  constructor(private client: Client) {}

  async getSettings() {
    const response = await this.client.fetch<{ settings: AdminSushiDeliverySettingsDTO }>(
      `/admin/sushi-delivery-settings`,
      { method: "GET" },
    )
    return response.settings
  }

  async updateSettings(data: AdminUpdateSushiDeliverySettingsDTO) {
    const response = await this.client.fetch<{ settings: AdminSushiDeliverySettingsDTO }>(
      `/admin/sushi-delivery-settings`,
      { method: "PUT", body: data },
    )
    return response.settings
  }

  async listProducts() {
    return this.client.fetch<{ products: AdminSushiProductDTO[] }>(
      `/admin/sushi-products`,
      { method: "GET" },
    )
  }

  async createProduct(data: AdminSushiProductWriteDTO) {
    const response = await this.client.fetch<{ product: AdminSushiProductDTO }>(
      `/admin/sushi-products`,
      { method: "POST", body: data },
    )
    return response.product
  }

  async updateProduct(id: string, data: AdminSushiProductUpdateDTO) {
    const response = await this.client.fetch<{ product: AdminSushiProductDTO }>(
      `/admin/sushi-products/${id}`,
      { method: "PUT", body: data },
    )
    return response.product
  }

  async listOrderRequests() {
    return this.client.fetch<{ order_requests: AdminSushiOrderRequestDTO[] }>(
      `/admin/sushi-order-requests`,
      { method: "GET" },
    )
  }

  async confirmOrderRequest(
    id: string,
    data: {
      delivery_fee_dollars?: number
      delivery_fee_cents?: number
      send_payment_email?: boolean
    },
  ) {
    return this.client.fetch<{
      order_request: AdminSushiOrderRequestDTO
      warnings?: AdminSushiOrderRequestWarningDTO[]
    }>(`/admin/sushi-order-requests/${id}/confirm`, {
      method: "POST",
      body: data,
    })
  }

  async rejectOrderRequest(id: string, data?: { rejection_reason?: string }) {
    const response = await this.client.fetch<{
      order_request: AdminSushiOrderRequestDTO
    }>(`/admin/sushi-order-requests/${id}/reject`, {
      method: "POST",
      body: data ?? {},
    })
    return response.order_request
  }

  async updateOrderRequest(
    id: string,
    data: { status: "confirmed" | "rejected" | "cancelled"; rejection_reason?: string },
  ) {
    const response = await this.client.fetch<{ order_request: AdminSushiOrderRequestDTO }>(
      `/admin/sushi-order-requests/${id}`,
      { method: "PUT", body: data },
    )
    return response.order_request
  }
}
