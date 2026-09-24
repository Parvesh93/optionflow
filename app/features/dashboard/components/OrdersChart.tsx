import {
  BlockStack,
  Card,
  InlineStack,
  Select,
  Text,
} from "@shopify/polaris";

export function OrdersChart() {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h2" variant="headingMd">
            Orders with options
          </Text>

          <div style={{ width: 160 }}>
            <Select
              label="Date range"
              labelHidden
              options={[
                {
                  label: "Last 7 days",
                  value: "7",
                },
                {
                  label: "Last 30 days",
                  value: "30",
                },
                {
                  label: "Last 90 days",
                  value: "90",
                },
              ]}
              value="30"
              onChange={() => undefined}
            />
          </div>
        </InlineStack>

        <div
          style={{
            minHeight: 280,
            borderRadius: 12,
            background:
              "linear-gradient(180deg, rgba(91, 58, 238, 0.12) 0%, rgba(91, 58, 238, 0.02) 100%)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Text as="p" tone="subdued">
            Analytics chart will appear here
          </Text>
        </div>
      </BlockStack>
    </Card>
  );
}