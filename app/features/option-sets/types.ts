export type OptionSetListStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

export type OptionSetSort =
  | "UPDATED_DESC"
  | "UPDATED_ASC"
  | "NAME_ASC"
  | "NAME_DESC"
  | "CREATED_DESC"
  | "CREATED_ASC";

export type OptionSetListItemDTO = {
  id: string;
  name: string;
  handle: string;
  description: string | null;
  status: OptionSetListStatus;
  assignedProducts: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type OptionSetListFilters = {
  search?: string;
  status?: OptionSetListStatus;
  sort: OptionSetSort;
  page: number;
  pageSize: number;
};

export type OptionSetListResult = {
  items: OptionSetListItemDTO[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};