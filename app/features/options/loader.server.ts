import { data, type LoaderFunctionArgs } from "react-router";

import { ensureShop } from "~/services/shop.server";
import { authenticate } from "~/shopify.server";

import {
  OptionBuilderNotFoundError,
  optionFieldService,
} from "./services/optionField.service";

export async function optionBuilderLoader({
  request,
  params,
}: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const optionSetId = params.optionSetId;

  if (!optionSetId) {
    throw data(
      { message: "Option set ID is required." },
      { status: 400 },
    );
  }

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  try {
    return await optionFieldService.getBuilder(
      shop.id,
      optionSetId,
    );
  } catch (error) {
    if (error instanceof OptionBuilderNotFoundError) {
      throw data(
        { message: "Option set not found." },
        { status: 404 },
      );
    }

    throw error;
  }
}
