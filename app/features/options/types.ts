export type BuilderFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX";

export type PriceAdjustmentType =
  | "NONE"
  | "FIXED"
  | "PERCENTAGE";

export type BuilderValueDTO = {
  id: string;
  label: string;
  value: string;
  position: number;
  priceAdjustmentType: PriceAdjustmentType;
  priceAdjustmentValue: string;
};

export type BuilderFieldDTO = {
  id: string;
  type: BuilderFieldType;
  label: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
  priceAdjustmentType: PriceAdjustmentType;
  priceAdjustmentValue: string;
  position: number;
  values: BuilderValueDTO[];
};

export type OptionBuilderDTO = {
  optionSet: {
    id: string;
    name: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
  fields: BuilderFieldDTO[];
};
