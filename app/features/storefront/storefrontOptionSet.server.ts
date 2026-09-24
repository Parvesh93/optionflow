import prisma from "~/db.server";

function mapPrice(
  type: "NONE" | "FIXED" | "PERCENTAGE",
  value: { toString(): string } | null,
) {
  return {
    type,
    value: value?.toString() ?? "",
  };
}

export async function getStorefrontOptionSet(
  shopifyDomain: string,
  productGid: string,
  fallbackHandle = "",
) {
  const normalizedDomain =
    shopifyDomain.trim().toLowerCase();
  const normalizedProductGid = productGid.trim();
  const normalizedHandle = fallbackHandle.trim();

  const assignment = normalizedProductGid
    ? await prisma.productAssignment.findFirst({
        where: {
          productGid: normalizedProductGid,
          shop: {
            shopifyDomain: normalizedDomain,
            status: "ACTIVE",
            deletedAt: null,
          },
          optionSet: {
            status: "PUBLISHED",
            deletedAt: null,
          },
        },
        select: {
          optionSetId: true,
        },
      })
    : null;

  const optionSet = await prisma.optionSet.findFirst({
    where: {
      id: assignment?.optionSetId,
      ...(assignment
        ? {}
        : normalizedHandle
          ? { handle: normalizedHandle }
          : { id: "__missing__" }),
      status: "PUBLISHED",
      deletedAt: null,
      shop: {
        shopifyDomain: normalizedDomain,
        status: "ACTIVE",
        deletedAt: null,
      },
    },
    select: {
      id: true,
      name: true,
      displayTitle: true,
      handle: true,
      fields: {
        where: {
          deletedAt: null,
        },
        orderBy: [
          { position: "asc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          type: true,
          label: true,
          placeholder: true,
          helpText: true,
          isRequired: true,
          priceAdjustmentType: true,
          priceAdjustmentValue: true,
          position: true,
          values: {
            where: {
              deletedAt: null,
            },
            orderBy: [
              { position: "asc" },
              { createdAt: "asc" },
            ],
            select: {
              id: true,
              label: true,
              value: true,
              position: true,
              priceAdjustmentType: true,
              priceAdjustmentValue: true,
            },
          },
          conditions: {
            where: {
              deletedAt: null,
            },
            orderBy: [
              { position: "asc" },
              { createdAt: "asc" },
            ],
            take: 1,
            select: {
              sourceFieldId: true,
              operator: true,
              expectedValue: true,
            },
          },
        },
      },
    },
  });

  if (!optionSet) {
    return null;
  }

  return {
    id: optionSet.id,
    name: optionSet.name,
    title: optionSet.displayTitle || optionSet.name,
    handle: optionSet.handle,
    fields: optionSet.fields.map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      placeholder: field.placeholder ?? "",
      helpText: field.helpText ?? "",
      required: field.isRequired,
      position: field.position,
      priceAdjustment: mapPrice(
        field.priceAdjustmentType,
        field.priceAdjustmentValue,
      ),
      values: field.values.map((value) => ({
        id: value.id,
        label: value.label,
        value: value.value,
        position: value.position,
        priceAdjustment: mapPrice(
          value.priceAdjustmentType,
          value.priceAdjustmentValue,
        ),
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
