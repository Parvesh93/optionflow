import {
  Badge,
  BlockStack,
  Card,
  InlineStack,
  Link,
  Text,
} from "@shopify/polaris";

import type { SetupChecklistItem } from "../types";

type SetupChecklistProps = {
  items: SetupChecklistItem[];
};

export function SetupChecklist({ items }: SetupChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h2" variant="headingMd">
            Setup checklist
          </Text>

          <Badge tone="info">
            {`${completedCount} / ${items.length} completed`}
          </Badge>
        </InlineStack>

        <BlockStack gap="300">
          {items.map((item) => (
            <InlineStack key={item.id} align="space-between">
              <BlockStack gap="100">
                <Text
                  as="p"
                  fontWeight="semibold"
                  textDecorationLine={
                    item.completed ? "line-through" : undefined
                  }
                >
                  {item.title}
                </Text>

                <Text as="p" tone="subdued">
                  {item.description}
                </Text>
              </BlockStack>

              <Link url={item.url}>
                {item.completed ? "Done" : "Open"}
              </Link>
            </InlineStack>
          ))}
        </BlockStack>

        <Link url="/app/settings">
          View all guides
        </Link>
      </BlockStack>
    </Card>
  );
}