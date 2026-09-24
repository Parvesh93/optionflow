import { useState } from "react";

import {
  Banner,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Collapsible,
  Divider,
  EmptyState,
  FormLayout,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "react-router";

import { OFPage } from "~/components/ui";

import type { optionBuilderAction } from "../action.server";
import type { optionBuilderLoader } from "../loader.server";
import type {
  BuilderFieldDTO,
  BuilderFieldType,
  PriceAdjustmentType,
} from "../types";

const typeOptions = [
  { label: "Text", value: "TEXT" },
  { label: "Textarea", value: "TEXTAREA" },
  { label: "Number", value: "NUMBER" },
  { label: "Dropdown", value: "SELECT" },
  { label: "Radio buttons", value: "RADIO" },
  { label: "Checkbox", value: "CHECKBOX" },
];

const priceAdjustmentOptions = [
  { label: "No price adjustment", value: "NONE" },
  { label: "Fixed amount", value: "FIXED" },
  { label: "Percentage", value: "PERCENTAGE" },
];

function getTypeLabel(type: BuilderFieldType) {
  return (
    typeOptions.find((option) => option.value === type)
      ?.label ?? type
  );
}

function valuesToText(field: BuilderFieldDTO) {
  return field.values
    .map((value) => {
      if (value.priceAdjustmentType === "NONE") {
        return value.label;
      }

      return [
        value.label,
        value.priceAdjustmentType,
        value.priceAdjustmentValue,
      ].join("|");
    })
    .join("\n");
}

function formatAdjustment(
  type: PriceAdjustmentType,
  value: string,
) {
  if (type === "NONE" || !value) {
    return "";
  }

  if (type === "PERCENTAGE") {
    return `${Number(value) >= 0 ? "+" : ""}${value}%`;
  }

  return `${Number(value) >= 0 ? "+" : ""}${value}`;
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
            label: `${value.label}${
              formatAdjustment(
                value.priceAdjustmentType,
                value.priceAdjustmentValue,
              )
                ? ` (${formatAdjustment(
                    value.priceAdjustmentType,
                    value.priceAdjustmentValue,
                  )})`
                : ""
            }`,
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
              label={`${value.label}${
                formatAdjustment(
                  value.priceAdjustmentType,
                  value.priceAdjustmentValue,
                )
                  ? ` (${formatAdjustment(
                      value.priceAdjustmentType,
                      value.priceAdjustmentValue,
                    )})`
                  : ""
              }`}
              checked={false}
              disabled
              onChange={() => undefined}
            />
          ))
        ) : (
          <Text as="p" tone="subdued">
            Add choices to preview this field.
          </Text>
        )}
      </BlockStack>
    );
  }

  if (field.type === "CHECKBOX") {
    return (
      <Checkbox
        label={`${field.label}${
          formatAdjustment(
            field.priceAdjustmentType,
            field.priceAdjustmentValue,
          )
            ? ` (${formatAdjustment(
                field.priceAdjustmentType,
                field.priceAdjustmentValue,
              )})`
            : ""
        }`}
        checked={false}
        disabled
        onChange={() => undefined}
        helpText={field.helpText || undefined}
      />
    );
  }

  return (
    <TextField
      label={`${field.label}${
        formatAdjustment(
          field.priceAdjustmentType,
          field.priceAdjustmentValue,
        )
          ? ` (${formatAdjustment(
              field.priceAdjustmentType,
              field.priceAdjustmentValue,
            )})`
          : ""
      }`}
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

function SortableFieldEditor({
  field,
  optionSetId,
}: {
  field: BuilderFieldDTO;
  optionSetId: string;
}) {
  const fetcher = useFetcher();
  const [open, setOpen] = useState(false);
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
  const [priceAdjustmentType, setPriceAdjustmentType] =
    useState<PriceAdjustmentType>(
      field.priceAdjustmentType,
    );
  const [priceAdjustmentValue, setPriceAdjustmentValue] =
    useState(field.priceAdjustmentValue);
  const [valuesText, setValuesText] = useState(
    valuesToText(field),
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
  });

  const busy = fetcher.state !== "idle";
  const supportsValues =
    type === "SELECT" || type === "RADIO";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  function deleteField() {
    const formData = new FormData();
    formData.set("intent", "deleteField");
    formData.set("fieldId", field.id);

    fetcher.submit(formData, {
      method: "post",
      action: `/app/option-sets/${optionSetId}/builder`,
    });
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <BlockStack gap="300">
          <InlineStack
            align="space-between"
            blockAlign="center"
            gap="300"
            wrap
          >
            <InlineStack
              gap="300"
              blockAlign="center"
              wrap={false}
            >
              <button
                type="button"
                aria-label={`Reorder ${field.label}`}
                {...attributes}
                {...listeners}
                style={{
                  width: 34,
                  height: 34,
                  border:
                    "1px solid var(--p-color-border-secondary)",
                  borderRadius: 8,
                  background:
                    "var(--p-color-bg-surface-secondary)",
                  cursor: isDragging ? "grabbing" : "grab",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ⋮⋮
              </button>

              <BlockStack gap="050">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h3" variant="headingMd">
                    {field.label}
                  </Text>
                  {field.isRequired ? (
                    <Text as="span" tone="subdued">
                      Required
                    </Text>
                  ) : null}
                </InlineStack>

                <Text as="p" tone="subdued">
                  {getTypeLabel(field.type)}
                </Text>
              </BlockStack>
            </InlineStack>

            <InlineStack gap="200">
              <Button
                onClick={() => setOpen((value) => !value)}
                disclosure={open ? "up" : "down"}
              >
                {open ? "Close" : "Edit"}
              </Button>

              <Button
                tone="critical"
                disabled={busy}
                onClick={deleteField}
              >
                Delete
              </Button>
            </InlineStack>
          </InlineStack>

          <Collapsible
            open={open}
            id={`option-field-${field.id}`}
            transition={{
              duration: "200ms",
              timingFunction: "ease-in-out",
            }}
          >
            <BlockStack gap="400">
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
                        setType(
                          value as BuilderFieldType,
                        )
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

                    {!supportsValues ? (
                      <>
                        <Select
                          label="Price adjustment"
                          name="priceAdjustmentType"
                          value={priceAdjustmentType}
                          options={priceAdjustmentOptions}
                          onChange={(value) =>
                            setPriceAdjustmentType(
                              value as PriceAdjustmentType,
                            )
                          }
                        />

                        {priceAdjustmentType !== "NONE" ? (
                          <TextField
                            label={
                              priceAdjustmentType === "PERCENTAGE"
                                ? "Percentage adjustment"
                                : "Fixed price adjustment"
                            }
                            name="priceAdjustmentValue"
                            value={priceAdjustmentValue}
                            onChange={setPriceAdjustmentValue}
                            autoComplete="off"
                            type="number"
                            helpText="Use a negative value for a discount."
                          />
                        ) : (
                          <input
                            type="hidden"
                            name="priceAdjustmentValue"
                            value=""
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <input
                          type="hidden"
                          name="priceAdjustmentType"
                          value="NONE"
                        />
                        <input
                          type="hidden"
                          name="priceAdjustmentValue"
                          value=""
                        />
                      </>
                    )}

                    {supportsValues ? (
                      <TextField
                        label="Choices"
                        name="valuesText"
                        value={valuesText}
                        onChange={setValuesText}
                        autoComplete="off"
                        multiline={5}
                        helpText="One choice per line. Optional pricing format: Label|FIXED|10 or Label|PERCENTAGE|5. Use negative values for discounts."
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
                    <Button
                      submit
                      variant="primary"
                      loading={busy}
                    >
                      Save field
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>
            </BlockStack>
          </Collapsible>
        </BlockStack>
      </Card>
    </div>
  );
}

function SortableFieldList({
  initialFields,
  optionSetId,
}: {
  initialFields: BuilderFieldDTO[];
  optionSetId: string;
}) {
  const fetcher = useFetcher();
  const [orderedFields, setOrderedFields] =
    useState(initialFields);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = orderedFields.findIndex(
      (field) => field.id === active.id,
    );
    const newIndex = orderedFields.findIndex(
      (field) => field.id === over.id,
    );

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const nextFields = arrayMove(
      orderedFields,
      oldIndex,
      newIndex,
    );

    setOrderedFields(nextFields);

    const formData = new FormData();
    formData.set("intent", "reorderFields");

    for (const field of nextFields) {
      formData.append("fieldIds", field.id);
    }

    fetcher.submit(formData, {
      method: "post",
      action: `/app/option-sets/${optionSetId}/builder`,
    });
  }

  return (
    <BlockStack gap="300">
      {fetcher.state !== "idle" ? (
        <Text as="p" tone="subdued">
          Saving order…
        </Text>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedFields.map((field) => field.id)}
          strategy={verticalListSortingStrategy}
        >
          <BlockStack gap="300">
            {orderedFields.map((field) => (
              <SortableFieldEditor
                key={field.id}
                field={field}
                optionSetId={optionSetId}
              />
            ))}
          </BlockStack>
        </SortableContext>
      </DndContext>
    </BlockStack>
  );
}

function AddFieldCard({
  optionSetId,
}: {
  optionSetId: string;
}) {
  const [open, setOpen] = useState(true);
  const [type, setType] =
    useState<BuilderFieldType>("TEXT");
  const [label, setLabel] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [helpText, setHelpText] = useState("");
  const [required, setRequired] = useState(false);
  const [priceAdjustmentType, setPriceAdjustmentType] =
    useState<PriceAdjustmentType>("NONE");
  const [priceAdjustmentValue, setPriceAdjustmentValue] =
    useState("");
  const [valuesText, setValuesText] = useState("");

  const supportsValues =
    type === "SELECT" || type === "RADIO";

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack
          align="space-between"
          blockAlign="center"
        >
          <BlockStack gap="050">
            <Text as="h2" variant="headingMd">
              Add option
            </Text>
            <Text as="p" tone="subdued">
              Add another customer-facing field.
            </Text>
          </BlockStack>

          <Button
            onClick={() => setOpen((value) => !value)}
            disclosure={open ? "up" : "down"}
          >
            {open ? "Hide" : "Add option"}
          </Button>
        </InlineStack>

        <Collapsible
          open={open}
          id="add-option-field"
          transition={{
            duration: "200ms",
            timingFunction: "ease-in-out",
          }}
        >
          <BlockStack gap="400">
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

              <BlockStack gap="400">
                <FormLayout>
                  <Select
                    label="Option type"
                    name="type"
                    value={type}
                    options={typeOptions}
                    onChange={(value) =>
                      setType(
                        value as BuilderFieldType,
                      )
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

                  {!supportsValues ? (
                    <>
                      <Select
                        label="Price adjustment"
                        name="priceAdjustmentType"
                        value={priceAdjustmentType}
                        options={priceAdjustmentOptions}
                        onChange={(value) =>
                          setPriceAdjustmentType(
                            value as PriceAdjustmentType,
                          )
                        }
                      />

                      {priceAdjustmentType !== "NONE" ? (
                        <TextField
                          label={
                            priceAdjustmentType === "PERCENTAGE"
                              ? "Percentage adjustment"
                              : "Fixed price adjustment"
                          }
                          name="priceAdjustmentValue"
                          value={priceAdjustmentValue}
                          onChange={setPriceAdjustmentValue}
                          autoComplete="off"
                          type="number"
                          helpText="Use a negative value for a discount."
                        />
                      ) : (
                        <input
                          type="hidden"
                          name="priceAdjustmentValue"
                          value=""
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="hidden"
                        name="priceAdjustmentType"
                        value="NONE"
                      />
                      <input
                        type="hidden"
                        name="priceAdjustmentValue"
                        value=""
                      />
                    </>
                  )}

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
                    Add option
                  </Button>
                </InlineStack>
              </BlockStack>
            </Form>
          </BlockStack>
        </Collapsible>
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const saved = searchParams.get("saved") === "1";
  const deleted =
    searchParams.get("deleted") === "1";

  const listKey = fields
    .map((field) => `${field.id}:${field.position}`)
    .join("|");

  return (
    <OFPage
      title="Option builder"
      subtitle={`Configure customer-facing options for ${optionSet.name}.`}
      backAction={{
        content: optionSet.name,
        onAction: () =>
          navigate(
            `/app/option-sets/${optionSet.id}/edit`,
          ),
      }}
      secondaryActions={[
        {
          content: "Edit option set",
          onAction: () =>
            navigate(
              `/app/option-sets/${optionSet.id}/edit`,
            ),
        },
      ]}
    >
      <BlockStack gap="500">
        {saved ? (
          <Banner tone="success" title="Option saved">
            <p>
              The option field was saved successfully.
            </p>
          </Banner>
        ) : null}

        {deleted ? (
          <Banner tone="success" title="Option deleted">
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
            <BlockStack gap="100">
              <Text as="h2" variant="headingLg">
                Options
              </Text>
              <Text as="p" tone="subdued">
                {fields.length === 1
                  ? "1 option configured"
                  : `${fields.length} options configured`}
                {fields.length > 1
                  ? " · Drag the handle to reorder."
                  : ""}
              </Text>
            </BlockStack>

            {fields.length === 0 ? (
              <Card>
                <EmptyState
                  heading="Add your first option"
                  image=""
                >
                  <p>
                    Start with a text field, dropdown,
                    radio choice, number field, textarea or
                    checkbox.
                  </p>
                </EmptyState>
              </Card>
            ) : (
              <SortableFieldList
                key={listKey}
                initialFields={fields}
                optionSetId={optionSet.id}
              />
            )}

            <AddFieldCard optionSetId={optionSet.id} />
          </BlockStack>

          <div
            style={{
              position: "sticky",
              top: 20,
            }}
          >
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
        </div>
      </BlockStack>
    </OFPage>
  );
}
