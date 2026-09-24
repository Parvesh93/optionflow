import {
  BlockStack,
  Button,
  Card,
  InlineGrid,
  Text,
} from "@shopify/polaris";

const actions = [
  {
    id: "create-option-set",
    title: "Create Option Set",
    description: "Start from scratch",
    url: "/app/option-sets/new",
  },
  {
    id: "browse-templates",
    title: "Browse Templates",
    description: "Use pre-built templates",
    url: "/app/templates",
  },
  {
    id: "assign-products",
    title: "Assign to Products",
    description: "Attach to products",
    url: "/app/assignments",
  },
  {
    id: "view-analytics",
    title: "View Analytics",
    description: "See detailed reports",
    url: "/app/analytics",
  },
];

export function QuickActions() {
  return (
    <Card>
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Quick actions
        </Text>

        <InlineGrid columns={{ xs: 1, sm: 2 }} gap="300">
          {actions.map((action) => (
            <BlockStack key={action.id} gap="100">
              <Button url={action.url} textAlign="left">
                {action.title}
              </Button>

              <Text as="span" tone="subdued">
                {action.description}
              </Text>
            </BlockStack>
          ))}
        </InlineGrid>
      </BlockStack>
    </Card>
  );
}