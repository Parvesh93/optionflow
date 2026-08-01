import type { LoaderFunctionArgs } from "react-router";

import { authenticate } from "../../shopify.server";

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  return {
    shop: session.shop,
  };
}