import { useEffect, useState } from "react";

import {
  Banner,
  BlockStack,
  Button,
  Card,
  Modal,
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
  useNavigate,
  useNavigation,
  useSearchParams,
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
  const navigate = useNavigate();
  const duplicateFetcher = useFetcher();
  const archiveFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const [searchParams] = useSearchParams();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const wasDuplicated =
    searchParams.get("duplicated") === "1";

  const isSubmitting =
    navigation.state === "submitting";

  const isDuplicating =
    duplicateFetcher.state !== "idle";

  const isChangingArchiveState =
    archiveFetcher.state !== "idle";

  const isDeleting =
    deleteFetcher.state !== "idle";

  useEffect(() => {
    const result = duplicateFetcher.data as
      | {
          success?: boolean;
          duplicatedId?: string;
          formError?: string;
        }
      | undefined;

    if (
      duplicateFetcher.state === "idle" &&
      result?.success &&
      result.duplicatedId
    ) {
      navigate(
        `/app/option-sets/${result.duplicatedId}/edit?duplicated=1`,
      );
    }
  }, [duplicateFetcher.state, duplicateFetcher.data, navigate]);

  const duplicateError =
    duplicateFetcher.state === "idle" &&
    duplicateFetcher.data &&
    typeof duplicateFetcher.data === "object" &&
    "formError" in duplicateFetcher.data
      ? String(duplicateFetcher.data.formError || "")
      : "";

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
        onAction: () => navigate("/app/option-sets"),
      }}
      secondaryActions={[
        {
          content: "Build options",
          onAction: () =>
            navigate(
              `/app/option-sets/${optionSet.id}/builder`,
            ),
        },
        {
          content: "Assign products",
          onAction: () =>
            navigate(
              `/app/option-sets/${optionSet.id}/assignments`,
            ),
        },
      ]}
    >
      <BlockStack gap="500">
        {wasDuplicated ? (
          <Banner
            tone="success"
            title="Option set duplicated"
          >
            <p>
              A draft copy was created. Review it and save any changes.
            </p>
          </Banner>
        ) : null}

        {duplicateError ? (
          <Banner
            tone="critical"
            title="Unable to duplicate option set"
          >
            <p>{duplicateError}</p>
          </Banner>
        ) : null}

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
              align="space-between"
              gap="300"
              wrap
            >
              <InlineStack gap="300" wrap>
                <Button
                  onClick={() => {
                    duplicateFetcher.submit(
                      new FormData(),
                      {
                        method: "post",
                        action: `/app/option-sets/${optionSet.id}/duplicate`,
                      },
                    );
                  }}
                  loading={isDuplicating}
                  disabled={
                    isSubmitting ||
                    isDuplicating ||
                    isChangingArchiveState ||
                    isDeleting
                  }
                >
                  Duplicate
                </Button>

                <Button
                  tone={
                    optionSet.status === "ARCHIVED"
                      ? undefined
                      : "critical"
                  }
                  onClick={() => {
                    const mode =
                      optionSet.status === "ARCHIVED"
                        ? "restore"
                        : "archive";

                    archiveFetcher.submit(
                      {},
                      {
                        method: "post",
                        action: `/app/option-sets/${optionSet.id}/${mode}`,
                      },
                    );
                  }}
                  loading={isChangingArchiveState}
                  disabled={
                    isSubmitting ||
                    isChangingArchiveState ||
                    isDeleting
                  }
                >
                  {optionSet.status === "ARCHIVED"
                    ? "Restore"
                    : "Archive"}
                </Button>

                <Button
                  tone="critical"
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={
                    isSubmitting ||
                    isChangingArchiveState ||
                    isDeleting
                  }
                >
                  Delete
                </Button>
              </InlineStack>

              <InlineStack gap="300">
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
            </InlineStack>
          </BlockStack>
        </Form>

        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="Delete option set?"
          primaryAction={{
            content: "Delete option set",
            destructive: true,
            loading: isDeleting,
            onAction: () => {
              deleteFetcher.submit(
                {},
                {
                  method: "post",
                  action: `/app/option-sets/${optionSet.id}/delete`,
                },
              );
            },
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => setDeleteModalOpen(false),
              disabled: isDeleting,
            },
          ]}
        >
          <Modal.Section>
            <Text as="p">
              This option set will be removed from your active records. This action cannot be undone from the app.
            </Text>
          </Modal.Section>
        </Modal>
      </BlockStack>
    </OFPage>
  );
}