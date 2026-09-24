export type ShopifyProductDTO = {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  status: string;
};

export type ProductAssignmentDTO = {
  id: string;
  productGid: string;
  productTitle: string;
  productHandle: string;
  productImageUrl: string | null;
};
