import { data, type LoaderFunctionArgs } from "react-router";

import { ensureShop } from "~/services/shop.server";
import { authenticate } from "~/shopify.server";
import {
  OptionSetNotFoundError,
  optionSetService,
} from "~/features/option-sets/services/optionSet.service";

import { productAssignmentService } from "./services/productAssignment.service";

export async function productAssignmentsLoader({
  request,
  params,
}: LoaderFunctionArgs) {
  const { admin, session } =
    await authenticate.admin(request);

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
    const optionSet = await optionSetService.getForEdit(
      shop.id,
      optionSetId,
    );

    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim() ?? "";

    const [assignments, products] = await Promise.all([
      productAssignmentService.list(
        shop.id,
        optionSetId,
      ),
      productAssignmentService.searchProducts(
        admin,
        search,
      ),
    ]);

    const assignedProductIds = new Set(
      assignments.map(
        (assignment) => assignment.productGid,
      ),
    );

    return {
      optionSet: {
        id: optionSet.id,
        name: optionSet.name,
        status: optionSet.status,
      },
      search,
      assignments,
      products: products.map((product) => ({
        ...product,
        assignedToThisSet: assignedProductIds.has(
          product.id,
        ),
      })),
    };
  } catch (error) {
    if (error instanceof OptionSetNotFoundError) {
      throw data(
        { message: "Option set not found." },
        { status: 404 },
      );
    }

    throw error;
  }
}
