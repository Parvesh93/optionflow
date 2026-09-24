import {
  Badge,
  BlockStack,
  Button,
  Card,
  InlineStack,
  Text,
} from "@shopify/polaris";

import type { RecentOptionSet } from "../types";

type RecentOptionSetsProps = {
  optionSets: RecentOptionSet[];
};

export function RecentOptionSets({
  optionSets,
}: RecentOptionSetsProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h2" variant="headingMd">
            Recently created option sets
          </Text>

          <Button url="/app/option-sets">
            View all
          </Button>
        </InlineStack>

        <BlockStack gap="300">
          {optionSets.map((optionSet) => (
            <InlineStack
              key={optionSet.id}
              align="space-between"
              blockAlign="center"
            >
              <BlockStack gap="100">
                <Text as="p" fontWeight="semibold">
                  {optionSet.name}
                </Text>

                <Text as="p" tone="subdued">
                  {optionSet.description}
                </Text>
              </BlockStack>

              <Text as="p">
                {optionSet.assignedProducts} products
              </Text>

              <Badge
                tone={
                  optionSet.status === "Published"
                    ? "success"
                    : "warning"
                }
              >
                {optionSet.status}
              </Badge>

              <Text as="p" tone="subdued">
                {optionSet.updatedAt}
              </Text>
            </InlineStack>
          ))}
        </BlockStack>
      </BlockStack>
    </Card>
  );
}