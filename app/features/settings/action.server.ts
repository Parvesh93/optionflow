import {
  data,
  redirect,
  type ActionFunctionArgs,
} from "react-router";

import prisma from "~/db.server";
import { pricingInfrastructureService } from "~/features/pricing/services/pricingInfrastructure.service";
import { ensureShop } from "~/services/shop.server";
import { authenticate } from "~/shopify.server";

export async function settingsAction({
  request,
}: ActionFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent !== "enablePricing") {
    return data(
      {
        success: false,
        formError: "Invalid settings action.",
      },
      { status: 400 },
    );
  }

  try {
    await pricingInfrastructureService.enable(
      admin,
      shop.id,
    );

    const optionSets = await prisma.optionSet.findMany({
      where: {
        shopId: shop.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    for (const optionSet of optionSets) {
      await pricingInfrastructureService.syncOptionSet(
        admin,
        shop.id,
        optionSet.id,
      );
    }

    return redirect(
      "/app/settings?pricingEnabled=1",
    );
  } catch (error) {
    console.error(
      "Failed to enable OptionFlow pricing",
      error,
    );

    return data(
      {
        success: false,
        formError:
          error instanceof Error
            ? error.message
            : "Unable to enable pricing.",
      },
      { status: 500 },
    );
  }
}
