import {
  BlockStack,
  InlineGrid,
} from "@shopify/polaris";
import { useLoaderData } from "react-router";

import { OFPage } from "~/components/ui";

import type { loader } from "./loader.server";

import { DashboardStats } from "./components/DashboardStats";
import { OrdersChart } from "./components/OrdersChart";
import { QuickActions } from "./components/QuickActions";
import { RecentOptionSets } from "./components/RecentOptionSets";
import { SetupChecklist } from "./components/SetupChecklist";

export default function DashboardPage() {
  const {
    stats,
    checklist,
    recentOptionSets,
  } = useLoaderData<typeof loader>();

  return (
    <OFPage
      title="Dashboard"
      subtitle="Here’s what’s happening with your option sets."
    >
      <BlockStack gap="500">
        <DashboardStats stats={stats} />

        <InlineGrid
          columns={{
            xs: 1,
            lg: "2fr 1fr",
          }}
          gap="500"
        >
          <BlockStack gap="500">
            <OrdersChart />

            <RecentOptionSets
              optionSets={recentOptionSets}
            />
          </BlockStack>

          <BlockStack gap="500">
            <SetupChecklist items={checklist} />

            <QuickActions />
          </BlockStack>
        </InlineGrid>
      </BlockStack>
    </OFPage>
  );
}