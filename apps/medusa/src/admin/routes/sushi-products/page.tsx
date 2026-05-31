import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import type { AdminSushiProductDTO } from "../../../sdk/admin/admin-sushi-delivery"
import {
  useAdminCreateSushiProduct,
  useAdminListSushiProducts,
  useAdminUpdateSushiProduct,
} from "../../hooks/sushi-delivery"
import { MenuMedia } from "../menus/components/menu-media/MenuMedia"

type MediaState = {
  images: string[]
  image_files: { url: string; file_id?: string }[]
  thumbnail?: string | null
}

const emptyMedia = (): MediaState => ({
  images: [],
  image_files: [],
  thumbnail: null,
})

const mediaFromProduct = (product: AdminSushiProductDTO): MediaState => {
  const sorted = [...(product.images ?? [])].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
  )
  return {
    images: sorted.map((image) => image.url),
    image_files: sorted.map((image) => ({ url: image.url })),
    thumbnail: product.thumbnail ?? sorted[0]?.url ?? null,
  }
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message)
  }
  return "Something went wrong"
}

const SushiProductsPage = () => {
  const { data, isLoading } = useAdminListSushiProducts()
  const createMutation = useAdminCreateSushiProduct()
  const [editingId, setEditingId] = useState<string | null>(null)
  const updateMutation = useAdminUpdateSushiProduct(editingId)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("250")
  const [inventory, setInventory] = useState("10")
  const [status, setStatus] = useState<"draft" | "published">("published")
  const [media, setMedia] = useState<MediaState>(emptyMedia)

  const products = data?.products ?? []
  const isEditing = editingId !== null

  const resetForm = () => {
    setEditingId(null)
    setTitle("")
    setDescription("")
    setPrice("250")
    setInventory("10")
    setStatus("published")
    setMedia(emptyMedia())
  }

  const loadProduct = (product: AdminSushiProductDTO) => {
    setEditingId(product.id)
    setTitle(product.title)
    setDescription(product.description ?? "")
    const amount = product.variants?.[0]?.prices?.[0]?.amount ?? 0
    setPrice(amount > 0 ? String(amount / 100) : "0")
    setInventory(String(product.variants?.[0]?.inventory_quantity ?? 0))
    setStatus(
      product.status === "draft" ? "draft" : "published",
    )
    setMedia(mediaFromProduct(product))
  }

  useEffect(() => {
    if (!editingId) return
    const stillExists = products.some((product) => product.id === editingId)
    if (!stillExists) resetForm()
  }, [editingId, products])

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error("Title required", {
        description: "Enter a product title before saving.",
      })
      return
    }

    const priceCents = Math.round(Number(price) * 100)
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      toast.error("Invalid price", {
        description: "Enter a price greater than zero.",
      })
      return
    }

    const payload = {
      title: trimmedTitle,
      description,
      price_cents: priceCents,
      inventory_quantity: Number(inventory) || 0,
      status,
      images: media.images,
      thumbnail: media.thumbnail,
    }

    try {
      if (isEditing && editingId) {
        await updateMutation.mutateAsync(payload)
        toast.success("Product updated", {
          description: `"${trimmedTitle}" was saved.`,
        })
      } else {
        await createMutation.mutateAsync(payload)
        toast.success("Product saved", {
          description: `"${trimmedTitle}" was created successfully.`,
        })
        resetForm()
      }
    } catch (error) {
      toast.error("Save failed", { description: getErrorMessage(error) })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Sushi Products</Heading>
        {isEditing && (
          <Button type="button" variant="secondary" onClick={resetForm}>
            New product
          </Button>
        )}
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-lg border p-4">
          <Heading level="h2">{isEditing ? "Edit bundle" : "Create bundle"}</Heading>
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
          <MenuMedia value={media} onChange={setMedia} />
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
          <Button
            type="button"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!title.trim() || isSaving}
          >
            {isEditing ? "Save changes" : "Save product"}
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
            const cover =
              product.thumbnail ?? product.images?.[0]?.url ?? null
            const selected = editingId === product.id
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => loadProduct(product)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selected
                    ? "border-ui-border-interactive bg-ui-bg-subtle"
                    : "hover:bg-ui-bg-subtle-hover"
                }`}
              >
                <div className="flex items-start gap-3">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-ui-bg-subtle text-ui-fg-muted text-xs">
                      No image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Text weight="plus">{product.title}</Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      {product.status} · ${(amount / 100).toFixed(2)}
                    </Text>
                    {product.description && (
                      <Text size="small" className="mt-2 line-clamp-2 whitespace-pre-wrap">
                        {product.description}
                      </Text>
                    )}
                  </div>
                </div>
              </button>
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
