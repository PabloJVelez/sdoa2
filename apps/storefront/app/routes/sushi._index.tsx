import { Breadcrumbs } from '@app/components/common/breadcrumbs';
import { Container } from '@app/components/common/container';
import { ProductListWithPagination } from '@app/components/product/ProductListWithPagination';
import HomeIcon from '@heroicons/react/24/solid/HomeIcon';
import { fetchSushiProducts } from '@libs/util/server/sushi-products.server';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Link, useLoaderData } from 'react-router';

export const meta: MetaFunction = () => [
  { title: 'Order Sushi' },
  {
    name: 'description',
    content: 'Browse chef sushi bundles for pickup or delivery.',
  },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return fetchSushiProducts(request);
};

export default function SushiIndexRoute() {
  const { products, count, limit, offset } = useLoaderData<typeof loader>();

  const breadcrumbs = [
    {
      label: (
        <span className="flex whitespace-nowrap">
          <HomeIcon className="inline h-4 w-4" />
          <span className="sr-only">Home</span>
        </span>
      ),
      url: `/`,
    },
    { label: 'Order Sushi' },
  ];

  return (
    <Container className="pb-16">
      <div className="my-8 flex flex-col gap-4">
        <Breadcrumbs breadcrumbs={breadcrumbs} />
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Order Sushi</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Each bundle is one chef-curated selection—pickup or delivery with scheduled date and time before
            checkout.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-600">
          Sushi bundles are coming soon.{' '}
          <Link to="/products" className="text-primary-600 underline">
            Browse all products
          </Link>
        </p>
      ) : (
        <ProductListWithPagination
          products={products}
          paginationConfig={{ count, offset, limit }}
          context="sushi"
        />
      )}
    </Container>
  );
}
