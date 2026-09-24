import type { LoaderFunctionArgs } from "react-router";

import { authenticate } from "~/shopify.server";
import { ensureShop } from "~/services/shop.server";

import type {
  OptionSetListStatus,
  OptionSetSort,
} from "./types";

import { data } from "react-router";

import {
  OptionSetNotFoundError,
  optionSetService,
} from "./services/optionSet.service";

export async function editOptionSetLoader({
  request,
  params,
}: LoaderFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  const optionSetId = params.optionSetId;

  if (!optionSetId) {
    throw data(
      {
        message: "Option set ID is required.",
      },
      {
        status: 400,
      },
    );
  }

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  try {
    const optionSet =
      await optionSetService.getForEdit(
        shop.id,
        optionSetId,
      );

    return {
      optionSet,
    };
  } catch (error) {
    if (
      error instanceof OptionSetNotFoundError
    ) {
      throw data(
        {
          message: "Option set not found.",
        },
        {
          status: 404,
        },
      );
    }

    throw error;
  }
}


function parseSort(
  value: string | null,
): OptionSetSort {
  switch (value) {
    case "UPDATED_ASC":
    case "NAME_ASC":
    case "NAME_DESC":
    case "CREATED_DESC":
    case "CREATED_ASC":
      return value;

    case "UPDATED_DESC":
    default:
      return "UPDATED_DESC";
  }
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function parseStatus(
  value: string | null,
): OptionSetListStatus | undefined {
  if (
    value === "DRAFT" ||
    value === "PUBLISHED" ||
    value === "ARCHIVED"
  ) {
    return value;
  }

  return undefined;
}

export async function loader({
  request,
}: LoaderFunctionArgs) {
  const { session } =
    await authenticate.admin(request);

  const shop = await ensureShop({
    shopifyDomain: session.shop,
  });

  const url = new URL(request.url);

  
const sort = parseSort(
  url.searchParams.get("sort"),
); 

  const search =
    url.searchParams.get("search")?.trim() ||
    undefined;

  const status = parseStatus(
    url.searchParams.get("status"),
  );

  const page = parsePositiveInteger(
    url.searchParams.get("page"),
    1,
  );

  const pageSize = parsePositiveInteger(
    url.searchParams.get("pageSize"),
    20,
  );

  const result = await optionSetService.list(
  shop.id,
  {
    search,
    status,
    sort,
    page,
    pageSize,
  },
);

  return {
    shop: {
      id: shop.id,
      domain: shop.shopifyDomain,
    },
    filters: {
  search: search ?? "",
  status: status ?? "",
  sort,
},
    optionSets: result.items,
    pagination: result.pagination,
  };
}