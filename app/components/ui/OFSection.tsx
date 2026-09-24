import type { ReactNode } from "react";
import { BlockStack, Text } from "@shopify/polaris";

type OFSectionProps = {
  children: ReactNode;
  title?: string;
  description?: string;
};

export function OFSection({
  children,
  title,
  description,
}: OFSectionProps) {
  return (
    <BlockStack gap="400">
      {title || description ? (
        <BlockStack gap="100">
          {title ? (
            <Text as="h2" variant="headingLg">
              {title}
            </Text>
          ) : null}

          {description ? (
            <Text as="p" tone="subdued">
              {description}
            </Text>
          ) : null}
        </BlockStack>
      ) : null}

      {children}
    </BlockStack>
  );
}