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
  useNavigation,
} from "react-router";
import { useState } from "react";

import { OFPage } from "~/components/ui";

import type {
  CreateOptionSetActionData,
} from "../action.server";

function getFirstError(
  errors:
    | Record<string, string[]>
    | undefined,
  field: string,
) {
  return errors?.[field]?.[0];
}

export default function CreateOptionSetPage() {
  const actionData =
    useActionData<CreateOptionSetActionData>();

  const navigation = useNavigation();

  const isSubmitting =
    navigation.state === "submitting";

  const [name, setName] = useState(
    actionData?.values.name ?? "",
  );

  const [description, setDescription] =
    useState(
      actionData?.values.description ?? "",
    );

  const [internalNote, setInternalNote] =
    useState(
      actionData?.values.internalNote ?? "",
    );

  const [status, setStatus] = useState(
    actionData?.values.status ?? "DRAFT",
  );

  return (
    <OFPage
      title="Create option set"
      subtitle="Create a reusable option set that can be assigned to your products."
      backAction={{
        content: "Option sets",
        url: "/app/option-sets",
      }}
    >
      <BlockStack gap="500">
        {actionData?.formError ? (
          <Banner
            tone="critical"
            title="Unable to create option set"
          >
            <p>{actionData.formError}</p>
          </Banner>
        ) : null}

        <Form method="post">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text
                    as="h2"
                    variant="headingMd"
                  >
                    Set details
                  </Text>

                  <Text
                    as="p"
                    tone="subdued"
                  >
                    Add basic information for
                    your option set.
                  </Text>
                </BlockStack>

                <FormLayout>
                  <TextField
                    label="Option set name"
                    name="name"
                    value={name}
                    onChange={setName}
                    autoComplete="off"
                    placeholder="For example, Engraving Options"
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
                    placeholder="Describe what this option set is used for"
                    maxLength={500}
                    showCharacterCount
                    error={getFirstError(
                      actionData?.fieldErrors,
                      "description",
                    )}
                    helpText="This description is visible only to store administrators."
                  />

                  <Select
                    label="Initial status"
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
                        ? "The option set will be marked as published, but it will not appear on the storefront until it has options and product assignments."
                        : "Save the option set as a draft while you continue configuring it."
                    }
                  />

                  <TextField
                    label="Internal note"
                    name="internalNote"
                    value={internalNote}
                    onChange={setInternalNote}
                    autoComplete="off"
                    multiline={3}
                    placeholder="Add notes for your team"
                    maxLength={1000}
                    showCharacterCount
                    error={getFirstError(
                      actionData?.fieldErrors,
                      "internalNote",
                    )}
                    helpText="Only visible to store administrators."
                  />
                </FormLayout>
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
                Save option set
              </Button>
            </InlineStack>
          </BlockStack>
        </Form>
      </BlockStack>
    </OFPage>
  );
}