import { productAssignmentRepository } from "../repositories/productAssignment.repository";
import type {
  ProductAssignmentDTO,
  ShopifyProductDTO,
} from "../types";

type AdminGraphqlClient = {
  graphql: (
    query: string,
    options?: {
      variables?: Record<string, unknown>;
    },
  ) => Promise<Response>;
};

export class ProductAssignmentNotFoundError extends Error {
  constructor() {
    super("Product assignment not found.");
    this.name = "ProductAssignmentNotFoundError";
  }
}

export const productAssignmentService = {
  async list(
    shopId: string,
    optionSetId: string,
  ): Promise<ProductAssignmentDTO[]> {
    const rows =
      await productAssignmentRepository.listForOptionSet(
        shopId,
        optionSetId,
      );

    return rows.map((row) => ({
      id: row.id,
      productGid: row.productGid,
      productTitle: row.productTitle,
      productHandle: row.productHandle,
      productImageUrl: row.productImageUrl,
    }));
  },

  async searchProducts(
    admin: AdminGraphqlClient,
    search: string,
  ): Promise<ShopifyProductDTO[]> {
    const response = await admin.graphql(
      `#graphql
        query OptionFlowProductSearch($query: String) {
          products(first: 20, query: $query, sortKey: TITLE) {
            nodes {
              id
              title
              handle
              status
              featuredImage {
                url
              }
            }
          }
        }
      `,
      {
        variables: {
          query: search.trim()
            ? `title:*${search.trim()}*`
            : null,
        },
      },
    );

    const json = await response.json() as {
      data?: {
        products?: {
          nodes?: Array<{
            id: string;
            title: string;
            handle: string;
            status: string;
            featuredImage?: {
              url?: string | null;
            } | null;
          }>;
        };
      };
      errors?: unknown;
    };

    if (!json.data?.products?.nodes) {
      return [];
    }

    return json.data.products.nodes.map((product) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      status: product.status,
      imageUrl: product.featuredImage?.url ?? null,
    }));
  },

  async assign(
    shopId: string,
    optionSetId: string,
    product: ShopifyProductDTO,
  ) {
    return productAssignmentRepository.assignProduct({
      shopId,
      optionSetId,
      productGid: product.id,
      productTitle: product.title,
      productHandle: product.handle,
      productImageUrl: product.imageUrl,
    });
  },

  async unassign(
    shopId: string,
    optionSetId: string,
    productGid: string,
  ) {
    const removed =
      await productAssignmentRepository.unassignProduct(
        shopId,
        optionSetId,
        productGid,
      );

    if (!removed) {
      throw new ProductAssignmentNotFoundError();
    }
  },
};
