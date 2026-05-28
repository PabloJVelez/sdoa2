import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Select, Text, Textarea } from "@medusajs/ui"
import { useState } from "react"
import {
  useAdminCreateSushiProduct,
  useAdminListSushiProducts,
} from "../../hooks/sushi-delivery"

const SushiProductsPage = () => {
  const { data, isLoading } = useAdminListSushiProducts()
  const createMutation = useAdminCreateSushiProduct()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("250")
  const [inventory, setInventory] = useState("10")
  const [status, setStatus] = useState<"draft" | "published">("published")

  const products = data?.products ?? []

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      title,
      description,
      price_cents: Math.round(Number(price) * 100),
      inventory_quantity: Number(inventory) || 0,
      status,
    })
    setTitle("")
    setDescription("")
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Sushi Products</Heading>
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <Heading level="h2">Create bundle</Heading>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Bundle contents (description)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (USD)</Label>
              <Input value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label>Inventory</Label>
              <Input value={inventory} onChange={(e) => setInventory(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="published">Active</Select.Item>
                <Select.Item value="draft">Draft</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <Button onClick={handleCreate} isLoading={createMutation.isPending}>
            Save product
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <Heading level="h2">Bundles</Heading>
          {isLoading && <Text>Loading…</Text>}
          {!isLoading && products.length === 0 && (
            <Text className="text-ui-fg-subtle">No sushi products yet.</Text>
          )}
          {products.map((product) => {
            const variant = product.variants?.[0]
            const amount = variant?.prices?.[0]?.amount ?? 0
            return (
              <div key={product.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Text weight="plus">{product.title}</Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {product.status} · ${(amount / 100).toFixed(2)}
                    </Text>
                  </div>
                </div>
                {product.description && (
                  <Text size="small" className="mt-2 whitespace-pre-wrap">
                    {product.description}
                  </Text>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Sushi Products" })
export const handle = { breadcrumb: () => "Sushi Products" }
export default SushiProductsPage
