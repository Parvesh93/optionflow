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
    pagination?: {
      after?: string;
      before?: string;
    },
  ): Promise<{
    products: ShopifyProductDTO[];
    pageInfo: {
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      startCursor: string | null;
      endCursor: string | null;
    };
  }> {
    const isPrevious = Boolean(pagination?.before);

    const response = await admin.graphql(
      `#graphql
        query OptionFlowProductSearch(
          $query: String
          $first: Int
          $after: String
          $last: Int
          $before: String
        ) {
          products(
            first: $first
            after: $after
            last: $last
            before: $before
            query: $query
            sortKey: TITLE
          ) {
            nodes {
              id
              title
              handle
              status
              featuredImage {
                url
              }
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      `,
      {
        variables: {
          query: search.trim() || null,
          first: isPrevious ? null : 50,
          after: isPrevious
            ? null
            : pagination?.after || null,
          last: isPrevious ? 50 : null,
          before: isPrevious
            ? pagination?.before || null
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
          pageInfo?: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor?: string | null;
            endCursor?: string | null;
          };
        };
      };
      errors?: unknown;
    };

    const connection = json.data?.products;

    if (!connection?.nodes) {
      return {
        products: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      };
    }

    return {
      products: connection.nodes.map((product) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        status: product.status,
        imageUrl: product.featuredImage?.url ?? null,
      })),
      pageInfo: {
        hasNextPage:
          connection.pageInfo?.hasNextPage ?? false,
        hasPreviousPage:
          connection.pageInfo?.hasPreviousPage ?? false,
        startCursor:
          connection.pageInfo?.startCursor ?? null,
        endCursor:
          connection.pageInfo?.endCursor ?? null,
      },
    };
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
