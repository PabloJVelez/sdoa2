import { enrichAdminSushiProductVariants } from "../sushi/variant-inventory"

describe("enrichAdminSushiProductVariants", () => {
  it("reads stocked quantity from the inventory module", async () => {
    const container = {
      resolve: (key: string) => {
        if (key === "inventory") {
          return {
            listInventoryItems: async () => [{ id: "iitem_1" }],
            listInventoryLevels: async () => [
              { stocked_quantity: 30, reserved_quantity: 21 },
            ],
          }
        }
        if (key === "query") {
          return {
            graph: async () => ({
              data: [{ id: "sloc_1", name: "Main Warehouse" }],
            }),
          }
        }
        throw new Error(`Unexpected resolve: ${key}`)
      },
    }

    const enriched = await enrichAdminSushiProductVariants(container, {
      id: "prod_1",
      variants: [
        {
          sku: "SUSHI-chef-s-choice",
          manage_inventory: true,
          inventory_quantity: 0,
        },
      ],
    })

    expect(enriched.variants?.[0]?.inventory_quantity).toBe(30)
  })
})
