import {
  data,
  redirect,
  type ActionFunctionArgs,
} from "react-router";

import { ensureShop } from "~/services/shop.server";
import { authenticate } from "~/shopify.server";

import {
  OptionBuilderNotFoundError,
  OptionFieldValidationError,
  optionFieldService,
} from "./services/optionField.service";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function optionBuilderAction({
  request,
  params,
}: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
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

  const formData = await request.formData();
  const intent = getString(formData, "intent");

  try {
    if (intent === "saveField") {
      await optionFieldService.saveField(
        shop.id,
        optionSetId,
        {
          fieldId:
            getString(formData, "fieldId") || undefined,
          type:
            getString(formData, "type") || "TEXT",
          label: getString(formData, "label"),
          placeholder: getString(
            formData,
            "placeholder",
          ),
          helpText: getString(formData, "helpText"),
          isRequired:
            getString(formData, "isRequired") === "on",
          priceAdjustmentType:
            getString(formData, "priceAdjustmentType") ||
            "NONE",
          priceAdjustmentValue:
            getString(formData, "priceAdjustmentValue"),
          valuesText: getString(
            formData,
            "valuesText",
          ),
        },
      );

      return redirect(
        `/app/option-sets/${optionSetId}/builder?saved=1`,
      );
    }

    if (intent === "deleteField") {
      const fieldId = getString(formData, "fieldId");

      await optionFieldService.deleteField(
        shop.id,
        optionSetId,
        fieldId,
      );

      return redirect(
        `/app/option-sets/${optionSetId}/builder?deleted=1`,
      );
    }

    if (intent === "reorderFields") {
      const orderedFieldIds = formData
        .getAll("fieldIds")
        .filter(
          (value): value is string =>
            typeof value === "string",
        );

      await optionFieldService.reorderFields(
        shop.id,
        optionSetId,
        orderedFieldIds,
      );

      return data({
        success: true,
        reordered: true,
      });
    }

    if (intent === "moveField") {
      const fieldId = getString(formData, "fieldId");
      const direction = getString(
        formData,
        "direction",
      );

      if (
        direction !== "up" &&
        direction !== "down"
      ) {
        return data(
          {
            success: false,
            formError: "Invalid move direction.",
          },
          { status: 400 },
        );
      }

      await optionFieldService.moveField(
        shop.id,
        optionSetId,
        fieldId,
        direction,
      );

      return redirect(
        `/app/option-sets/${optionSetId}/builder`,
      );
    }

    return data(
      {
        success: false,
        formError: "Invalid builder action.",
      },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof OptionFieldValidationError) {
      return data(
        {
          success: false,
          formError: error.message,
        },
        { status: 422 },
      );
    }

    if (error instanceof OptionBuilderNotFoundError) {
      return data(
        {
          success: false,
          formError:
            "Option set or option field not found.",
        },
        { status: 404 },
      );
    }

    console.error("Option builder action failed", error);

    return data(
      {
        success: false,
        formError:
          "The option builder action could not be completed.",
      },
      { status: 500 },
    );
  }
}
