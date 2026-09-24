import type { ReactNode } from "react";
import {
  BlockStack,
  Card,
  InlineStack,
  Text,
} from "@shopify/polaris";

type OFCardProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function OFCard({
  children,
  title,
  description,
  action,
}: OFCardProps) {
  const hasHeader = title || description || action;

  return (
    <Card>
      <BlockStack gap="400">
        {hasHeader ? (
          <InlineStack
            align="space-between"
            blockAlign="start"
            gap="300"
          >
            <BlockStack gap="100">
              {title ? (
                <Text as="h2" variant="headingMd">
                  {title}
                </Text>
              ) : null}

              {description ? (
                <Text as="p" tone="subdued">
                  {description}
                </Text>
              ) : null}
            </BlockStack>

            {action}
          </InlineStack>
        ) : null}

        {children}
      </BlockStack>
    </Card>
  );
}