import type { LoaderFunctionArgs } from "react-router";

import { pricingInfrastructureService } from "~/features/pricing/services/pricingInfrastructure.service";
import { ensureShop } from "~/services/shop.server";
import { authenticate } from "~/shopify.server";

export async function settingsLoader({
  request,
}: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  const pricing =
    await pricingInfrastructureService.getStatus(shop.id);

  return {
    pricing: {
      enabled: Boolean(pricing?.pricingEnabledAt),
      enabledAt:
        pricing?.pricingEnabledAt?.toISOString() ?? null,
      cartTransformReady: Boolean(
        pricing?.pricingCartTransformId,
      ),
      addonReady: Boolean(
        pricing?.pricingAddonVariantGid,
      ),
    },
  };
}
