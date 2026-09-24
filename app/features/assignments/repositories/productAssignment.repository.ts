import prisma from "~/db.server";

export const productAssignmentRepository = {
  async listForOptionSet(
    shopId: string,
    optionSetId: string,
  ) {
    return prisma.productAssignment.findMany({
      where: {
        shopId,
        optionSetId,
      },
      orderBy: {
        productTitle: "asc",
      },
    });
  },

  async assignProduct(input: {
    shopId: string;
    optionSetId: string;
    productGid: string;
    productTitle: string;
    productHandle: string;
    productImageUrl: string | null;
  }) {
    return prisma.productAssignment.upsert({
      where: {
        shopId_productGid: {
          shopId: input.shopId,
          productGid: input.productGid,
        },
      },
      create: input,
      update: {
        optionSetId: input.optionSetId,
        productTitle: input.productTitle,
        productHandle: input.productHandle,
        productImageUrl: input.productImageUrl,
      },
    });
  },

  async unassignProduct(
    shopId: string,
    optionSetId: string,
    productGid: string,
  ) {
    const result = await prisma.productAssignment.deleteMany({
      where: {
        shopId,
        optionSetId,
        productGid,
      },
    });

    return result.count > 0;
  },

  async findPublishedAssignment(
    shopifyDomain: string,
    productGid: string,
  ) {
    return prisma.productAssignment.findFirst({
      where: {
        productGid,
        shop: {
          shopifyDomain,
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
    });
  },
};
