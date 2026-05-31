import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Switch, Text, Textarea } from "@medusajs/ui"
import { useEffect, useState } from "react"
import {
  useAdminSushiDeliverySettings,
  useAdminUpdateSushiDeliverySettings,
} from "../../hooks/sushi-delivery"
import { DEFAULT_ALLOWED_DAYS } from "../../../lib/sushi/schedule"

const SushiDeliverySettingsPage = () => {
  const { data: settings, isLoading } = useAdminSushiDeliverySettings()
  const updateMutation = useAdminUpdateSushiDeliverySettings()

  const [originAddress, setOriginAddress] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [storeTimezone, setStoreTimezone] = useState("America/Chicago")
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
    setPickupAddress(settings.pickup_address ?? "")
    setStoreTimezone(settings.store_timezone ?? "America/Chicago")
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
      pickup_address: pickupAddress,
      store_timezone: storeTimezone,
      price_per_mile: Number(pricePerMile),
      max_radius_miles: Number(maxRadius),
      allowed_days: allowedDays,
      enable_pickup: enablePickup,
      enable_delivery: enableDelivery,
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Sushi Delivery Settings</Heading>
        <Button onClick={handleSave} isLoading={updateMutation.isPending}>
          Save settings
        </Button>
      </div>

      <div className="px-6 py-6">
        <div className="flex max-w-3xl flex-col gap-4">
          {isLoading && <Text>Loading…</Text>}
          <div>
            <Label>Delivery origin address</Label>
            <Text size="small" className="text-ui-fg-subtle mb-1">
              Used to calculate driving distance for delivery quotes.
            </Text>
            <Textarea
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Pickup address</Label>
            <Text size="small" className="text-ui-fg-subtle mb-1">
              Shown to customers when they choose pickup.
            </Text>
            <Textarea
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label>Store timezone</Label>
            <Text size="small" className="text-ui-fg-subtle mb-1">
              IANA timezone for interpreting scheduled pickup and delivery slots.
            </Text>
            <Input
              value={storeTimezone}
              onChange={(e) => setStoreTimezone(e.target.value)}
              placeholder="America/Chicago"
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
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Delivery Settings" })
export const handle = { breadcrumb: () => "Delivery Settings" }
export default SushiDeliverySettingsPage
