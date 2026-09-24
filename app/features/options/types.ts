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

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "IS_CHECKED"
  | "IS_NOT_CHECKED";

export type BuilderValueDTO = {
  id: string;
  label: string;
  value: string;
  position: number;
  priceAdjustmentType: PriceAdjustmentType;
  priceAdjustmentValue: string;
};

export type BuilderConditionDTO = {
  id: string;
  sourceFieldId: string;
  operator: ConditionOperator;
  expectedValue: string;
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
  condition: BuilderConditionDTO | null;
};

export type OptionBuilderDTO = {
  optionSet: {
    id: string;
    name: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
  fields: BuilderFieldDTO[];
};
