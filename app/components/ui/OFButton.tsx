import type { ComponentProps } from "react";
import { Button } from "@shopify/polaris";

type PolarisButtonProps = ComponentProps<typeof Button>;

export type OFButtonProps = PolarisButtonProps;

export function OFButton(props: OFButtonProps) {
  return <Button {...props} />;
}