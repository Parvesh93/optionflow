import { Prisma } from "@prisma/client";
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

function parseAdjustmentType(value: string) {
  if (
    value === "NONE" ||
    value === "FIXED" ||
    value === "PERCENTAGE"
  ) {
    return value;
  }

  throw new OptionFieldValidationError(
    "Choose a valid price adjustment type.",
  );
}

function parseAdjustmentValue(
  type: "NONE" | "FIXED" | "PERCENTAGE",
  rawValue: string,
) {
  if (type === "NONE") {
    return null;
  }

  const normalized = rawValue.trim();

  if (!normalized) {
    throw new OptionFieldValidationError(
      "Enter a price adjustment value.",
    );
  }

  const numeric = Number(normalized);

  if (!Number.isFinite(numeric)) {
    throw new OptionFieldValidationError(
      "Price adjustment must be a valid number.",
    );
  }

  if (type === "PERCENTAGE" && Math.abs(numeric) > 100) {
    throw new OptionFieldValidationError(
      "Percentage adjustment must be between -100 and 100.",
    );
  }

  return new Prisma.Decimal(normalized);
}

function parseValues(type: OptionFieldType, raw: string) {
  if (type !== "SELECT" && type !== "RADIO") {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw || "[]");
  } catch {
    throw new OptionFieldValidationError(
      "Choice data is invalid. Please review the option choices.",
    );
  }

  if (!Array.isArray(parsed)) {
    throw new OptionFieldValidationError(
      "Choice data is invalid. Please review the option choices.",
    );
  }

  if (parsed.length === 0) {
    throw new OptionFieldValidationError(
      "Add at least one choice.",
    );
  }

  if (parsed.length > 100) {
    throw new OptionFieldValidationError(
      "A field can contain a maximum of 100 choices.",
    );
  }

  const seenValues = new Set<string>();

  return parsed.map((entry, index) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      !("label" in entry)
    ) {
      throw new OptionFieldValidationError(
        `Choice ${index + 1} needs a label.`,
      );
    }

    const choice = entry as {
      label?: unknown;
      priceAdjustmentType?: unknown;
      priceAdjustmentValue?: unknown;
    };

    const label =
      typeof choice.label === "string"
        ? choice.label.trim()
        : "";

    if (!label) {
      throw new OptionFieldValidationError(
        `Choice ${index + 1} needs a label.`,
      );
    }

    if (label.length > 100) {
      throw new OptionFieldValidationError(
        `Choice ${index + 1} must be 100 characters or fewer.`,
      );
    }

    const value =
      slugifyValue(label) || `value-${index + 1}`;

    if (seenValues.has(value)) {
      throw new OptionFieldValidationError(
        "Choice labels must be unique.",
      );
    }

    seenValues.add(value);

    const priceAdjustmentType =
      parseAdjustmentType(
        typeof choice.priceAdjustmentType === "string"
          ? choice.priceAdjustmentType
          : "NONE",
      );

    const priceAdjustmentValue =
      parseAdjustmentValue(
        priceAdjustmentType,
        typeof choice.priceAdjustmentValue === "string"
          ? choice.priceAdjustmentValue
          : "",
      );

    return {
      label,
      value,
      position: index,
      priceAdjustmentType,
      priceAdjustmentValue,
    };
  });
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
    priceAdjustmentType: field.priceAdjustmentType,
    priceAdjustmentValue:
      field.priceAdjustmentValue?.toString() ?? "",
    position: field.position,
    values: field.values.map((value) => ({
      ...value,
      priceAdjustmentValue:
        value.priceAdjustmentValue?.toString() ?? "",
    })),
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
      priceAdjustmentType: string;
      priceAdjustmentValue: string;
      valuesJson: string;
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
    const values = parseValues(type, input.valuesJson);

    const fieldPriceAdjustmentType =
      type === "SELECT" || type === "RADIO"
        ? "NONE"
        : parseAdjustmentType(
            input.priceAdjustmentType || "NONE",
          );

    const fieldPriceAdjustmentValue =
      parseAdjustmentValue(
        fieldPriceAdjustmentType,
        input.priceAdjustmentValue,
      );

    const payload = {
      shopId,
      optionSetId,
      type,
      label,
      placeholder: input.placeholder.trim() || null,
      helpText: input.helpText.trim() || null,
      isRequired: input.isRequired,
      priceAdjustmentType: fieldPriceAdjustmentType,
      priceAdjustmentValue: fieldPriceAdjustmentValue,
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

  async reorderFields(
    shopId: string,
    optionSetId: string,
    orderedFieldIds: string[],
  ) {
    if (orderedFieldIds.length === 0) {
      return;
    }

    const reordered = await optionFieldRepository.reorderFields(
      shopId,
      optionSetId,
      orderedFieldIds,
    );

    if (!reordered) {
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
