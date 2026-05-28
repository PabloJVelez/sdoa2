import { Container } from '@app/components/common/container';
import type { LoaderFunctionArgs } from 'react-router';
import { Link, useLoaderData } from 'react-router';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const orderRequestId = url.searchParams.get('order_request_id');
  return { orderRequestId };
};

export default function SushiRequestConfirmedRoute() {
  const { orderRequestId } = useLoaderData<typeof loader>();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Request submitted</h1>
        <p className="mt-4 text-gray-600">
          Your delivery address is outside our standard delivery radius. The chef will review your order
          and confirm whether we can accommodate delivery before payment.
        </p>
        {orderRequestId && (
          <p className="mt-2 text-sm text-gray-500">Reference: {orderRequestId}</p>
        )}
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/sushi"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Back to sushi menu
          </Link>
        </div>
      </div>
    </Container>
  );
}
