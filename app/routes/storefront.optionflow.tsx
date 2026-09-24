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

  const url = new URL(request.url);
  const productGid =
    url.searchParams.get("productGid") ?? "";
  const handle =
    url.searchParams.get("handle") ?? "";

  if (!productGid.trim() && !handle.trim()) {
    return data(
      {
        ok: false,
        error:
          "A product assignment or option set handle is required.",
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
    productGid,
    handle,
  );

  if (!optionSet) {
    return data(
      {
        ok: false,
        error:
          "No published OptionFlow option set is assigned to this product.",
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
