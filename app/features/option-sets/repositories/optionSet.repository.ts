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
      deletedAt: null,
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

