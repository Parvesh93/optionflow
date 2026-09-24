import type { ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";

import { pricingInfrastructureService } from "~/features/pricing/services/pricingInfrastructure.service";
import { authenticate } from "~/shopify.server";
import { ensureShop } from "~/services/shop.server";

import { createOptionSetSchema } from "./schemas/createOptionSet.schema";

import { updateOptionSetSchema } from "./schemas/updateOptionSet.schema";

import {
  OptionSetNotFoundError,
  OptionSetRevisionConflictError,
  optionSetService,
} from "./services/optionSet.service";

export type UpdateOptionSetActionData = {
  success: false;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  values: {
    name: string;
    description: string;
    internalNote: string;
    status: string;
    revision: string;
  };
};

export type CreateOptionSetActionData = {
  success: false;
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  values: {
    name: string;
    description: string;
    internalNote: string;
    status: string;
  };
};

function getString(
  formData: FormData,
  field: string,
) {
  const value = formData.get(field);

  return typeof value === "string" ? value : "";
}

export async function createOptionSetAction({
  request,
}: ActionFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  const formData = await request.formData();

  const values = {
    name: getString(formData, "name"),
    description: getString(
      formData,
      "description",
    ),
    internalNote: getString(
      formData,
      "internalNote",
    ),
    status:
      getString(formData, "status") || "DRAFT",
  };

  const result =
    createOptionSetSchema.safeParse(values);

  if (!result.success) {
    return data<CreateOptionSetActionData>(
      {
        success: false,
        fieldErrors:
          result.error.flatten().fieldErrors,
        values,
      },
      {
        status: 422,
      },
    );
  }

  try {
    const optionSet =
      await optionSetService.create(
        shop.id,
        result.data,
      );

    return redirect(
      `/app/option-sets?created=${encodeURIComponent(
        optionSet.id,
      )}`,
    );
  } catch (error) {
    console.error(
      "Failed to create option set",
      error,
    );

    return data<CreateOptionSetActionData>(
      {
        success: false,
        formError:
          "The option set could not be created. Please try again.",
        values,
      },
      {
        status: 500,
      },
    );
  }
}

export async function updateOptionSetAction({
  request,
  params,
}: ActionFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);

  const optionSetId = params.optionSetId;

  if (!optionSetId) {
    return data<UpdateOptionSetActionData>(
      {
        success: false,
        formError:
          "The option set ID is missing.",
        values: {
          name: "",
          description: "",
          internalNote: "",
          status: "DRAFT",
          revision: "",
        },
      },
      {
        status: 400,
      },
    );
  }

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  const formData = await request.formData();

  const values = {
    name: getString(formData, "name"),
    description: getString(
      formData,
      "description",
    ),
    internalNote: getString(
      formData,
      "internalNote",
    ),
    status:
      getString(formData, "status") ||
      "DRAFT",
    revision: getString(
      formData,
      "revision",
    ),
  };

  const result =
    updateOptionSetSchema.safeParse(values);

  if (!result.success) {
    return data<UpdateOptionSetActionData>(
      {
        success: false,
        fieldErrors:
          result.error.flatten().fieldErrors,
        values,
      },
      {
        status: 422,
      },
    );
  }

  try {
    await optionSetService.update(
      shop.id,
      optionSetId,
      result.data,
    );

    await pricingInfrastructureService.syncOptionSet(
      admin,
      shop.id,
      optionSetId,
    );

    return redirect(
      `/app/option-sets?updated=${encodeURIComponent(
        optionSetId,
      )}`,
    );
  } catch (error) {
    if (
      error instanceof OptionSetNotFoundError
    ) {
      return data<UpdateOptionSetActionData>(
        {
          success: false,
          formError:
            "This option set no longer exists.",
          values,
        },
        {
          status: 404,
        },
      );
    }

    if (
      error instanceof
      OptionSetRevisionConflictError
    ) {
      return data<UpdateOptionSetActionData>(
        {
          success: false,
          formError: error.message,
          values,
        },
        {
          status: 409,
        },
      );
    }

    console.error(
      "Failed to update option set",
      error,
    );

    return data<UpdateOptionSetActionData>(
      {
        success: false,
        formError:
          "The option set could not be updated. Please try again.",
        values,
      },
      {
        status: 500,
      },
    );
  }
}

export async function duplicateOptionSetAction({
  request,
  params,
}: ActionFunctionArgs) {
  try {
    const { session } =
      await authenticate.admin(request);
    const optionSetId = params.optionSetId;

    if (!optionSetId) {
      return data(
        {
          success: false,
          formError: "The option set ID is missing.",
        },
        { status: 400 },
      );
    }

    const shop = await ensureShop({
      shopifyDomain: session.shop,
    });

    const duplicated = await optionSetService.duplicate(
      shop.id,
      optionSetId,
    );

    return data({
      success: true,
      duplicatedId: duplicated.id,
    });
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

    console.error("Failed to duplicate option set", error);

    return data(
      {
        success: false,
        formError:
          "The option set could not be duplicated. Please try again.",
      },
      { status: 500 },
    );
  }
}

async function changeOptionSetArchiveState(
  request: Request,
  optionSetId: string | undefined,
  mode: "archive" | "restore",
) {
  const { admin, session } =
    await authenticate.admin(request);

  if (!optionSetId) {
    return data(
      { success: false, formError: "The option set ID is missing." },
      { status: 400 },
    );
  }

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  try {
    if (mode === "archive") {
      await optionSetService.archive(shop.id, optionSetId);
    } else {
      await optionSetService.restore(shop.id, optionSetId);
    }

    await pricingInfrastructureService.syncOptionSet(
      admin,
      shop.id,
      optionSetId,
    );

    const parameter = mode === "archive" ? "archived" : "restored";

    return redirect(
      `/app/option-sets?${parameter}=${encodeURIComponent(optionSetId)}`,
    );
  } catch (error) {
    if (error instanceof OptionSetNotFoundError) {
      return data(
        { success: false, formError: "Option set not found." },
        { status: 404 },
      );
    }

    console.error(`Failed to ${mode} option set`, error);

    return data(
      {
        success: false,
        formError:
          `The option set could not be ${mode === "archive" ? "archived" : "restored"}. Please try again.`,
      },
      { status: 500 },
    );
  }
}

export async function archiveOptionSetAction({
  request,
  params,
}: ActionFunctionArgs) {
  return changeOptionSetArchiveState(
    request,
    params.optionSetId,
    "archive",
  );
}

export async function restoreOptionSetAction({
  request,
  params,
}: ActionFunctionArgs) {
  return changeOptionSetArchiveState(
    request,
    params.optionSetId,
    "restore",
  );
}


export async function deleteOptionSetAction({
  request,
  params,
}: ActionFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);
  const optionSetId = params.optionSetId;

  if (!optionSetId) {
    return data(
      { success: false, formError: "The option set ID is missing." },
      { status: 400 },
    );
  }

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  try {
    await pricingInfrastructureService.disableOptionSetProducts(
      admin,
      shop.id,
      optionSetId,
    );

    await optionSetService.softDelete(shop.id, optionSetId);

    return redirect(
      `/app/option-sets?deleted=${encodeURIComponent(optionSetId)}`,
    );
  } catch (error) {
    if (error instanceof OptionSetNotFoundError) {
      return data(
        { success: false, formError: "Option set not found." },
        { status: 404 },
      );
    }

    console.error("Failed to delete option set", error);

    return data(
      {
        success: false,
        formError:
          "The option set could not be deleted. Please try again.",
      },
      { status: 500 },
    );
  }
}


export async function bulkOptionSetAction({
  request,
}: ActionFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);
  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  const formData = await request.formData();
  const action = getString(formData, "bulkAction");
  const optionSetIds = formData
    .getAll("optionSetIds")
    .filter((value): value is string => typeof value === "string");

  if (
    action !== "archive" &&
    action !== "restore" &&
    action !== "delete"
  ) {
    return data(
      { success: false, formError: "Invalid bulk action." },
      { status: 400 },
    );
  }

  if (optionSetIds.length === 0) {
    return data(
      { success: false, formError: "Select at least one option set." },
      { status: 400 },
    );
  }

  try {
    if (action === "delete") {
      for (const optionSetId of optionSetIds) {
        await pricingInfrastructureService.disableOptionSetProducts(
          admin,
          shop.id,
          optionSetId,
        );
      }
    }

    const result = await optionSetService.bulkAction(
      shop.id,
      optionSetIds,
      action,
    );

    if (action !== "delete") {
      for (const optionSetId of optionSetIds) {
        await pricingInfrastructureService.syncOptionSet(
          admin,
          shop.id,
          optionSetId,
        );
      }
    }

    const params = new URLSearchParams({
      bulk: action,
      count: String(result.count),
    });

    return redirect(`/app/option-sets?${params.toString()}`);
  } catch (error) {
    console.error("Failed to apply bulk option set action", error);

    return data(
      {
        success: false,
        formError:
          "The selected option sets could not be updated. Please try again.",
      },
      { status: 500 },
    );
  }
}
