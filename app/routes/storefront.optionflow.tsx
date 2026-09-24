import { data, type LoaderFunctionArgs } from "react-router";

import { getStorefrontOptionSet } from "~/features/storefront/storefrontOptionSet.server";
import { authenticate } from "~/shopify.server";

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const context =
    await authenticate.public.appProxy(request);

  const shop =
    context.session?.shop ??
    new URL(request.url).searchParams.get("shop");

  if (!shop) {
    return data(
      {
        ok: false,
        error: "Unable to identify shop.",
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const handle =
    new URL(request.url).searchParams.get("handle") ?? "";

  if (!handle.trim()) {
    return data(
      {
        ok: false,
        error: "Option set handle is required.",
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const optionSet = await getStorefrontOptionSet(
    shop,
    handle,
  );

  if (!optionSet) {
    return data(
      {
        ok: false,
        error:
          "Published option set not found for this store.",
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return data(
    {
      ok: true,
      optionSet,
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=30, stale-while-revalidate=60",
      },
    },
  );
}
