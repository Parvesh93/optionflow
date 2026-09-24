import { Badge } from "@shopify/polaris";

import type {
  OptionSetListStatus,
} from "../../types";

type OptionSetStatusBadgeProps = {
  status: OptionSetListStatus;
};

export function OptionSetStatusBadge({
  status,
}: OptionSetStatusBadgeProps) {
  if (status === "PUBLISHED") {
    return <Badge tone="success">Published</Badge>;
  }

  if (status === "ARCHIVED") {
    return <Badge>Archived</Badge>;
  }

  return <Badge tone="attention">Draft</Badge>;
}