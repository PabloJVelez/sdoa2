import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text, toast, Badge } from "@medusajs/ui"
import type { AdminSushiOrderRequestDTO } from "../../../sdk/admin/admin-sushi-delivery"
import {
  useAdminConfirmSushiOrderRequest,
  useAdminRejectSushiOrderRequest,
  useAdminListSushiOrderRequests,
} from "../../hooks/sushi-delivery"
import { PendingDeliveryRequestCard } from "./components/PendingDeliveryRequestCard"

const statusLabel: Record<string, string> = {
  pending_confirmation: "Pending",
  confirmed: "Confirmed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  paid: "Paid",
  expired: "Expired",
}

const SushiDeliveryRequestsPage = () => {
  const { data: requestsData, isLoading } = useAdminListSushiOrderRequests()
  const confirmRequest = useAdminConfirmSushiOrderRequest()
  const rejectRequest = useAdminRejectSushiOrderRequest()

  const requests = requestsData?.order_requests ?? []
  const pending = requests.filter((r) => r.status === "pending_confirmation")
  const recent = requests.filter((r) => r.status !== "pending_confirmation").slice(0, 20)

  const handleConfirm = async (
    input: { id: string; delivery_fee_dollars: number },
    request: AdminSushiOrderRequestDTO,
  ) => {
    try {
      const result = await confirmRequest.mutateAsync(input)
      const warningCount =
        result.warnings?.length ?? request.warnings?.length ?? 0
      toast.success("Payment link sent", {
        description:
          warningCount > 0
            ? `Customer emailed. ${warningCount} discontinued item warning(s) were noted.`
            : "The customer was emailed a link to pay.",
      })
    } catch {
      toast.error("Could not confirm request")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Delivery Requests</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          Review out-of-range delivery orders, set fees, and send payment links.
        </Text>
      </div>

      <div className="px-6 py-6 space-y-8">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Heading level="h2">Pending</Heading>
            {pending.length > 0 ? (
              <Badge color="orange">{pending.length}</Badge>
            ) : null}
          </div>
          {isLoading && <Text>Loading…</Text>}
          {!isLoading && pending.length === 0 && (
            <Text className="text-ui-fg-subtle">No pending delivery requests.</Text>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((request) => (
              <PendingDeliveryRequestCard
                key={String(request.id)}
                request={{
                  id: String(request.id),
                  customer_email: request.customer_email,
                  customer_name: request.customer_name,
                  delivery_address: request.delivery_address,
                  scheduled_at: request.scheduled_at,
                  subtotal_cents: request.subtotal_cents,
                  cart_snapshot: request.cart_snapshot,
                  warnings: request.warnings,
                }}
                isConfirming={confirmRequest.isPending}
                isRejecting={rejectRequest.isPending}
                onConfirm={(input) => handleConfirm(input, request)}
                onReject={async (input) => {
                  try {
                    await rejectRequest.mutateAsync(input)
                    toast.success("Request rejected")
                  } catch {
                    toast.error("Could not reject request")
                  }
                }}
              />
            ))}
          </div>
        </section>

        {recent.length > 0 ? (
          <section>
            <Heading level="h2" className="mb-4">
              Recent
            </Heading>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-ui-bg-subtle border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Customer</th>
                    <th className="px-4 py-2 text-left font-medium">Scheduled</th>
                    <th className="px-4 py-2 text-left font-medium">Status</th>
                    <th className="px-4 py-2 text-right font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((request) => (
                    <tr key={String(request.id)} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        {request.customer_email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-ui-fg-subtle">
                        {request.scheduled_at
                          ? new Date(request.scheduled_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {statusLabel[request.status ?? ""] ?? request.status}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {request.delivery_fee_cents != null
                          ? `$${(request.delivery_fee_cents / 100).toFixed(2)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Delivery Requests" })
export const handle = { breadcrumb: () => "Delivery Requests" }
export default SushiDeliveryRequestsPage
