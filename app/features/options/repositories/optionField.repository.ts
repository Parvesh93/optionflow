import type {
  OptionFieldType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import prisma from "~/db.server";

export type OptionFieldRepositoryClient =
  | PrismaClient
  | Prisma.TransactionClient;

type SaveFieldInput = {
  shopId: string;
  optionSetId: string;
  fieldId?: string;
  type: OptionFieldType;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  isRequired: boolean;
  values: Array<{
    label: string;
    value: string;
    position: number;
  }>;
};

async function findOptionSet(
  shopId: string,
  optionSetId: string,
  client: OptionFieldRepositoryClient = prisma,
) {
  return client.optionSet.findFirst({
    where: {
      id: optionSetId,
      shopId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });
}

export const optionFieldRepository = {
  findOptionSet,

  async getBuilder(
    shopId: string,
    optionSetId: string,
    client: OptionFieldRepositoryClient = prisma,
  ) {
    return client.optionSet.findFirst({
      where: {
        id: optionSetId,
        shopId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
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
              },
            },
          },
        },
      },
    });
  },

  async createField(input: SaveFieldInput) {
    return prisma.$transaction(async (tx) => {
      const optionSet = await findOptionSet(
        input.shopId,
        input.optionSetId,
        tx,
      );

      if (!optionSet) {
        return null;
      }

      const last = await tx.optionField.findFirst({
        where: {
          optionSetId: input.optionSetId,
          deletedAt: null,
        },
        orderBy: {
          position: "desc",
        },
        select: {
          position: true,
        },
      });

      return tx.optionField.create({
        data: {
          optionSetId: input.optionSetId,
          type: input.type,
          label: input.label,
          placeholder: input.placeholder,
          helpText: input.helpText,
          isRequired: input.isRequired,
          position: (last?.position ?? -1) + 1,
          values: {
            create: input.values,
          },
        },
      });
    });
  },

  async updateField(input: SaveFieldInput & { fieldId: string }) {
    return prisma.$transaction(async (tx) => {
      const field = await tx.optionField.findFirst({
        where: {
          id: input.fieldId,
          optionSetId: input.optionSetId,
          optionSet: {
            shopId: input.shopId,
            deletedAt: null,
          },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!field) {
        return null;
      }

      await tx.optionField.update({
        where: {
          id: input.fieldId,
        },
        data: {
          type: input.type,
          label: input.label,
          placeholder: input.placeholder,
          helpText: input.helpText,
          isRequired: input.isRequired,
        },
      });

      await tx.optionValue.updateMany({
        where: {
          optionFieldId: input.fieldId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      if (input.values.length > 0) {
        await tx.optionValue.createMany({
          data: input.values.map((value) => ({
            optionFieldId: input.fieldId,
            label: value.label,
            value: value.value,
            position: value.position,
          })),
        });
      }

      return tx.optionField.findUnique({
        where: {
          id: input.fieldId,
        },
      });
    });
  },

  async softDeleteField(
    shopId: string,
    optionSetId: string,
    fieldId: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const field = await tx.optionField.findFirst({
        where: {
          id: fieldId,
          optionSetId,
          optionSet: {
            shopId,
            deletedAt: null,
          },
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!field) {
        return false;
      }

      const now = new Date();

      await tx.optionField.update({
        where: {
          id: fieldId,
        },
        data: {
          deletedAt: now,
        },
      });

      await tx.optionValue.updateMany({
        where: {
          optionFieldId: fieldId,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
        },
      });

      return true;
    });
  },

  async moveField(
    shopId: string,
    optionSetId: string,
    fieldId: string,
    direction: "up" | "down",
  ) {
    return prisma.$transaction(async (tx) => {
      const fields = await tx.optionField.findMany({
        where: {
          optionSetId,
          optionSet: {
            shopId,
            deletedAt: null,
          },
          deletedAt: null,
        },
        orderBy: [
          { position: "asc" },
          { createdAt: "asc" },
        ],
        select: {
          id: true,
          position: true,
        },
      });

      const index = fields.findIndex(
        (field) => field.id === fieldId,
      );

      if (index < 0) {
        return false;
      }

      const targetIndex =
        direction === "up" ? index - 1 : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= fields.length
      ) {
        return true;
      }

      const current = fields[index];
      const target = fields[targetIndex];

      await tx.optionField.update({
        where: {
          id: current.id,
        },
        data: {
          position: target.position,
        },
      });

      await tx.optionField.update({
        where: {
          id: target.id,
        },
        data: {
          position: current.position,
        },
      });

      return true;
    });
  },
};
