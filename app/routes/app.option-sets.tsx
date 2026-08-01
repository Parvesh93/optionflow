import { Button, EmptyState, Page } from "@shopify/polaris";

export default function OptionSetsPage() {
  return (
    <Page
      title="Option sets"
      primaryAction={
        <Button variant="primary" url="/app/option-sets/new">
          Create option set
        </Button>
      }
    >
      <EmptyState
        heading="Create your first option set"
        action={{
          content: "Create option set",
          url: "/app/option-sets/new",
        }}
        image=""
      >
        <p>
          Add custom fields, swatches, selections, uploads,
          pricing, and conditional logic to your products.
        </p>
      </EmptyState>
    </Page>
  );
}