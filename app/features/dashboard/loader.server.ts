import type { LoaderFunctionArgs } from "react-router";

import { authenticate } from "~/shopify.server";

import type {
  DashboardStat,
  RecentOptionSet,
  SetupChecklistItem,
} from "./types";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const stats: DashboardStat[] = [
    {
      id: "option-sets",
      label: "Option Sets",
      value: "12",
      change: "2 this month",
      tone: "success",
    },
    {
      id: "assigned-products",
      label: "Assigned Products",
      value: "156",
      change: "24 this month",
      tone: "success",
    },
    {
      id: "orders-with-options",
      label: "Orders with Options",
      value: "320",
      change: "18% this month",
      tone: "success",
    },
    {
      id: "revenue-impact",
      label: "Revenue Impact",
      value: "₹48,250",
      change: "22% this month",
      tone: "success",
    },
  ];

  const checklist: SetupChecklistItem[] = [
    {
      id: "create-option-set",
      title: "Create your first option set",
      description: "Build a custom option set",
      completed: true,
      url: "/app/option-sets/new",
    },
    {
      id: "assign-products",
      title: "Assign to products",
      description: "Attach option set to products",
      completed: true,
      url: "/app/assignments",
    },
    {
      id: "enable-extension",
      title: "Enable theme extension",
      description: "Activate on your storefront",
      completed: false,
      url: "/app/settings",
    },
    {
      id: "test-storefront",
      title: "Test on storefront",
      description: "Verify it works as expected",
      completed: false,
      url: "/app/settings",
    },
    {
      id: "publish-option-set",
      title: "Publish your option set",
      description: "Make it live for customers",
      completed: false,
      url: "/app/option-sets",
    },
  ];

  const recentOptionSets: RecentOptionSet[] = [
    {
      id: "engraving-options",
      name: "Engraving Options",
      description: "Text, Font, Color, Position",
      assignedProducts: 12,
      status: "Published",
      updatedAt: "Jun 5, 2024",
    },
    {
      id: "photo-upload",
      name: "Photo Upload",
      description: "Image upload with preview",
      assignedProducts: 8,
      status: "Published",
      updatedAt: "Jun 3, 2024",
    },
    {
      id: "color-material",
      name: "Color & Material",
      description: "Color, Material, Finish",
      assignedProducts: 24,
      status: "Published",
      updatedAt: "Jun 1, 2024",
    },
    {
      id: "gift-wrap",
      name: "Gift Wrap",
      description: "Wrap type, Message",
      assignedProducts: 15,
      status: "Draft",
      updatedAt: "May 29, 2024",
    },
  ];

  return {
    shop: session.shop,
    stats,
    checklist,
    recentOptionSets,
  };
}