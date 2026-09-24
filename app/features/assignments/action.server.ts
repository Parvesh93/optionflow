import {
  data,
  redirect,
  type ActionFunctionArgs,
} from "react-router";

import { pricingInfrastructureService } from "~/features/pricing/services/pricingInfrastructure.service";
import { ensureShop } from "~/services/shop.server";
import { authenticate } from "~/shopify.server";
import {
  OptionSetNotFoundError,
  optionSetService,
} from "~/features/option-sets/services/optionSet.service";

import {
  ProductAssignmentNotFoundError,
  productAssignmentService,
} from "./services/productAssignment.service";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function productAssignmentsAction({
  request,
  params,
}: ActionFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);
  const optionSetId = params.optionSetId;

  if (!optionSetId) {
    return data(
      {
        success: false,
        formError: "Option set ID is missing.",
      },
      { status: 400 },
    );
  }

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  try {
    await optionSetService.getForEdit(
      shop.id,
      optionSetId,
    );

    const formData = await request.formData();
    const intent = getString(formData, "intent");

    if (intent === "assign") {
      const productGid = getString(
        formData,
        "productGid",
      );
      const productTitle = getString(
        formData,
        "productTitle",
      );
      const productHandle = getString(
        formData,
        "productHandle",
      );
      const productImageUrl =
        getString(formData, "productImageUrl") || null;

      if (
        !productGid ||
        !productTitle ||
        !productHandle
      ) {
        return data(
          {
            success: false,
            formError:
              "Product information is incomplete.",
          },
          { status: 400 },
        );
      }

      await productAssignmentService.assign(
        shop.id,
        optionSetId,
        {
          id: productGid,
          title: productTitle,
          handle: productHandle,
          imageUrl: productImageUrl,
          status: "ACTIVE",
        },
      );

      await pricingInfrastructureService.syncOptionSet(
        admin,
        shop.id,
        optionSetId,
      );

      return redirect(
        `/app/option-sets/${optionSetId}/assignments?assigned=1`,
      );
    }

    if (intent === "unassign") {
      const productGid = getString(
        formData,
        "productGid",
      );

      await productAssignmentService.unassign(
        shop.id,
        optionSetId,
        productGid,
      );

      await pricingInfrastructureService.disableProductPricing(
        admin,
        productGid,
      );

      return redirect(
        `/app/option-sets/${optionSetId}/assignments?unassigned=1`,
      );
    }

    return data(
      {
        success: false,
        formError: "Invalid assignment action.",
      },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof OptionSetNotFoundError) {
      return data(
        {
          success: false,
          formError: "Option set not found.",
        },
        { status: 404 },
      );
    }

    if (
      error instanceof ProductAssignmentNotFoundError
    ) {
      return data(
        {
          success: false,
          formError: "Product assignment not found.",
        },
        { status: 404 },
      );
    }

    console.error("Product assignment action failed", error);

    return data(
      {
        success: false,
        formError:
          "The product assignment could not be updated.",
      },
      { status: 500 },
    );
  }
}
