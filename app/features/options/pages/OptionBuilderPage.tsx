import { useState } from "react";

import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  EmptyState,
  FormLayout,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";

import { OFPage } from "~/components/ui";

import type { optionBuilderAction } from "../action.server";
import type { optionBuilderLoader } from "../loader.server";
import type {
  BuilderFieldDTO,
  BuilderFieldType,
} from "../types";

const typeOptions = [
  { label: "Text", value: "TEXT" },
  { label: "Textarea", value: "TEXTAREA" },
  { label: "Number", value: "NUMBER" },
  { label: "Dropdown", value: "SELECT" },
  { label: "Radio buttons", value: "RADIO" },
  { label: "Checkbox", value: "CHECKBOX" },
];

function valuesToText(field: BuilderFieldDTO) {
  return field.values.map((value) => value.label).join("\n");
}

function FieldPreview({
  field,
}: {
  field: BuilderFieldDTO;
}) {
  if (field.type === "SELECT") {
    return (
      <Select
        label={field.label}
        disabled
        value=""
        options={[
          { label: "Choose an option", value: "" },
          ...field.values.map((value) => ({
            label: value.label,
            value: value.value,
          })),
        ]}
        helpText={field.helpText || undefined}
      />
    );
  }

  if (field.type === "RADIO") {
    return (
      <BlockStack gap="200">
        <Text as="p" fontWeight="semibold">
          {field.label}
          {field.isRequired ? " *" : ""}
        </Text>
        {field.values.length > 0 ? (
          field.values.map((value) => (
            <Checkbox
              key={value.id}
              label={value.label}
              checked={false}
              disabled
              onChange={() => undefined}
            />
          ))
        ) : (
          <Text as="p" tone="subdued">
            Add values to preview this field.
          </Text>
        )}
      </BlockStack>
    );
  }

  if (field.type === "CHECKBOX") {
    return (
      <Checkbox
        label={field.label}
        checked={false}
        disabled
        onChange={() => undefined}
        helpText={field.helpText || undefined}
      />
    );
  }

  return (
    <TextField
      label={field.label}
      value=""
      onChange={() => undefined}
      autoComplete="off"
      disabled
      multiline={field.type === "TEXTAREA" ? 3 : false}
      type={field.type === "NUMBER" ? "number" : "text"}
      placeholder={field.placeholder || undefined}
      helpText={field.helpText || undefined}
      requiredIndicator={field.isRequired}
    />
  );
}

function FieldEditor({
  field,
  optionSetId,
  index,
  count,
}: {
  field: BuilderFieldDTO;
  optionSetId: string;
  index: number;
  count: number;
}) {
  const fetcher = useFetcher();
  const [type, setType] =
    useState<BuilderFieldType>(field.type);
  const [label, setLabel] = useState(field.label);
  const [placeholder, setPlaceholder] = useState(
    field.placeholder,
  );
  const [helpText, setHelpText] = useState(
    field.helpText,
  );
  const [required, setRequired] = useState(
    field.isRequired,
  );
  const [valuesText, setValuesText] = useState(
    valuesToText(field),
  );

  const busy = fetcher.state !== "idle";
  const supportsValues =
    type === "SELECT" || type === "RADIO";

  function submitUtility(
    intent: "moveField" | "deleteField",
    extra?: Record<string, string>,
  ) {
    const formData = new FormData();
    formData.set("intent", intent);
    formData.set("fieldId", field.id);

    for (const [key, value] of Object.entries(
      extra ?? {},
    )) {
      formData.set(key, value);
    }

    fetcher.submit(formData, {
      method: "post",
      action: `/app/option-sets/${optionSetId}/builder`,
    });
  }

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack
          align="space-between"
          blockAlign="center"
          gap="300"
        >
          <BlockStack gap="100">
            <Text as="h3" variant="headingMd">
              {field.label}
            </Text>
            <Text as="p" tone="subdued">
              {typeOptions.find(
                (option) => option.value === field.type,
              )?.label ?? field.type}
            </Text>
          </BlockStack>

          <InlineStack gap="200">
            <Button
              disabled={busy || index === 0}
              onClick={() =>
                submitUtility("moveField", {
                  direction: "up",
                })
              }
            >
              Move up
            </Button>
            <Button
              disabled={busy || index === count - 1}
              onClick={() =>
                submitUtility("moveField", {
                  direction: "down",
                })
              }
            >
              Move down
            </Button>
            <Button
              tone="critical"
              disabled={busy}
              onClick={() =>
                submitUtility("deleteField")
              }
            >
              Delete
            </Button>
          </InlineStack>
        </InlineStack>

        <Divider />

        <Form
          method="post"
          action={`/app/option-sets/${optionSetId}/builder`}
        >
          <input
            type="hidden"
            name="intent"
            value="saveField"
          />
          <input
            type="hidden"
            name="fieldId"
            value={field.id}
          />

          <BlockStack gap="400">
            <FormLayout>
              <Select
                label="Option type"
                name="type"
                value={type}
                options={typeOptions}
                onChange={(value) =>
                  setType(value as BuilderFieldType)
                }
              />

              <TextField
                label="Label"
                name="label"
                value={label}
                onChange={setLabel}
                autoComplete="off"
                maxLength={100}
                requiredIndicator
              />

              {type !== "CHECKBOX" ? (
                <TextField
                  label="Placeholder"
                  name="placeholder"
                  value={placeholder}
                  onChange={setPlaceholder}
                  autoComplete="off"
                />
              ) : (
                <input
                  type="hidden"
                  name="placeholder"
                  value=""
                />
              )}

              <TextField
                label="Help text"
                name="helpText"
                value={helpText}
                onChange={setHelpText}
                autoComplete="off"
              />

              <Checkbox
                label="Required field"
                name="isRequired"
                checked={required}
                onChange={setRequired}
              />

              {supportsValues ? (
                <TextField
                  label="Choices"
                  name="valuesText"
                  value={valuesText}
                  onChange={setValuesText}
                  autoComplete="off"
                  multiline={5}
                  helpText="Enter one choice per line."
                />
              ) : (
                <input
                  type="hidden"
                  name="valuesText"
                  value=""
                />
              )}
            </FormLayout>

            <InlineStack align="end">
              <Button submit variant="primary">
                Save field
              </Button>
            </InlineStack>
          </BlockStack>
        </Form>
      </BlockStack>
    </Card>
  );
}

function AddFieldCard({
  optionSetId,
}: {
  optionSetId: string;
}) {
  const [type, setType] =
    useState<BuilderFieldType>("TEXT");
  const [label, setLabel] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [required, setRequired] = useState(false);
  const [valuesText, setValuesText] = useState("");

  const supportsValues =
    type === "SELECT" || type === "RADIO";

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="100">
          <Text as="h2" variant="headingMd">
            Add option
          </Text>
          <Text as="p" tone="subdued">
            Add a field customers can interact with on the
            product page.
          </Text>
        </BlockStack>

        <Form
          method="post"
          action={`/app/option-sets/${optionSetId}/builder`}
        >
          <input
            type="hidden"
            name="intent"
            value="saveField"
          />

          <BlockStack gap="400">
            <FormLayout>
              <Select
                label="Option type"
                name="type"
                value={type}
                options={typeOptions}
                onChange={(value) =>
                  setType(value as BuilderFieldType)
                }
              />

              <TextField
                label="Label"
                name="label"
                value={label}
                onChange={setLabel}
                autoComplete="off"
                placeholder="For example, Engraving text"
                requiredIndicator
                maxLength={100}
              />

              {type !== "CHECKBOX" ? (
                <TextField
                  label="Placeholder"
                  name="placeholder"
                  value={placeholder}
                  onChange={setPlaceholder}
                  autoComplete="off"
                />
              ) : (
                <input
                  type="hidden"
                  name="placeholder"
                  value=""
                />
              )}

              <TextField
                label="Help text"
                name="helpText"
                value={helpText}
                onChange={setHelpText}
                autoComplete="off"
              />

              <Checkbox
                label="Required field"
                name="isRequired"
                checked={required}
                onChange={setRequired}
              />

              {supportsValues ? (
                <TextField
                  label="Choices"
                  name="valuesText"
                  value={valuesText}
                  onChange={setValuesText}
                  autoComplete="off"
                  multiline={5}
                  helpText="Enter one choice per line."
                />
              ) : (
                <input
                  type="hidden"
                  name="valuesText"
                  value=""
                />
              )}
            </FormLayout>

            <Button submit variant="primary">
              Add option
            </Button>
          </BlockStack>
        </Form>
      </BlockStack>
    </Card>
  );
}

export default function OptionBuilderPage() {
  const { optionSet, fields } =
    useLoaderData<typeof optionBuilderLoader>();
  const actionData =
    useActionData<typeof optionBuilderAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const saved = searchParams.get("saved") === "1";
  const deleted =
    searchParams.get("deleted") === "1";

  return (
    <OFPage
      title="Option builder"
      subtitle={`Configure customer-facing options for ${optionSet.name}.`}
      backAction={{
        content: optionSet.name,
        url: `/app/option-sets/${optionSet.id}/edit`,
      }}
      secondaryActions={[
        {
          content: "Edit option set",
          url: `/app/option-sets/${optionSet.id}/edit`,
        },
      ]}
    >
      <BlockStack gap="500">
        {saved ? (
          <Banner
            tone="success"
            title="Option saved"
          >
            <p>The option field was saved successfully.</p>
          </Banner>
        ) : null}

        {deleted ? (
          <Banner
            tone="success"
            title="Option deleted"
          >
            <p>The option field was removed.</p>
          </Banner>
        ) : null}

        {actionData &&
        "formError" in actionData &&
        actionData.formError ? (
          <Banner
            tone="critical"
            title="Unable to update builder"
          >
            <p>{actionData.formError}</p>
          </Banner>
        ) : null}

        {navigation.state !== "idle" ? (
          <Banner tone="info">
            <p>Saving changes…</p>
          </Banner>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.6fr) minmax(320px, 0.8fr)",
            gap: 20,
            alignItems: "start",
          }}
        >
          <BlockStack gap="400">
            <InlineStack
              align="space-between"
              blockAlign="center"
            >
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">
                  Options
                </Text>
                <Text as="p" tone="subdued">
                  {fields.length === 1
                    ? "1 option configured"
                    : `${fields.length} options configured`}
                </Text>
              </BlockStack>
            </InlineStack>

            {fields.length === 0 ? (
              <Card>
                <EmptyState
                  heading="Add your first option"
                  image=""
                >
                  <p>
                    Start with a text field, dropdown, radio
                    choice, number field, textarea or checkbox.
                  </p>
                </EmptyState>
              </Card>
            ) : (
              fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  optionSetId={optionSet.id}
                  index={index}
                  count={fields.length}
                />
              ))
            )}

            <AddFieldCard optionSetId={optionSet.id} />
          </BlockStack>

          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Live preview
                </Text>
                <Text as="p" tone="subdued">
                  Preview of the currently saved options.
                </Text>
              </BlockStack>

              <Divider />

              {fields.length === 0 ? (
                <Text as="p" tone="subdued">
                  Add an option to see the preview.
                </Text>
              ) : (
                <BlockStack gap="400">
                  {fields.map((field) => (
                    <FieldPreview
                      key={field.id}
                      field={field}
                    />
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </div>
      </BlockStack>
    </OFPage>
  );
}
