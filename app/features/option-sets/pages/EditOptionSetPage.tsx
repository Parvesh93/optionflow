import { useState } from "react";

import {
  Banner,
  BlockStack,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";

import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";

import { OFPage } from "~/components/ui";

import type { UpdateOptionSetActionData } from "../action.server";
import type { editOptionSetLoader } from "../loader.server";

function getFirstError(
  errors:
    | Record<string, string[]>
    | undefined,
  field: string,
) {
  return errors?.[field]?.[0];
}

export default function EditOptionSetPage() {
  const { optionSet } =
    useLoaderData<
      typeof editOptionSetLoader
    >();

  const actionData =
    useActionData<
      UpdateOptionSetActionData
    >();

  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting";

  const [name, setName] = useState(
    actionData?.values.name ??
      optionSet.name,
  );

  const [description, setDescription] =
    useState(
      actionData?.values.description ??
        optionSet.description,
    );

  const [internalNote, setInternalNote] =
    useState(
      actionData?.values.internalNote ??
        optionSet.internalNote,
    );

  const [status, setStatus] = useState(
    actionData?.values.status ??
      optionSet.status,
  );

  return (
    <OFPage
      title={optionSet.name}
      subtitle="Update the basic details and status of this option set."
      backAction={{
        content: "Option sets",
        url: "/app/option-sets",
      }}
    >
      <BlockStack gap="500">
        {actionData?.formError ? (
          <Banner
            tone="critical"
            title="Unable to update option set"
          >
            <p>{actionData.formError}</p>
          </Banner>
        ) : null}

        <Form method="post">
          <input
            type="hidden"
            name="revision"
            value={optionSet.revision}
          />

          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text
                    as="h2"
                    variant="headingMd"
                  >
                    Option set details
                  </Text>

                  <Text
                    as="p"
                    tone="subdued"
                  >
                    Update the internal details
                    for this option set.
                  </Text>
                </BlockStack>

                <FormLayout>
                  <TextField
                    label="Option set name"
                    name="name"
                    value={name}
                    onChange={setName}
                    autoComplete="off"
                    requiredIndicator
                    maxLength={100}
                    showCharacterCount
                    error={getFirstError(
                      actionData?.fieldErrors,
                      "name",
                    )}
                  />

                  <TextField
                    label="Description"
                    name="description"
                    value={description}
                    onChange={setDescription}
                    autoComplete="off"
                    multiline={4}
                    maxLength={500}
                    showCharacterCount
                    helpText="Visible only to store administrators."
                    error={getFirstError(
                      actionData?.fieldErrors,
                      "description",
                    )}
                  />

                  <Select
                    label="Status"
                    name="status"
                    value={status}
                    onChange={setStatus}
                    options={[
                      {
                        label: "Draft",
                        value: "DRAFT",
                      },
                      {
                        label: "Published",
                        value: "PUBLISHED",
                      },
                    ]}
                    helpText={
                      status === "PUBLISHED"
                        ? "Published option sets can later be served to assigned products."
                        : "Draft option sets are not shown on the storefront."
                    }
                  />

                  <TextField
                    label="Internal note"
                    name="internalNote"
                    value={internalNote}
                    onChange={setInternalNote}
                    autoComplete="off"
                    multiline={3}
                    maxLength={1000}
                    showCharacterCount
                    helpText="Only visible to store administrators."
                    error={getFirstError(
                      actionData?.fieldErrors,
                      "internalNote",
                    )}
                  />
                </FormLayout>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text
                  as="h2"
                  variant="headingMd"
                >
                  Record information
                </Text>

                <Text as="p" tone="subdued">
                  Handle: {optionSet.handle}
                </Text>

                <Text as="p" tone="subdued">
                  Last updated:{" "}
                  {new Intl.DateTimeFormat(
                    "en-IN",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  ).format(
                    new Date(
                      optionSet.updatedAt,
                    ),
                  )}
                </Text>
              </BlockStack>
            </Card>

            <InlineStack
              align="end"
              gap="300"
            >
              <Button
                url="/app/option-sets"
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <Button
                submit
                variant="primary"
                loading={isSubmitting}
              >
                Save changes
              </Button>
            </InlineStack>
          </BlockStack>
        </Form>
      </BlockStack>
    </OFPage>
  );
}