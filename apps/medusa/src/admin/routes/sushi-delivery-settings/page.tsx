import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Switch, Text, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  useAdminSushiDeliverySettings,
  useAdminUpdateSushiDeliverySettings,
  useAdminListSushiOrderRequests,
  useAdminUpdateSushiOrderRequest,
} from "../../hooks/sushi-delivery"
import { DEFAULT_ALLOWED_DAYS } from "../../../lib/sushi/schedule"

const SushiDeliverySettingsPage = () => {
  const { data: settings, isLoading } = useAdminSushiDeliverySettings()
  const updateMutation = useAdminUpdateSushiDeliverySettings()
  const { data: requestsData } = useAdminListSushiOrderRequests()
  const updateRequest = useAdminUpdateSushiOrderRequest()

  const [originAddress, setOriginAddress] = useState("")
  const [pricePerMile, setPricePerMile] = useState("2")
  const [maxRadius, setMaxRadius] = useState("15")
  const [scheduleJson, setScheduleJson] = useState(
    JSON.stringify(DEFAULT_ALLOWED_DAYS, null, 2),
  )
  const [enablePickup, setEnablePickup] = useState(true)
  const [enableDelivery, setEnableDelivery] = useState(true)

  useEffect(() => {
    if (!settings) return
    setOriginAddress(settings.origin_address)
    setPricePerMile(String(settings.price_per_mile))
    setMaxRadius(String(settings.max_radius_miles))
    setScheduleJson(JSON.stringify(settings.allowed_days, null, 2))
    setEnablePickup(settings.enable_pickup)
    setEnableDelivery(settings.enable_delivery)
  }, [settings])

  const handleSave = async () => {
    let allowedDays = DEFAULT_ALLOWED_DAYS
    try {
      allowedDays = JSON.parse(scheduleJson)
    } catch {
      return
    }

    await updateMutation.mutateAsync({
      origin_address: originAddress,
      price_per_mile: Number(pricePerMile),
      max_radius_miles: Number(maxRadius),
      allowed_days: allowedDays,
      enable_pickup: enablePickup,
      enable_delivery: enableDelivery,
    })
  }

  type PendingRequest = {
    id: string
    status?: string
    customer_email?: string
    delivery_miles?: number
    delivery_address?: string | null
  }
  const pendingRequests = (
    (requestsData?.order_requests as PendingRequest[] | undefined) ?? []
  ).filter((r) => r.status === "pending_confirmation")

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Sushi Delivery Settings</Heading>
        <Button onClick={handleSave} isLoading={updateMutation.isPending}>
          Save settings
        </Button>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          {isLoading && <Text>Loading…</Text>}
          <div>
            <Label>Pickup / origin address</Label>
            <Textarea
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price per mile (USD)</Label>
              <Input value={pricePerMile} onChange={(e) => setPricePerMile(e.target.value)} />
            </div>
            <div>
              <Label>Max delivery radius (miles)</Label>
              <Input value={maxRadius} onChange={(e) => setMaxRadius(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={enablePickup} onCheckedChange={setEnablePickup} />
              <Label>Pickup enabled</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={enableDelivery} onCheckedChange={setEnableDelivery} />
              <Label>Delivery enabled</Label>
            </div>
          </div>
          <div>
            <Label>Allowed days & hours (JSON)</Label>
            <Textarea
              value={scheduleJson}
              onChange={(e) => setScheduleJson(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Heading level="h2">Pending delivery requests</Heading>
          {pendingRequests.length === 0 && (
            <Text className="text-ui-fg-subtle">No pending out-of-range requests.</Text>
          )}
          {pendingRequests.map((request) => (
            <div key={String(request.id)} className="rounded-lg border p-4">
              <Text weight="plus">{String(request.customer_email)}</Text>
              <Text size="small" className="text-ui-fg-subtle">
                {String(request.delivery_miles)} mi ·{" "}
                {request.delivery_address ? String(request.delivery_address) : ""}
              </Text>
              <div className="mt-3 flex gap-2">
                <Button
                  size="small"
                  onClick={() =>
                    updateRequest.mutate({
                      id: String(request.id),
                      status: "confirmed",
                    })
                  }
                >
                  Confirm
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() =>
                    updateRequest.mutate({
                      id: String(request.id),
                      status: "rejected",
                    })
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Delivery Settings" })
export const handle = { breadcrumb: () => "Delivery Settings" }
export default SushiDeliverySettingsPage
