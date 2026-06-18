import { Alert, Button, Input, Label, Text, Textarea } from "@medusajs/ui"
import { useState } from "react"
import type { AdminSushiOrderRequestWarningDTO } from "../../../../sdk/admin/admin-sushi-delivery"
import { resolveOrderRequestFoodSubtotalCents } from "../../../../lib/sushi/cart-snapshot"

export type PendingDeliveryRequest = {
  id: string
  customer_email?: string
  customer_name?: string | null
  delivery_address?: string | null
  scheduled_at?: string
  subtotal_cents?: number | null
  cart_snapshot?: unknown
  warnings?: AdminSushiOrderRequestWarningDTO[]
}

type PendingDeliveryRequestCardProps = {
  request: PendingDeliveryRequest
  onConfirm: (input: {
    id: string
    delivery_fee_dollars: number
  }) => void
  onReject: (input: { id: string; rejection_reason?: string }) => void
  isConfirming?: boolean
  isRejecting?: boolean
}

function formatUsd(cents: number | null | undefined) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`
}

function formatScheduled(value?: string) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function resolveSubtotalCents(request: PendingDeliveryRequest): number {
  return resolveOrderRequestFoodSubtotalCents(request)
}

export function PendingDeliveryRequestCard({
  request,
  onConfirm,
  onReject,
  isConfirming,
  isRejecting,
}: PendingDeliveryRequestCardProps) {
  const [deliveryFee, setDeliveryFee] = useState("0")
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)

  const feeDollars = Number.parseFloat(deliveryFee)
  const feeValid = Number.isFinite(feeDollars) && feeDollars >= 0
  const subtotalCents = resolveSubtotalCents(request)
  const warnings = request.warnings ?? []

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <Text weight="plus">
          {request.customer_name || request.customer_email || "Customer"}
        </Text>
        {request.customer_name && request.customer_email ? (
          <Text size="small" className="text-ui-fg-subtle">
            {request.customer_email}
          </Text>
        ) : null}
      </div>
      <Text size="small" className="text-ui-fg-subtle">
        <strong>Scheduled:</strong> {formatScheduled(request.scheduled_at)}
      </Text>
      <Text size="small" className="text-ui-fg-subtle whitespace-pre-wrap">
        <strong>Deliver to:</strong> {request.delivery_address || "—"}
      </Text>
      <Text size="small" className="text-ui-fg-subtle">
        <strong>Food subtotal:</strong> {formatUsd(subtotalCents)}
      </Text>

      {warnings.length > 0 ? (
        <Alert variant="warning">
          <div className="space-y-1">
            <Text size="small" weight="plus">
              Menu changes since this request
            </Text>
            {warnings.map((warning) => (
              <Text key={`${warning.code}-${warning.variant_id ?? warning.message}`} size="small">
                {warning.message}
              </Text>
            ))}
          </div>
        </Alert>
      ) : null}

      {!showReject ? (
        <>
          <div>
            <Label>Delivery fee (USD)</Label>
            <Text size="small" className="text-ui-fg-subtle mb-1">
              Enter the fee for this address. The customer will receive an email with a
              payment link for food + delivery.
            </Text>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="small"
              disabled={!feeValid || isConfirming}
              isLoading={isConfirming}
              onClick={() =>
                onConfirm({
                  id: request.id,
                  delivery_fee_dollars: feeDollars,
                })
              }
            >
              Confirm & send payment link
            </Button>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setShowReject(true)}
            >
              Reject
            </Button>
          </div>
        </>
      ) : (
        <>
          <div>
            <Label>Message to customer (optional)</Label>
            <Textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="danger"
              isLoading={isRejecting}
              onClick={() =>
                onReject({
                  id: request.id,
                  rejection_reason: rejectReason || undefined,
                })
              }
            >
              Send rejection
            </Button>
            <Button size="small" variant="secondary" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
