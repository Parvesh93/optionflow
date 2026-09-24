import type { ComponentProps, ReactNode } from "react";
import { Page } from "@shopify/polaris";

type PolarisPageProps = ComponentProps<typeof Page>;

type OFPageProps = Omit<PolarisPageProps, "children"> & {
  children: ReactNode;
};

export function OFPage({ children, ...props }: OFPageProps) {
  return <Page {...props}>{children}</Page>;
}