import type { ExecArgs } from '@medusajs/types';
import { createProductsWorkflow, updateProductsWorkflow } from '@medusajs/medusa/core-flows';
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils';
import { SUSHI_ORDER_FLOW } from '../lib/sushi/constants';
import { ensureSushiProductStoreReady } from '../lib/sushi/ensure-sushi-product-store';
import { resolveProductThumbnail, toProductImageInputs } from '../lib/sushi/product-images';
import { majorUnitsFromCents } from '../lib/sushi/pricing';
import { resolvePhysicalShippingProfileId } from '../lib/sushi/shipping-profile';
import { ensureDefaultSalesChannelStockLocationLink } from '../lib/sushi/ensure-sales-channel-stock-location';
import { setVariantInventoryQuantity } from '../lib/sushi/variant-inventory';

type SushiBundleSeed = {
  title: string;
  handle: string;
  description: string;
  price_cents: number;
  inventory_quantity: number;
  images: string[];
};

export const sushiBundleProducts: SushiBundleSeed[] = [
  {
    title: 'Date Night Omakase Box',
    handle: 'date-night-omakase-box',
    description:
      'A two-person chef selection with nigiri, sashimi, two specialty rolls, miso soup, and mochi. Built for a polished at-home sushi night.',
    price_cents: 8600,
    inventory_quantity: 24,
    images: [
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&q=80&auto=format&fit=crop',
    ],
  },
  {
    title: 'Signature Roll Party Box',
    handle: 'signature-roll-party-box',
    description:
      'A shareable roll set for groups with spicy tuna crunch, salmon avocado, California rolls, vegetable futomaki, and house sauces.',
    price_cents: 11800,
    inventory_quantity: 18,
    images: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=1200&q=80&auto=format&fit=crop',
    ],
  },
  {
    title: 'Nigiri & Sashimi Deluxe',
    handle: 'nigiri-and-sashimi-deluxe',
    description:
      'A premium fish-forward bundle with chef-cut sashimi, assorted nigiri, hamachi crudo, and edamame with togarashi salt.',
    price_cents: 14500,
    inventory_quantity: 16,
    images: [
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=1200&q=80&auto=format&fit=crop',
    ],
  },
  {
    title: 'Family Bento Bundle',
    handle: 'family-bento-bundle',
    description:
      'Four bento-style meals with salmon teriyaki, chicken karaage, cucumber sesame salad, mini rolls, rice, pickles, and mochi.',
    price_cents: 9600,
    inventory_quantity: 20,
    images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80&auto=format&fit=crop',
    ],
  },
];

type QueryProduct = {
  id: string;
  handle: string;
  metadata?: Record<string, unknown> | null;
  variants?: Array<{
    id: string;
    sku?: string | null;
    title?: string | null;
    prices?: Array<{ id?: string | null }>;
  }>;
};

async function findProductByHandle(container: ExecArgs['container'], handle: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data?: QueryProduct[] }>;
  };

  const { data } = await query.graph({
    entity: 'product',
    fields: ['id', 'handle', 'metadata', 'variants.id', 'variants.sku', 'variants.title', 'variants.prices.id'],
    filters: { handle },
  });

  return data?.[0];
}

async function updateExistingSushiProduct(
  container: ExecArgs['container'],
  existing: QueryProduct,
  bundle: SushiBundleSeed,
) {
  const variant = existing.variants?.[0];
  const price = variant?.prices?.[0];
  const thumbnail = resolveProductThumbnail(null, bundle.images);

  await updateProductsWorkflow(container).run({
    input: {
      products: [
        {
          id: existing.id,
          title: bundle.title,
          description: bundle.description,
          status: 'published',
          thumbnail,
          images: toProductImageInputs(bundle.images),
          metadata: {
            ...(existing.metadata ?? {}),
            order_flow: SUSHI_ORDER_FLOW,
          },
          ...(variant
            ? {
                variants: [
                  {
                    id: variant.id,
                    prices: [
                      {
                        ...(price?.id ? { id: price.id } : {}),
                        currency_code: 'usd',
                        amount: majorUnitsFromCents(bundle.price_cents),
                      },
                    ],
                  },
                ],
              }
            : {}),
        },
      ],
    },
  });

  if (variant?.id && variant?.sku) {
    await setVariantInventoryQuantity(container, {
      variantId: variant.id,
      variantSku: variant.sku,
      variantTitle: variant.title ?? bundle.title,
      quantity: bundle.inventory_quantity,
    });
  }

  await ensureSushiProductStoreReady(container, existing.id);
}

async function createSushiProduct(container: ExecArgs['container'], bundle: SushiBundleSeed) {
  const storeModule = container.resolve(Modules.STORE) as {
    listStores: () => Promise<Array<{ default_sales_channel_id?: string | null }>>;
  };
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: {
      entity: string;
      fields: string[];
      filters?: Record<string, unknown>;
    }) => Promise<{ data?: Array<{ id: string; handle: string }> }>;
  };

  const [store] = await storeModule.listStores();
  const salesChannelId = store?.default_sales_channel_id;
  const shippingProfileId = await resolvePhysicalShippingProfileId(container);
  const { data: collections } = await query.graph({
    entity: 'product_collection',
    fields: ['id', 'handle'],
    filters: { handle: 'sushi' },
  });
  const sushiCollectionId = collections?.[0]?.id;

  const { result } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: bundle.title,
          handle: bundle.handle,
          description: bundle.description,
          status: 'published',
          thumbnail: resolveProductThumbnail(null, bundle.images),
          images: toProductImageInputs(bundle.images),
          metadata: {
            order_flow: SUSHI_ORDER_FLOW,
          },
          ...(typeof sushiCollectionId === 'string' ? { collection_id: sushiCollectionId } : {}),
          shipping_profile_id: shippingProfileId,
          sales_channels: salesChannelId ? [{ id: salesChannelId }] : [],
          options: [{ title: 'Default', values: ['Default'] }],
          variants: [
            {
              title: 'Default',
              sku: `SUSHI-${bundle.handle}`.slice(0, 60),
              manage_inventory: true,
              options: { Default: 'Default' },
              prices: [
                {
                  currency_code: 'usd',
                  amount: majorUnitsFromCents(bundle.price_cents),
                },
              ],
            },
          ],
        },
      ],
    },
  });

  const product = result[0];
  const variant = product.variants?.[0];

  if (variant?.id && variant?.sku) {
    await ensureDefaultSalesChannelStockLocationLink(container);
    await setVariantInventoryQuantity(container, {
      variantId: variant.id,
      variantSku: variant.sku,
      variantTitle: variant.title ?? bundle.title,
      quantity: bundle.inventory_quantity,
    });
  }

  await ensureSushiProductStoreReady(container, product.id);
}

export default async function ensureSushiBundleProducts({ container }: Pick<ExecArgs, 'container'>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  for (const bundle of sushiBundleProducts) {
    const existing = await findProductByHandle(container, bundle.handle);

    if (existing) {
      await updateExistingSushiProduct(container, existing, bundle);
      logger.info(`[ensure-sushi-bundles] Updated ${bundle.title}`);
      continue;
    }

    await createSushiProduct(container, bundle);
    logger.info(`[ensure-sushi-bundles] Created ${bundle.title}`);
  }
}
