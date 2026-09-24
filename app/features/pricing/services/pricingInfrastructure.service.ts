import prisma from "~/db.server";

type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    },
  ) => Promise<Response>;
};

const FUNCTION_HANDLE = "optionflow-pricing";
const APP_NAMESPACE = "$app:optionflow";
const PRICING_KEY = "pricing-config";

type UserError = {
  field?: string[] | null;
  message: string;
};

function throwUserErrors(
  errors: UserError[] | undefined,
  fallback: string,
) {
  if (!errors?.length) {
    return;
  }

  throw new Error(
    errors.map((error) => error.message).join(" ") ||
      fallback,
  );
}

async function createAddonProduct(
  admin: AdminGraphqlClient,
) {
  const response = await admin.graphql(
    `#graphql
      mutation OptionFlowCreatePricingProduct(
        $product: ProductCreateInput!
      ) {
        productCreate(product: $product) {
          product {
            id
            variants(first: 1) {
              nodes {
                id
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        product: {
          title: "OptionFlow Price Adjustment",
          status: "ACTIVE",
          productType: "OptionFlow Internal",
          vendor: "OptionFlow",
          tags: ["optionflow-internal"],
          metafields: [
            {
              namespace: "seo",
              key: "hidden",
              type: "number_integer",
              value: "1",
            },
          ],
        },
      },
    },
  );

  const json = (await response.json()) as {
    data?: {
      productCreate?: {
        product?: {
          id: string;
          variants?: {
            nodes?: Array<{ id: string }>;
          };
        } | null;
        userErrors?: UserError[];
      };
    };
  };

  const payload = json.data?.productCreate;
  throwUserErrors(
    payload?.userErrors,
    "Unable to create the OptionFlow pricing product.",
  );

  const product = payload?.product;
  const variantId = product?.variants?.nodes?.[0]?.id;

  if (!product?.id || !variantId) {
    throw new Error(
      "Shopify did not return the pricing product variant.",
    );
  }

  return {
    productId: product.id,
    variantId,
  };
}

async function publishAddonProduct(
  admin: AdminGraphqlClient,
  productId: string,
) {
  const publicationsResponse = await admin.graphql(
    `#graphql
      query OptionFlowPublications {
        publications(first: 100) {
          nodes {
            id
            name
          }
        }
      }
    `,
  );

  const publicationsJson =
    (await publicationsResponse.json()) as {
      data?: {
        publications?: {
          nodes?: Array<{
            id: string;
            name: string;
          }>;
        };
      };
    };

  const publications =
    publicationsJson.data?.publications?.nodes ?? [];

  const onlineStore =
    publications.find((publication) =>
      /online store/i.test(publication.name),
    ) ?? publications[0];

  if (!onlineStore) {
    throw new Error(
      "No Shopify publication is available for the pricing component.",
    );
  }

  const publishResponse = await admin.graphql(
    `#graphql
      mutation OptionFlowPublishPricingProduct(
        $id: ID!
        $publicationId: ID!
      ) {
        publishablePublish(
          id: $id
          input: { publicationId: $publicationId }
        ) {
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        id: productId,
        publicationId: onlineStore.id,
      },
    },
  );

  const publishJson = (await publishResponse.json()) as {
    data?: {
      publishablePublish?: {
        userErrors?: UserError[];
      };
    };
  };

  throwUserErrors(
    publishJson.data?.publishablePublish?.userErrors,
    "Unable to publish the OptionFlow pricing component.",
  );
}

async function createCartTransform(
  admin: AdminGraphqlClient,
  addonVariantId: string,
) {
  const response = await admin.graphql(
    `#graphql
      mutation OptionFlowCreateCartTransform(
        $functionHandle: String!
        $metafields: [MetafieldInput!]
      ) {
        cartTransformCreate(
          functionHandle: $functionHandle
          blockOnFailure: false
          metafields: $metafields
        ) {
          cartTransform {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        functionHandle: FUNCTION_HANDLE,
        metafields: [
          {
            namespace: APP_NAMESPACE,
            key: PRICING_KEY,
            type: "json",
            value: JSON.stringify({
              addonVariantId,
            }),
          },
        ],
      },
    },
  );

  const json = (await response.json()) as {
    data?: {
      cartTransformCreate?: {
        cartTransform?: {
          id: string;
        } | null;
        userErrors?: UserError[];
      };
    };
  };

  const payload = json.data?.cartTransformCreate;
  throwUserErrors(
    payload?.userErrors,
    "Unable to activate the OptionFlow pricing function.",
  );

  if (!payload?.cartTransform?.id) {
    throw new Error(
      "Shopify did not return a cart transform ID.",
    );
  }

  return payload.cartTransform.id;
}

async function setMetafields(
  admin: AdminGraphqlClient,
  metafields: Array<{
    ownerId: string;
    namespace: string;
    key: string;
    type: string;
    value: string;
  }>,
) {
  if (metafields.length === 0) {
    return;
  }

  const response = await admin.graphql(
    `#graphql
      mutation OptionFlowSetPricingMetafields(
        $metafields: [MetafieldsSetInput!]!
      ) {
        metafieldsSet(metafields: $metafields) {
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      variables: {
        metafields,
      },
    },
  );

  const json = (await response.json()) as {
    data?: {
      metafieldsSet?: {
        userErrors?: UserError[];
      };
    };
  };

  throwUserErrors(
    json.data?.metafieldsSet?.userErrors,
    "Unable to sync OptionFlow pricing.",
  );
}

function buildPricingConfig(
  optionSet: {
    id: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    fields: Array<{
      id: string;
      type: string;
      priceAdjustmentType: string;
      priceAdjustmentValue: {
        toString(): string;
      } | null;
      values: Array<{
        value: string;
        priceAdjustmentType: string;
        priceAdjustmentValue: {
          toString(): string;
        } | null;
      }>;
      conditions: Array<{
        sourceFieldId: string;
        operator: string;
        expectedValue: string | null;
      }>;
    }>;
  },
) {
  return {
    version: 1,
    enabled: optionSet.status === "PUBLISHED",
    optionSetId: optionSet.id,
    fields: optionSet.fields.map((field) => ({
      id: field.id,
      type: field.type,
      adjustment: {
        type: field.priceAdjustmentType,
        value:
          field.priceAdjustmentValue?.toString() ?? "",
      },
      values: field.values.map((value) => ({
        value: value.value,
        adjustment: {
          type: value.priceAdjustmentType,
          value:
            value.priceAdjustmentValue?.toString() ?? "",
        },
      })),
      condition: field.conditions[0]
        ? {
            sourceFieldId:
              field.conditions[0].sourceFieldId,
            operator: field.conditions[0].operator,
            expectedValue:
              field.conditions[0].expectedValue ?? "",
          }
        : null,
    })),
  };
}

export const pricingInfrastructureService = {
  async getStatus(shopId: string) {
    return prisma.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        pricingAddonProductGid: true,
        pricingAddonVariantGid: true,
        pricingCartTransformId: true,
        pricingEnabledAt: true,
      },
    });
  },

  async enable(
    admin: AdminGraphqlClient,
    shopId: string,
  ) {
    const shop = await prisma.shop.findUnique({
      where: {
        id: shopId,
      },
    });

    if (!shop) {
      throw new Error("Shop not found.");
    }

    let productId = shop.pricingAddonProductGid;
    let variantId = shop.pricingAddonVariantGid;

    if (!productId || !variantId) {
      const product = await createAddonProduct(admin);
      productId = product.productId;
      variantId = product.variantId;

      await publishAddonProduct(admin, productId);
    }

    let cartTransformId =
      shop.pricingCartTransformId;

    if (!cartTransformId) {
      cartTransformId = await createCartTransform(
        admin,
        variantId,
      );
    } else {
      await setMetafields(admin, [
        {
          ownerId: cartTransformId,
          namespace: APP_NAMESPACE,
          key: PRICING_KEY,
          type: "json",
          value: JSON.stringify({
            addonVariantId: variantId,
          }),
        },
      ]);
    }

    const updated = await prisma.shop.update({
      where: {
        id: shopId,
      },
      data: {
        pricingAddonProductGid: productId,
        pricingAddonVariantGid: variantId,
        pricingCartTransformId: cartTransformId,
        pricingEnabledAt:
          shop.pricingEnabledAt ?? new Date(),
      },
      select: {
        pricingAddonProductGid: true,
        pricingAddonVariantGid: true,
        pricingCartTransformId: true,
        pricingEnabledAt: true,
      },
    });

    return updated;
  },

  async syncOptionSet(
    admin: AdminGraphqlClient,
    shopId: string,
    optionSetId: string,
  ) {
    const shop = await prisma.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        pricingEnabledAt: true,
      },
    });

    if (!shop?.pricingEnabledAt) {
      return;
    }

    const optionSet = await prisma.optionSet.findFirst({
      where: {
        id: optionSetId,
        shopId,
        deletedAt: null,
      },
      select: {
        id: true,
        status: true,
        fields: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            position: "asc",
          },
          select: {
            id: true,
            type: true,
            priceAdjustmentType: true,
            priceAdjustmentValue: true,
            values: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                position: "asc",
              },
              select: {
                value: true,
                priceAdjustmentType: true,
                priceAdjustmentValue: true,
              },
            },
            conditions: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                position: "asc",
              },
              take: 1,
              select: {
                sourceFieldId: true,
                operator: true,
                expectedValue: true,
              },
            },
          },
        },
        assignments: {
          select: {
            productGid: true,
          },
        },
      },
    });

    if (!optionSet) {
      return;
    }

    const value = JSON.stringify(
      buildPricingConfig(optionSet),
    );

    if (Buffer.byteLength(value, "utf8") > 9500) {
      throw new Error(
        "OptionFlow pricing configuration is too large for Shopify Functions. Reduce the number of priced choices.",
      );
    }

    const owners = optionSet.assignments.map(
      (assignment) => assignment.productGid,
    );

    for (let index = 0; index < owners.length; index += 20) {
      const batch = owners.slice(index, index + 20);

      await setMetafields(
        admin,
        batch.map((ownerId) => ({
          ownerId,
          namespace: APP_NAMESPACE,
          key: PRICING_KEY,
          type: "json",
          value,
        })),
      );
    }
  },

  async disableOptionSetProducts(
    admin: AdminGraphqlClient,
    shopId: string,
    optionSetId: string,
  ) {
    const assignments =
      await prisma.productAssignment.findMany({
        where: {
          shopId,
          optionSetId,
        },
        select: {
          productGid: true,
        },
      });

    const value = JSON.stringify({
      version: 1,
      enabled: false,
      fields: [],
    });

    for (
      let index = 0;
      index < assignments.length;
      index += 20
    ) {
      const batch = assignments.slice(
        index,
        index + 20,
      );

      await setMetafields(
        admin,
        batch.map(({ productGid }) => ({
          ownerId: productGid,
          namespace: APP_NAMESPACE,
          key: PRICING_KEY,
          type: "json",
          value,
        })),
      );
    }
  },

  async disableProductPricing(
    admin: AdminGraphqlClient,
    productGid: string,
  ) {
    await setMetafields(admin, [
      {
        ownerId: productGid,
        namespace: APP_NAMESPACE,
        key: PRICING_KEY,
        type: "json",
        value: JSON.stringify({
          version: 1,
          enabled: false,
          fields: [],
        }),
      },
    ]);
  },
};
