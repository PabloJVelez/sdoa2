import { baseMedusaConfig } from '@libs/util/server/client.server';
import { config } from '@libs/util/server/config.server';
import type { StoreProduct, StoreProductVariant } from '@medusajs/types';

const SUSHI_PRODUCTS_PATH = '/store/sushi/products';

type GraphSushiVariantOption = {
  option_id?: string;
  value?: string;
};

type GraphSushiVariant = {
  id: string;
  sku?: string;
  manage_inventory?: boolean;
  inventory_quantity?: number;
  prices?: Array<{ amount: number; currency_code: string; id: string }>;
  options?: GraphSushiVariantOption[];
};

type GraphSushiProductOption = {
  id: string;
  title?: string;
  values?: Array<{ value: string }>;
};

type GraphSushiProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  thumbnail?: string | null;
  status?: string;
  metadata?: Record<string, unknown> | null;
  collection?: { id: string; handle: string; title: string } | null;
  images?: Array<{ id: string; url: string; rank?: number }>;
  options?: GraphSushiProductOption[];
  variants?: GraphSushiVariant[];
};

function mapVariantToStore(variant: GraphSushiVariant): StoreProductVariant {
  const amount = variant.prices?.[0]?.amount ?? 0;
  const currency_code = variant.prices?.[0]?.currency_code ?? 'usd';

  return {
    id: variant.id,
    sku: variant.sku,
    manage_inventory: variant.manage_inventory,
    inventory_quantity: variant.inventory_quantity,
    prices: variant.prices,
    options: variant.options?.map((option) => ({
      option_id: option.option_id,
      value: option.value,
    })),
    calculated_price: {
      calculated_amount: amount,
      original_amount: amount,
      currency_code,
    },
  } as unknown as StoreProductVariant;
}

function mapGraphProductToStore(product: GraphSushiProduct): StoreProduct {
  const images = [...(product.images ?? [])].sort(
    (a, b) => (a.rank ?? 0) - (b.rank ?? 0),
  );

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    description: product.description ?? undefined,
    thumbnail: product.thumbnail ?? undefined,
    status: product.status,
    metadata: product.metadata ?? undefined,
    collection: product.collection ?? undefined,
    images,
    options: product.options?.map((option) => ({
      id: option.id,
      title: option.title,
      values: option.values,
    })),
    variants: product.variants?.map(mapVariantToStore),
  } as StoreProduct;
}

async function fetchGraphSushiProducts(filters?: {
  handle?: string;
  id?: string;
}): Promise<GraphSushiProduct[]> {
  if (!config.MEDUSA_PUBLISHABLE_KEY) {
    console.error(
      '[sushi] MEDUSA_PUBLISHABLE_KEY is missing in apps/storefront/.env — sushi products cannot load.',
    );
    return [];
  }

  const url = new URL(`${baseMedusaConfig.baseUrl}${SUSHI_PRODUCTS_PATH}`);
  if (filters?.handle) {
    url.searchParams.set('handle', filters.handle);
  }
  if (filters?.id) {
    url.searchParams.set('id', filters.id);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-publishable-api-key': config.MEDUSA_PUBLISHABLE_KEY,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(
      `[sushi] ${SUSHI_PRODUCTS_PATH} failed: ${response.status} ${body.slice(0, 200)}`,
    );
    return [];
  }

  const payload = (await response.json()) as { products?: GraphSushiProduct[] };
  return payload.products ?? [];
}

/**
 * Loads sushi bundles for the storefront from the custom Medusa store route.
 * This runs on the Remix server — the browser Network tab will not show this request.
 */
export async function fetchSushiProducts(_request: Request) {
  const graphProducts = await fetchGraphSushiProducts({});
  const products = graphProducts
    .filter(
      (product) =>
        (product.metadata as Record<string, unknown> | undefined)?.is_system_product !== true,
    )
    .map(mapGraphProductToStore);

  return {
    products,
    count: products.length,
    limit: Math.max(products.length, 12),
    offset: 0,
  };
}

export async function fetchSushiProductByHandle(handle: string): Promise<StoreProduct | null> {
  const graphProducts = await fetchGraphSushiProducts({ handle });
  const product = graphProducts[0];
  if (!product) return null;
  return mapGraphProductToStore(product);
}

export async function fetchSushiProductById(id: string): Promise<StoreProduct | null> {
  const graphProducts = await fetchGraphSushiProducts({ id });
  const product = graphProducts[0];
  if (!product) return null;
  return mapGraphProductToStore(product);
}
