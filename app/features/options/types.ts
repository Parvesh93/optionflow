export type BuilderFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX";

export type BuilderValueDTO = {
  id: string;
  label: string;
  value: string;
  position: number;
};

export type BuilderFieldDTO = {
  id: string;
  type: BuilderFieldType;
  label: string;
  placeholder: string;
  helpText: string;
  isRequired: boolean;
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
