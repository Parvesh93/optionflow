import type { LoaderFunctionArgs } from "react-router";

import {
  Badge,
  BlockStack,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Layout,
  Page,
  Text,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function DashboardPage() {
  return (
    <Page
      title="OptionFlow"
      subtitle="Create and manage advanced product options."
      primaryAction={
        <Button variant="primary" url="/app/option-sets/new">
          Create option set
        </Button>
      }
    >
      <BlockStack gap="500">
        <InlineGrid columns={{ xs: 1, sm: 3 }} gap="400">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingSm">
                Active option sets
              </Text>

              <Text as="p" variant="heading2xl">
                0
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingSm">
                Assigned products
              </Text>

              <Text as="p" variant="heading2xl">
                0
              </Text>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="200">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingSm">
                  Storefront status
                </Text>

                <Badge tone="attention">
                  Setup required
                </Badge>
              </InlineStack>
            </BlockStack>
          </Card>
        </InlineGrid>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Welcome to OptionFlow
                </Text>

                <Text as="p">
                  Create unlimited product options, collect
                  personalization details, configure conditional logic,
                  and add optional pricing.
                </Text>

                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    url="/app/option-sets/new"
                  >
                    Create your first option set
                  </Button>

                  <Button url="/app/templates">
                    Browse templates
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Setup checklist
                </Text>

                <Text as="p">
                  1. Create an option set
                </Text>

                <Text as="p">
                  2. Assign it to products
                </Text>

                <Text as="p">
                  3. Enable the theme extension
                </Text>

                <Text as="p">
                  4. Test it on your storefront
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}