import { fetchSushiProducts } from '@libs/util/server/sushi-products.server';
import type { LoaderFunctionArgs } from 'react-router';
import { data } from 'react-router';

/** BFF route for sushi listing (visible in browser Network tab when called from the client). */
export async function loader({ request }: LoaderFunctionArgs) {
  const result = await fetchSushiProducts(request);
  return data(result, {
    headers: {
      'Cache-Control': 'private, max-age=10',
    },
  });
}
