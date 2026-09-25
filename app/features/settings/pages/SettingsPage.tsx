import {
  Banner,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Text,
} from "@shopify/polaris";

import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";

import { OFPage } from "~/components/ui";

import type { settingsAction } from "../action.server";
import type { settingsLoader } from "../loader.server";

export default function SettingsPage() {
  const { pricing } =
    useLoaderData<typeof settingsLoader>();
  const actionData =
    useActionData<typeof settingsAction>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();

  const justEnabled =
    searchParams.get("pricingEnabled") === "1";
  const busy = navigation.state !== "idle";

  return (
    <OFPage
      title="Settings"
      subtitle="Manage OptionFlow storefront and pricing features."
    >
      <BlockStack gap="500">
        {justEnabled ? (
          <Banner
            tone="success"
            title="Pricing engine enabled"
          >
            <p>
              OptionFlow can now enforce configured option
              prices in Shopify cart and checkout.
            </p>
          </Banner>
        ) : null}

        {actionData &&
        "formError" in actionData &&
        actionData.formError ? (
          <Banner
            tone="critical"
            title="Unable to enable pricing"
          >
            <p>{actionData.formError}</p>
          </Banner>
        ) : null}

        <Card>
          <BlockStack gap="400">
            <InlineStack
              align="space-between"
              blockAlign="center"
              gap="300"
            >
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Real price adjustments
                </Text>
                <Text as="p" tone="subdued">
                  Apply fixed and percentage option
                  adjustments to the actual Shopify cart
                  price, not only the storefront label.
                </Text>
              </BlockStack>

              <Text
                as="span"
                tone={
                  pricing.enabled
                    ? "success"
                    : "subdued"
                }
                fontWeight="semibold"
              >
                {pricing.enabled
                  ? "Enabled"
                  : "Not enabled"}
              </Text>
            </InlineStack>

            {pricing.enabled ? (
              <BlockStack gap="150">
                {!pricing.ready ? (
                  <Banner tone="critical">
                    <p>
                      Shopify pricing is not fully active yet.
                      Re-enable pricing below after deploying
                      the latest app version.
                    </p>
                  </Banner>
                ) : null}
                <Text as="p">
                  Pricing function:{" "}
                  {pricing.cartTransformReady
                    ? "Active"
                    : "Needs attention"}
                </Text>
                <Text as="p">
                  Cart expand support:{" "}
                  {pricing.expandEligible
                    ? "Supported"
                    : "Not supported"}
                </Text>
                <Text as="p">
                  Active transforms:{" "}
                  {pricing.activeTransformCount}
                </Text>
                <Text as="p">
                  Pricing component:{" "}
                  {pricing.addonReady
                    ? "Ready"
                    : "Needs attention"}
                </Text>
                <Form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="enablePricing"
                  />
                  <Button
                    submit
                    loading={busy}
                  >
                    Repair / resync pricing
                  </Button>
                </Form>

                {pricing.enabledAt ? (
                  <Text as="p" tone="subdued">
                    Enabled{" "}
                    {new Intl.DateTimeFormat(
                      "en-IN",
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                    ).format(
                      new Date(pricing.enabledAt),
                    )}
                  </Text>
                ) : null}
              </BlockStack>
            ) : (
              <BlockStack gap="300">
                <Banner tone="info">
                  <p>
                    Enabling pricing creates an internal
                    Shopify pricing component and activates
                    the OptionFlow Cart Transform function.
                  </p>
                </Banner>

                <Form method="post">
                  <input
                    type="hidden"
                    name="intent"
                    value="enablePricing"
                  />
                  <Button
                    submit
                    variant="primary"
                    loading={busy}
                  >
                    Enable real pricing
                  </Button>
                </Form>
              </BlockStack>
            )}

            <Text as="p" tone="subdued">
              Cart Transform pricing does not apply to cart
              lines that use selling plans such as
              subscriptions or pre-orders.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </OFPage>
  );
}
