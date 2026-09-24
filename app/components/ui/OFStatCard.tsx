import type { ReactNode } from "react";
import {
  Badge,
  BlockStack,
  Card,
  InlineStack,
  Text,
} from "@shopify/polaris";

type BadgeTone =
  | "success"
  | "attention"
  | "info"
  | "warning"
  | "critical"
  | "new"
  | "read-only"
  | "enabled";

type OFStatCardProps = {
  label: string;
  value: string;
  change?: string;
  changeTone?: BadgeTone;
  icon?: ReactNode;
};

export function OFStatCard({
  label,
  value,
  change,
  changeTone = "success",
  icon,
}: OFStatCardProps) {
  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack gap="300" blockAlign="center">
          {icon}

          <Text as="p" tone="subdued">
            {label}
          </Text>
        </InlineStack>

        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" variant="heading2xl">
            {value}
          </Text>

          {change ? (
            <Badge tone={changeTone}>
              {change}
            </Badge>
          ) : null}
        </InlineStack>
      </BlockStack>
    </Card>
  );
}