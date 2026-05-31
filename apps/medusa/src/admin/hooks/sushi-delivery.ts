import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../sdk"
import type {
  AdminSushiDeliverySettingsDTO,
  AdminUpdateSushiDeliverySettingsDTO,
} from "../../sdk/admin/admin-sushi-delivery"

const SETTINGS_KEY = ["sushi-delivery-settings"]
const PRODUCTS_KEY = ["sushi-products"]
const REQUESTS_KEY = ["sushi-order-requests"]

export const useAdminSushiDeliverySettings = () => {
  return useQuery<AdminSushiDeliverySettingsDTO>({
    queryKey: SETTINGS_KEY,
    queryFn: () => sdk.admin.sushiDelivery.getSettings(),
  })
}

export const useAdminUpdateSushiDeliverySettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AdminUpdateSushiDeliverySettingsDTO) =>
      sdk.admin.sushiDelivery.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY })
    },
  })
}

export const useAdminListSushiProducts = () => {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: () => sdk.admin.sushiDelivery.listProducts(),
  })
}

export const useAdminCreateSushiProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof sdk.admin.sushiDelivery.createProduct>[0]) =>
      sdk.admin.sushiDelivery.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}

export const useAdminUpdateSushiProduct = (id: string | null) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof sdk.admin.sushiDelivery.updateProduct>[1]) => {
      if (!id) {
        throw new Error("No product selected for update")
      }
      return sdk.admin.sushiDelivery.updateProduct(id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
    },
  })
}

export const useAdminListSushiOrderRequests = () => {
  return useQuery({
    queryKey: REQUESTS_KEY,
    queryFn: () => sdk.admin.sushiDelivery.listOrderRequests(),
  })
}

export const useAdminConfirmSushiOrderRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      delivery_fee_dollars,
    }: {
      id: string
      delivery_fee_dollars: number
    }) =>
      sdk.admin.sushiDelivery.confirmOrderRequest(id, {
        delivery_fee_cents: Math.round(delivery_fee_dollars * 100),
        send_payment_email: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY })
    },
  })
}

export const useAdminRejectSushiOrderRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      rejection_reason,
    }: {
      id: string
      rejection_reason?: string
    }) => sdk.admin.sushiDelivery.rejectOrderRequest(id, { rejection_reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY })
    },
  })
}

export const useAdminUpdateSushiOrderRequest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      status: "confirmed" | "rejected" | "cancelled"
      rejection_reason?: string
    }) => sdk.admin.sushiDelivery.updateOrderRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_KEY })
    },
  })
}
