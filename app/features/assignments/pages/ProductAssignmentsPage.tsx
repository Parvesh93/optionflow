import {
  Banner,
  BlockStack,
  Button,
  Card,
  EmptyState,
  InlineStack,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";

import {
  Form,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "react-router";

import { OFPage } from "~/components/ui";

import type { productAssignmentsAction } from "../action.server";
import type { productAssignmentsLoader } from "../loader.server";

export default function ProductAssignmentsPage() {
  const {
    optionSet,
    search,
    assignments,
    products,
    pageInfo,
  } = useLoaderData<typeof productAssignmentsLoader>();

  const actionData =
    useActionData<typeof productAssignmentsAction>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const assigned =
    searchParams.get("assigned") === "1";
  const unassigned =
    searchParams.get("unassigned") === "1";

  const busy = navigation.state !== "idle";

  function buildProductPageUrl(
    direction: "next" | "previous",
  ) {
    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (
      direction === "next" &&
      pageInfo.endCursor
    ) {
      params.set("after", pageInfo.endCursor);
    }

    if (
      direction === "previous" &&
      pageInfo.startCursor
    ) {
      params.set("before", pageInfo.startCursor);
    }

    const query = params.toString();

    return `/app/option-sets/${optionSet.id}/assignments${query ? `?${query}` : ""}`;
  }

  return (
    <OFPage
      title="Assign products"
      subtitle={`Choose which products should use ${optionSet.name}.`}
      backAction={{
        content: optionSet.name,
        onAction: () =>
          navigate(
            `/app/option-sets/${optionSet.id}/edit`,
          ),
      }}
      secondaryActions={[
        {
          content: "Build options",
          onAction: () =>
            navigate(
              `/app/option-sets/${optionSet.id}/builder`,
            ),
        },
      ]}
    >
      <BlockStack gap="500">
        {assigned ? (
          <Banner
            tone="success"
            title="Product assigned"
          >
            <p>
              This product will automatically use this
              option set on the storefront.
            </p>
          </Banner>
        ) : null}

        {unassigned ? (
          <Banner
            tone="success"
            title="Product unassigned"
          >
            <p>
              The option set will no longer load for that
              product.
            </p>
          </Banner>
        ) : null}

        {actionData &&
        "formError" in actionData &&
        actionData.formError ? (
          <Banner
            tone="critical"
            title="Unable to update assignment"
          >
            <p>{actionData.formError}</p>
          </Banner>
        ) : null}

        {optionSet.status !== "PUBLISHED" ? (
          <Banner
            tone="warning"
            title="Option set is not published"
          >
            <p>
              Product assignments can be prepared now, but
              the storefront will only render this option
              set after it is published.
            </p>
          </Banner>
        ) : null}

        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Assigned products
              </Text>
              <Text as="p" tone="subdued">
                {assignments.length === 1
                  ? "1 product assigned"
                  : `${assignments.length} products assigned`}
              </Text>
            </BlockStack>

            {assignments.length === 0 ? (
              <Text as="p" tone="subdued">
                No products are assigned yet.
              </Text>
            ) : (
              <BlockStack gap="300">
                {assignments.map((assignment) => (
                  <InlineStack
                    key={assignment.id}
                    align="space-between"
                    blockAlign="center"
                    gap="300"
                  >
                    <InlineStack
                      gap="300"
                      blockAlign="center"
                    >
                      <Thumbnail
                        source={
                          assignment.productImageUrl ||
                          "https://cdn.shopify.com/static/images/blank.svg"
                        }
                        alt=""
                        size="small"
                      />

                      <BlockStack gap="050">
                        <Text
                          as="p"
                          fontWeight="semibold"
                        >
                          {assignment.productTitle}
                        </Text>
                        <Text as="p" tone="subdued">
                          /products/{assignment.productHandle}
                        </Text>
                      </BlockStack>
                    </InlineStack>

                    <Form method="post">
                      <input
                        type="hidden"
                        name="intent"
                        value="unassign"
                      />
                      <input
                        type="hidden"
                        name="productGid"
                        value={assignment.productGid}
                      />
                      <Button
                        submit
                        tone="critical"
                        disabled={busy}
                      >
                        Unassign
                      </Button>
                    </Form>
                  </InlineStack>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">
                Find products
              </Text>
              <Text as="p" tone="subdued">
                Search your Shopify catalog and assign
                products to this option set.
              </Text>
            </BlockStack>

            <Form method="get">
              <InlineStack
                gap="300"
                blockAlign="end"
              >
                <div style={{ flex: 1 }}>
                  <TextField
                    label="Search products"
                    name="search"
                    defaultValue={search}
                    autoComplete="off"
                    placeholder="Search by product title"
                  />
                </div>
                <Button submit>Search</Button>
                {search ? (
                  <Button
                    onClick={() =>
                      navigate(
                        `/app/option-sets/${optionSet.id}/assignments`,
                      )
                    }
                  >
                    Clear
                  </Button>
                ) : null}
              </InlineStack>
            </Form>

            {products.length === 0 ? (
              <EmptyState
                heading="No products found"
                image=""
              >
                <p>
                  Try another search term.
                </p>
              </EmptyState>
            ) : (
              <BlockStack gap="300">
                {products.map((product) => (
                  <InlineStack
                    key={product.id}
                    align="space-between"
                    blockAlign="center"
                    gap="300"
                  >
                    <InlineStack
                      gap="300"
                      blockAlign="center"
                    >
                      <Thumbnail
                        source={
                          product.imageUrl ||
                          "https://cdn.shopify.com/static/images/blank.svg"
                        }
                        alt=""
                        size="small"
                      />

                      <BlockStack gap="050">
                        <Text
                          as="p"
                          fontWeight="semibold"
                        >
                          {product.title}
                        </Text>
                        <Text as="p" tone="subdued">
                          {product.status} · /products/
                          {product.handle}
                        </Text>
                      </BlockStack>
                    </InlineStack>

                    {product.assignedToThisSet ? (
                      <Button disabled>
                        Assigned
                      </Button>
                    ) : (
                      <Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="assign"
                        />
                        <input
                          type="hidden"
                          name="productGid"
                          value={product.id}
                        />
                        <input
                          type="hidden"
                          name="productTitle"
                          value={product.title}
                        />
                        <input
                          type="hidden"
                          name="productHandle"
                          value={product.handle}
                        />
                        <input
                          type="hidden"
                          name="productImageUrl"
                          value={product.imageUrl || ""}
                        />

                        <Button
                          submit
                          variant="primary"
                          disabled={busy}
                        >
                          Assign
                        </Button>
                      </Form>
                    )}
                  </InlineStack>
                ))}
              </BlockStack>
            )}

            {(pageInfo.hasPreviousPage ||
              pageInfo.hasNextPage) ? (
              <InlineStack
                align="center"
                gap="300"
              >
                <Button
                  disabled={
                    busy ||
                    !pageInfo.hasPreviousPage
                  }
                  onClick={() =>
                    navigate(
                      buildProductPageUrl(
                        "previous",
                      ),
                    )
                  }
                >
                  Previous
                </Button>

                <Text as="p" tone="subdued">
                  Showing up to 50 products
                </Text>

                <Button
                  disabled={
                    busy ||
                    !pageInfo.hasNextPage
                  }
                  onClick={() =>
                    navigate(
                      buildProductPageUrl("next"),
                    )
                  }
                >
                  Next
                </Button>
              </InlineStack>
            ) : null}
          </BlockStack>
        </Card>
      </BlockStack>
    </OFPage>
  );
}
