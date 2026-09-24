import { InlineGrid } from "@shopify/polaris";

import { OFStatCard } from "../../../components/ui";

import type { DashboardStat } from "../types";

type DashboardStatsProps = {
  stats: DashboardStat[];
};

export function DashboardStats({
  stats,
}: DashboardStatsProps) {
  return (
    <InlineGrid
      columns={{
        xs: 1,
        sm: 2,
        lg: 4,
      }}
      gap="400"
    >
      {stats.map((stat) => (
        <OFStatCard
          key={stat.id}
          label={stat.label}
          value={stat.value}
          change={stat.change}
          changeTone={stat.tone ?? "info"}
        />
      ))}
    </InlineGrid>
  );
}