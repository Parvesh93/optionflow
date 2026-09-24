import type {
  OptionSetStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import prisma from "~/db.server";

import type { OptionSetSort } from "../types";

export type OptionSetRepositoryClient =
  | PrismaClient
  | Prisma.TransactionClient;

type ListOptionSetsInput = {
  shopId: string;
  search?: string;
  status?: OptionSetStatus;
  sort: OptionSetSort;
  skip: number;
  take: number;
};

type CreateOptionSetRepositoryInput = {
  shopId: string;
  name: string;
  handle: string;
  description: string | null;
  internalNote: string | null;
  status: OptionSetStatus;
  publishedAt: Date | null;
};

type UpdateOptionSetRepositoryInput = {
  shopId: string;
  optionSetId: string;
  name: string;
  description: string | null;
  internalNote: string | null;
  status: OptionSetStatus;
  publishedAt: Date | null;
  publishedRevision: number | null;
  expectedRevision: number;
};

type DuplicateOptionSetRepositoryInput = {
  shopId: string;
  sourceOptionSetId: string;
  name: string;
  handle: string;
  description: string | null;
  internalNote: string | null;
  displayTitle: string | null;
  tags: Prisma.InputJsonValue | null;
  priority: number;
};

function buildWhere({
  shopId,
  search,
  status,
}: Pick<
  ListOptionSetsInput,
  "shopId" | "search" | "status"
>): Prisma.OptionSetWhereInput {
  const normalizedSearch = search?.trim();

  return {
    shopId,
    deletedAt: null,
    ...(status
      ? {
          status,
        }
      : {}),
    ...(normalizedSearch
      ? {
          OR: [
            {
              name: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              handle: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };
}

function buildOrderBy(
  sort: OptionSetSort,
): Prisma.OptionSetOrderByWithRelationInput[] {
  switch (sort) {
    case "UPDATED_ASC":
      return [
        { updatedAt: "asc" },
        { id: "asc" },
      ];

    case "NAME_ASC":
      return [
        { name: "asc" },
        { id: "asc" },
      ];

    case "NAME_DESC":
      return [
        { name: "desc" },
        { id: "desc" },
      ];

    case "CREATED_ASC":
      return [
        { createdAt: "asc" },
        { id: "asc" },
      ];

    case "CREATED_DESC":
      return [
        { createdAt: "desc" },
        { id: "desc" },
      ];

    case "UPDATED_DESC":
    default:
      return [
        { updatedAt: "desc" },
        { id: "desc" },
      ];
  }
}

export const optionSetRepository = {
  async list(
    input: ListOptionSetsInput,
    client: OptionSetRepositoryClient = prisma,
  ) {
    const where = buildWhere(input);

    return client.optionSet.findMany({
  where,
  select: {
    id: true,
    name: true,
    handle: true,
    description: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    publishedAt: true,
    _count: {
      select: {
        assignments: true,
      },
    },
  },
  orderBy: buildOrderBy(input.sort),
  skip: input.skip,
  take: input.take,
});
  },

  async create(
  input: CreateOptionSetRepositoryInput,
  client: OptionSetRepositoryClient = prisma,
) {
  return client.optionSet.create({
    data: {
      shopId: input.shopId,
      name: input.name,
      handle: input.handle,
      description: input.description,
      internalNote: input.internalNote,
      status: input.status,
      publishedAt: input.publishedAt,
      publishedRevision:
        input.status === "PUBLISHED" ? 1 : null,
    },
  });
},

async handleExists(
  shopId: string,
  handle: string,
  client: OptionSetRepositoryClient = prisma,
) {
  const count = await client.optionSet.count({
    where: {
      shopId,
      handle,
    },
  });

  return count > 0;
},

 async count(
  input: Pick<
    ListOptionSetsInput,
    "shopId" | "search" | "status"
  >,
  client: OptionSetRepositoryClient = prisma,
) {
  return client.optionSet.count({
    where: buildWhere(input),
  });
},

  async findById(
    shopId: string,
    optionSetId: string,
    client: OptionSetRepositoryClient = prisma,
  ) {
    return client.optionSet.findFirst({
      where: {
        id: optionSetId,
        shopId,
        deletedAt: null,
      },
    });
  },
  
async update(
  input: UpdateOptionSetRepositoryInput,
  client: OptionSetRepositoryClient = prisma,
) {
  const result = await client.optionSet.updateMany({
    where: {
      id: input.optionSetId,
      shopId: input.shopId,
      deletedAt: null,
      revision: input.expectedRevision,
    },
    data: {
      name: input.name,
      description: input.description,
      internalNote: input.internalNote,
      status: input.status,
      publishedAt: input.publishedAt,
      publishedRevision: input.publishedRevision,
      revision: {
        increment: 1,
      },
    },
  });

  if (result.count === 0) {
    return null;
  }

  return client.optionSet.findFirst({
    where: {
      id: input.optionSetId,
      shopId: input.shopId,
      deletedAt: null,
    },
  });
},

  async bulkArchive(
    shopId: string,
    optionSetIds: string[],
    client: OptionSetRepositoryClient = prisma,
  ) {
    return client.optionSet.updateMany({
      where: {
        id: { in: optionSetIds },
        shopId,
        deletedAt: null,
        status: { not: "ARCHIVED" },
      },
      data: {
        status: "ARCHIVED",
        publishedAt: null,
        publishedRevision: null,
        revision: { increment: 1 },
      },
    });
  },

  async bulkRestore(
    shopId: string,
    optionSetIds: string[],
    client: OptionSetRepositoryClient = prisma,
  ) {
    return client.optionSet.updateMany({
      where: {
        id: { in: optionSetIds },
        shopId,
        deletedAt: null,
        status: "ARCHIVED",
      },
      data: {
        status: "DRAFT",
        revision: { increment: 1 },
      },
    });
  },

  async bulkSoftDelete(
    shopId: string,
    optionSetIds: string[],
    client: OptionSetRepositoryClient = prisma,
  ) {
    return client.optionSet.updateMany({
      where: {
        id: { in: optionSetIds },
        shopId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        publishedAt: null,
        publishedRevision: null,
        revision: { increment: 1 },
      },
    });
  },

  async softDelete(
    shopId: string,
    optionSetId: string,
    client: OptionSetRepositoryClient = prisma,
  ) {
    const result = await client.optionSet.updateMany({
      where: {
        id: optionSetId,
        shopId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        publishedAt: null,
        publishedRevision: null,
        revision: {
          increment: 1,
        },
      },
    });

    return result.count > 0;
  },

  async archive(
    shopId: string,
    optionSetId: string,
    client: OptionSetRepositoryClient = prisma,
  ) {
    const result = await client.optionSet.updateMany({
      where: {
        id: optionSetId,
        shopId,
        deletedAt: null,
        status: {
          not: "ARCHIVED",
        },
      },
      data: {
        status: "ARCHIVED",
        publishedAt: null,
        publishedRevision: null,
        revision: {
          increment: 1,
        },
      },
    });

    return result.count > 0;
  },

  async restore(
    shopId: string,
    optionSetId: string,
    client: OptionSetRepositoryClient = prisma,
  ) {
    const result = await client.optionSet.updateMany({
      where: {
        id: optionSetId,
        shopId,
        deletedAt: null,
        status: "ARCHIVED",
      },
      data: {
        status: "DRAFT",
        revision: {
          increment: 1,
        },
      },
    });

    return result.count > 0;
  },

  async duplicate(
    input: DuplicateOptionSetRepositoryInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.optionSet.findFirst({
        where: {
          id: input.sourceOptionSetId,
          shopId: input.shopId,
          deletedAt: null,
        },
        select: {
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
              conditions: {
                where: {
                  deletedAt: null,
                },
                orderBy: [
                  { position: "asc" },
                  { createdAt: "asc" },
                ],
                select: {
                  sourceFieldId: true,
                  operator: true,
                  expectedValue: true,
                  position: true,
                },
              },
              values: {
                where: {
                  deletedAt: null,
                },
                orderBy: [
                  { position: "asc" },
                  { createdAt: "asc" },
                ],
                select: {
                  label: true,
                  value: true,
                  priceAdjustmentType: true,
                  priceAdjustmentValue: true,
                  position: true,
                },
              },
            },
          },
        },
      });

      if (!source) {
        return null;
      }

      const duplicated = await tx.optionSet.create({
        data: {
          shopId: input.shopId,
          name: input.name,
          handle: input.handle,
          description: input.description,
          internalNote: input.internalNote,
          displayTitle: input.displayTitle,
          tags:
            input.tags === null
              ? undefined
              : input.tags,
          priority: input.priority,
          status: "DRAFT",
          revision: 1,
          publishedRevision: null,
          publishedAt: null,
        },
      });

      const fieldIdMap = new Map<string, string>();

      for (const field of source.fields) {
        const createdField = await tx.optionField.create({
          data: {
            optionSetId: duplicated.id,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            helpText: field.helpText,
            isRequired: field.isRequired,
            priceAdjustmentType:
              field.priceAdjustmentType,
            priceAdjustmentValue:
              field.priceAdjustmentValue,
            position: field.position,
            values: {
              create: field.values.map((value) => ({
                label: value.label,
                value: value.value,
                priceAdjustmentType:
                  value.priceAdjustmentType,
                priceAdjustmentValue:
                  value.priceAdjustmentValue,
                position: value.position,
              })),
            },
          },
          select: {
            id: true,
          },
        });

        fieldIdMap.set(field.id, createdField.id);
      }

      for (const field of source.fields) {
        const targetFieldId = fieldIdMap.get(field.id);

        if (!targetFieldId) {
          continue;
        }

        for (const condition of field.conditions) {
          const sourceFieldId = fieldIdMap.get(
            condition.sourceFieldId,
          );

          if (!sourceFieldId) {
            continue;
          }

          await tx.optionCondition.create({
            data: {
              targetFieldId,
              sourceFieldId,
              operator: condition.operator,
              expectedValue:
                condition.expectedValue,
              position: condition.position,
            },
          });
        }
      }

      return duplicated;
    });
  },

  async findByHandle(
    shopId: string,
    handle: string,
    client: OptionSetRepositoryClient = prisma,
  ) {
    return client.optionSet.findFirst({
      where: {
        shopId,
        handle,
        deletedAt: null,
      },
    });
  },
};

