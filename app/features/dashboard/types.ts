export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  change?: string;
  tone?: "success" | "attention" | "info";
};

export type SetupChecklistItem = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  url: string;
};

export type RecentOptionSet = {
  id: string;
  name: string;
  description: string;
  assignedProducts: number;
  status: "Published" | "Draft";
  updatedAt: string;
};