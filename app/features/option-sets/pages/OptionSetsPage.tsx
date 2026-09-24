import { useState } from "react";

import {
  Banner,
  BlockStack,
  Button,
  Card,
  EmptyState,
  IndexTable,
  InlineStack,
  Select,
  Text,
  TextField,
  useIndexResourceState,
} from "@shopify/polaris";

import {
  Form,
  useLoaderData,
  useNavigate,
  useSearchParams,
  useSubmit,
} from "react-router";

import { OFPage } from "~/components/ui";

import { OptionSetStatusBadge } from "../components/table/OptionSetStatusBadge";
import type { loader } from "../loader.server";

type OptionSetFiltersProps = {
  initialSearch: string;
  initialStatus: string;
  initialSort: string;
  pageSize: number;
  onReset: () => void;
};

function OptionSetFilters({
  initialSearch,
  initialStatus,
  initialSort,
  pageSize,
  onReset,
}: OptionSetFiltersProps) {
  const submit = useSubmit();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [sort, setSort] = useState(initialSort);

  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(status) ||
    sort !== "UPDATED_DESC";

  function applyFilters() {
    const formData = new FormData();

    if (search.trim()) {
      formData.set("search", search.trim());
    }

    if (status) {
      formData.set("status", status);
    }

    if (sort) {
      formData.set("sort", sort);
    }

    formData.set("page", "1");
    formData.set("pageSize", String(pageSize));

    submit(formData, {
      method: "get",
    });
  }

  return (
    <Form
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        applyFilters();
      }}
    >
      <InlineStack gap="300" blockAlign="end" wrap>
        <div
          style={{
            flex: "1 1 280px",
            minWidth: 240,
          }}
        >
          <TextField
            label="Search option sets"
            labelHidden
            name="search"
            value={search}
            onChange={setSearch}
            placeholder="Search option sets"
            autoComplete="off"
            clearButton
            onClearButtonClick={() => {
              setSearch("");
            }}
          />
        </div>

        <div style={{ width: 180 }}>
          <Select
            label="Status"
            labelHidden
            name="status"
            value={status}
            options={[
              {
                label: "All statuses",
                value: "",
              },
              {
                label: "Draft",
                value: "DRAFT",
              },
              {
                label: "Published",
                value: "PUBLISHED",
              },
              {
                label: "Archived",
                value: "ARCHIVED",
              },
            ]}
            onChange={setStatus}
          />
        </div>

        <div style={{ width: 190 }}>
          <Select
            label="Sort"
            labelHidden
            name="sort"
            value={sort}
            options={[
              {
                label: "Recently updated",
                value: "UPDATED_DESC",
              },
              {
                label: "Oldest updated",
                value: "UPDATED_ASC",
              },
              {
                label: "Name A–Z",
                value: "NAME_ASC",
              },
              {
                label: "Name Z–A",
                value: "NAME_DESC",
              },
              {
                label: "Newest created",
                value: "CREATED_DESC",
              },
              {
                label: "Oldest created",
                value: "CREATED_ASC",
              },
            ]}
            onChange={setSort}
          />
        </div>

        <Button submit>Apply filters</Button>

        {hasFilters ? (
          <Button onClick={onReset}>Reset</Button>
        ) : null}
      </InlineStack>
    </Form>
  );
}

export default function OptionSetsPage() {
  const {
    optionSets,
    filters,
    pagination,
  } = useLoaderData<typeof loader>();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const wasCreated = Boolean(
    searchParams.get("created"),
  );

  const wasUpdated = Boolean(
    searchParams.get("updated"),
  );

  const wasArchived = Boolean(
    searchParams.get("archived"),
  );

  const wasRestored = Boolean(
    searchParams.get("restored"),
  );

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    filters.sort !== "UPDATED_DESC";

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState(optionSets);

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();

    if (filters.search) {
      params.set("search", filters.search);
    }

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.sort !== "UPDATED_DESC") {
      params.set("sort", filters.sort);
    }

    params.set("page", String(page));
    params.set(
      "pageSize",
      String(pagination.pageSize),
    );

    return `?${params.toString()}`;
  }

  const rows = optionSets.map(
    (optionSet, index) => (
      <IndexTable.Row
        id={optionSet.id}
        key={optionSet.id}
        position={index}
        selected={selectedResources.includes(
          optionSet.id,
        )}
        onClick={() => {
          navigate(
  `/app/option-sets/${optionSet.id}/edit`,
);
        }}
      >
        <IndexTable.Cell>
          <BlockStack gap="100">
            <Text
              as="span"
              variant="bodyMd"
              fontWeight="semibold"
            >
              {optionSet.name}
            </Text>

            {optionSet.description ? (
              <Text as="span" tone="subdued">
                {optionSet.description}
              </Text>
            ) : null}
          </BlockStack>
        </IndexTable.Cell>

        <IndexTable.Cell>
          <OptionSetStatusBadge
            status={optionSet.status}
          />
        </IndexTable.Cell>

        <IndexTable.Cell>
          {optionSet.assignedProducts}
        </IndexTable.Cell>

        <IndexTable.Cell>
          {new Intl.DateTimeFormat("en-IN", {
            dateStyle: "medium",
          }).format(
            new Date(optionSet.updatedAt),
          )}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <OFPage
      title="Option sets"
      subtitle="Create and manage reusable product option configurations."
      primaryAction={{
        content: "Create option set",
        url: "/app/option-sets/new",
      }}
    >
      <BlockStack gap="500">
        {wasUpdated ? (
          <Banner
            tone="success"
            title="Option set updated"
          >
            <p>Your changes were saved successfully.</p>
          </Banner>
        ) : null}

        {wasArchived ? (
          <Banner
            tone="success"
            title="Option set archived"
          >
            <p>
              The option set has been archived and is no longer published.
            </p>
          </Banner>
        ) : null}

        {wasRestored ? (
          <Banner
            tone="success"
            title="Option set restored"
          >
            <p>
              The option set was restored as a draft.
            </p>
          </Banner>
        ) : null}

        {wasCreated ? (
          <Banner
            tone="success"
            title="Option set created"
          >
            <p>
              Your new option set was saved
              successfully.
            </p>
          </Banner>
        ) : null}

        <Card padding="0">
          <BlockStack gap="0">
            <div
              style={{
                padding: "16px",
                borderBottom:
                  "1px solid var(--p-color-border-secondary)",
              }}
            >
              <OptionSetFilters
                key={[
                  filters.search,
                  filters.status,
                  filters.sort,
                  pagination.pageSize,
                ].join(":")}
                initialSearch={filters.search}
                initialStatus={filters.status}
                initialSort={filters.sort}
                pageSize={pagination.pageSize}
                onReset={() => {
                  navigate("/app/option-sets");
                }}
              />
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderBottom:
                  "1px solid var(--p-color-border-secondary)",
              }}
            >
              <Text as="p" tone="subdued">
                {pagination.totalItems === 1
                  ? "1 option set"
                  : `${pagination.totalItems} option sets`}
              </Text>
            </div>

            {optionSets.length === 0 ? (
              <EmptyState
                heading={
                  hasFilters
                    ? "No option sets found"
                    : "Create your first option set"
                }
                action={
                  hasFilters
                    ? {
                        content: "Reset filters",
                        onAction: () => {
                          navigate(
                            "/app/option-sets",
                          );
                        },
                      }
                    : {
                        content:
                          "Create option set",
                        url: "/app/option-sets/new",
                      }
                }
                image=""
              >
                <p>
                  {hasFilters
                    ? "Try changing or resetting your search and filter criteria."
                    : "Add text fields, swatches, checkboxes, uploads, pricing, and conditional logic to your products."}
                </p>
              </EmptyState>
            ) : (
              <IndexTable
                resourceName={{
                  singular: "option set",
                  plural: "option sets",
                }}
                itemCount={optionSets.length}
                selectedItemsCount={
                  allResourcesSelected
                    ? "All"
                    : selectedResources.length
                }
                onSelectionChange={
                  handleSelectionChange
                }
                headings={[
                  {
                    title: "Option set",
                  },
                  {
                    title: "Status",
                  },
                  {
                    title: "Products",
                  },
                  {
                    title: "Updated",
                  },
                ]}
                pagination={{
                  hasPrevious:
                    pagination.page > 1,
                  hasNext:
                    pagination.page <
                    pagination.totalPages,

                  onPrevious: () => {
                    navigate(
                      buildPageUrl(
                        pagination.page - 1,
                      ),
                    );
                  },

                  onNext: () => {
                    navigate(
                      buildPageUrl(
                        pagination.page + 1,
                      ),
                    );
                  },
                }}
              >
                {rows}
              </IndexTable>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </OFPage>
  );
}