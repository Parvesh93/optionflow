import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
} from "react-router";

import { NavMenu } from "@shopify/app-bridge-react";
import {
  AppProvider as ShopifyAppProvider,
} from "@shopify/shopify-app-react-router/react";
import { boundary } from "@shopify/shopify-app-react-router/server";

import {
  AppProvider as PolarisAppProvider,
} from "@shopify/polaris";

import "@shopify/polaris/build/esm/styles.css";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  const enTranslations = await import(
    "@shopify/polaris/locales/en.json"
  );

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    polarisTranslations: enTranslations.default,
  };
};

export default function App() {
  const {
    apiKey,
    polarisTranslations,
  } = useLoaderData<typeof loader>();

  return (
    <ShopifyAppProvider embedded apiKey={apiKey}>
      <PolarisAppProvider i18n={polarisTranslations}>
        <NavMenu>
          <Link to="/app" rel="home">
            Dashboard
          </Link>

          <Link to="/app/option-sets">
            Option Sets
          </Link>

          <Link to="/app/templates">
            Templates
          </Link>

          <Link to="/app/analytics">
            Analytics
          </Link>

          <Link to="/app/settings">
            Settings
          </Link>

          <Link to="/app/billing">
            Plans
          </Link>
        </NavMenu>

        <Outlet />
      </PolarisAppProvider>
    </ShopifyAppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};