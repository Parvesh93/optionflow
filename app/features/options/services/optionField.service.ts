import type { OptionFieldType } from "@prisma/client";

import { optionFieldRepository } from "../repositories/optionField.repository";
import type {
  BuilderFieldDTO,
  BuilderFieldType,
  OptionBuilderDTO,
} from "../types";

export class OptionBuilderNotFoundError extends Error {
  constructor() {
    super("Option set not found.");
    this.name = "OptionBuilderNotFoundError";
  }
}

export class OptionFieldValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OptionFieldValidationError";
  }
}

function parseType(value: string): OptionFieldType {
  const supported: BuilderFieldType[] = [
    "TEXT",
    "TEXTAREA",
    "NUMBER",
    "SELECT",
    "RADIO",
    "CHECKBOX",
  ];

  if (!supported.includes(value as BuilderFieldType)) {
    throw new OptionFieldValidationError(
      "Choose a valid option type.",
    );
  }

  return value as OptionFieldType;
}

function slugifyValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseValues(type: OptionFieldType, raw: string) {
  if (type !== "SELECT" && type !== "RADIO") {
    return [];
  }

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label, index) => ({
      label,
      value: slugifyValue(label) || `value-${index + 1}`,
      position: index,
    }));
}

type RepositoryBuilder = NonNullable<
  Awaited<ReturnType<typeof optionFieldRepository.getBuilder>>
>;

function mapField(
  field: RepositoryBuilder["fields"][number],
): BuilderFieldDTO {
  return {
    id: field.id,
    type: field.type,
    label: field.label,
    placeholder: field.placeholder ?? "",
    helpText: field.helpText ?? "",
    isRequired: field.isRequired,
    position: field.position,
    values: field.values,
  };
}

export const optionFieldService = {
  async getBuilder(
    shopId: string,
    optionSetId: string,
  ): Promise<OptionBuilderDTO> {
    const builder = await optionFieldRepository.getBuilder(
      shopId,
      optionSetId,
    );

    if (!builder) {
      throw new OptionBuilderNotFoundError();
    }

    return {
      optionSet: {
        id: builder.id,
        name: builder.name,
        status: builder.status,
      },
      fields: builder.fields.map(mapField),
    };
  },

  async saveField(
    shopId: string,
    optionSetId: string,
    input: {
      fieldId?: string;
      type: string;
      label: string;
      placeholder: string;
      helpText: string;
      isRequired: boolean;
      valuesText: string;
    },
  ) {
    const label = input.label.trim();

    if (!label) {
      throw new OptionFieldValidationError(
        "Field label is required.",
      );
    }

    if (label.length > 100) {
      throw new OptionFieldValidationError(
        "Field label must be 100 characters or fewer.",
      );
    }

    const type = parseType(input.type);
    const values = parseValues(type, input.valuesText);

    const payload = {
      shopId,
      optionSetId,
      type,
      label,
      placeholder: input.placeholder.trim() || null,
      helpText: input.helpText.trim() || null,
      isRequired: input.isRequired,
      values,
    };

    const result = input.fieldId
      ? await optionFieldRepository.updateField({
          ...payload,
          fieldId: input.fieldId,
        })
      : await optionFieldRepository.createField(payload);

    if (!result) {
      throw new OptionBuilderNotFoundError();
    }

    return result;
  },

  async deleteField(
    shopId: string,
    optionSetId: string,
    fieldId: string,
  ) {
    if (!fieldId) {
      throw new OptionBuilderNotFoundError();
    }

    const deleted =
      await optionFieldRepository.softDeleteField(
        shopId,
        optionSetId,
        fieldId,
      );

    if (!deleted) {
      throw new OptionBuilderNotFoundError();
    }
  },

  async moveField(
    shopId: string,
    optionSetId: string,
    fieldId: string,
    direction: "up" | "down",
  ) {
    if (!fieldId) {
      throw new OptionBuilderNotFoundError();
    }

    const moved = await optionFieldRepository.moveField(
      shopId,
      optionSetId,
      fieldId,
      direction,
    );

    if (!moved) {
      throw new OptionBuilderNotFoundError();
    }
  },
};
