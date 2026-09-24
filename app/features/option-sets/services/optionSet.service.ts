import { OptionSetStatus } from "@prisma/client";

import { optionSetRepository } from "../repositories/optionSet.repository";

import type { CreateOptionSetInput } from "../schemas/createOptionSet.schema";

import type { UpdateOptionSetInput } from "../schemas/updateOptionSet.schema";

import type {
  OptionSetListFilters,
  OptionSetListItemDTO,
  OptionSetListResult,
  OptionSetListStatus,
  OptionSetSort,
} from "../types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function normalizeSort(
  value?: OptionSetSort,
): OptionSetSort {
  const supportedSorts: OptionSetSort[] = [
    "UPDATED_DESC",
    "UPDATED_ASC",
    "NAME_ASC",
    "NAME_DESC",
    "CREATED_DESC",
    "CREATED_ASC",
  ];

  return value && supportedSorts.includes(value)
    ? value
    : "UPDATED_DESC";
}

function normalizePage(value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}


function normalizePageSize(value: number) {
  if (!Number.isFinite(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(value), MAX_PAGE_SIZE);
}

function parseStatus(
  value?: OptionSetListStatus,
): OptionSetStatus | undefined {
  if (!value) {
    return undefined;
  }

  if (
    value === "DRAFT" ||
    value === "PUBLISHED" ||
    value === "ARCHIVED"
  ) {
    return value;
  }

  return undefined;
}

function toListItemDTO(
  optionSet: Awaited<
    ReturnType<typeof optionSetRepository.list>
  >[number],
): OptionSetListItemDTO {
  return {
    id: optionSet.id,
    name: optionSet.name,
    handle: optionSet.handle,
    description: optionSet.description,
    status: optionSet.status,
    assignedProducts: 0,
    createdAt: optionSet.createdAt.toISOString(),
    updatedAt: optionSet.updatedAt.toISOString(),
    publishedAt:
      optionSet.publishedAt?.toISOString() ?? null,
  };
}

function createHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function createUniqueHandle(
  shopId: string,
  name: string,
) {
  const baseHandle = createHandle(name) || "option-set";

  let handle = baseHandle;
  let suffix = 2;

  while (
    await optionSetRepository.handleExists(
      shopId,
      handle,
    )
  ) {
    handle = `${baseHandle}-${suffix}`;
    suffix += 1;
  }

  return handle;
}

export type OptionSetEditDTO = {
  id: string;
  name: string;
  handle: string;
  description: string;
  internalNote: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export class OptionSetNotFoundError extends Error {
  constructor() {
    super("Option set not found.");
    this.name = "OptionSetNotFoundError";
  }
}

export class OptionSetRevisionConflictError extends Error {
  constructor() {
    super(
      "This option set was updated elsewhere. Refresh the page and try again.",
    );
    this.name = "OptionSetRevisionConflictError";
  }
}

export const optionSetService = {
  async list(
    shopId: string,
    filters: OptionSetListFilters,
  ): Promise<OptionSetListResult> {
    const page = normalizePage(filters.page);
    const pageSize = normalizePageSize(filters.pageSize);

    const search = filters.search?.trim() || undefined;
    const status = parseStatus(filters.status);

    const skip = (page - 1) * pageSize;

    const sort = normalizeSort(filters.sort);

    const [records, totalItems] = await Promise.all([
      optionSetRepository.list({
  shopId,
  search,
  status,
  sort,
  skip,
  take: pageSize,
}),
      optionSetRepository.count({
        shopId,
        search,
        status,
      }),
    ]);

    return {
      items: records.map(toListItemDTO),
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(
          1,
          Math.ceil(totalItems / pageSize),
        ),
      },
    };
  },

  async getForEdit(
  shopId: string,
  optionSetId: string,
): Promise<OptionSetEditDTO> {
  const optionSet =
    await optionSetRepository.findById(
      shopId,
      optionSetId,
    );

  if (!optionSet) {
    throw new OptionSetNotFoundError();
  }

  return {
    id: optionSet.id,
    name: optionSet.name,
    handle: optionSet.handle,
    description: optionSet.description ?? "",
    internalNote: optionSet.internalNote ?? "",
    status: optionSet.status,
    revision: optionSet.revision,
    createdAt: optionSet.createdAt.toISOString(),
    updatedAt: optionSet.updatedAt.toISOString(),
  };
},

async update(
  shopId: string,
  optionSetId: string,
  input: UpdateOptionSetInput,
) {
  const current =
    await optionSetRepository.findById(
      shopId,
      optionSetId,
    );

  if (!current) {
    throw new OptionSetNotFoundError();
  }

  const isPublishing =
    input.status === "PUBLISHED";

  const publishedAt = isPublishing
    ? current.publishedAt ?? new Date()
    : null;

  const publishedRevision = isPublishing
    ? current.publishedRevision ??
      current.revision + 1
    : null;

  const updated =
    await optionSetRepository.update({
      shopId,
      optionSetId,
      name: input.name.trim(),
      description: input.description,
      internalNote: input.internalNote,
      status: input.status,
      publishedAt,
      publishedRevision,
      expectedRevision: input.revision,
    });

  if (!updated) {
    throw new OptionSetRevisionConflictError();
  }

  return {
    id: updated.id,
    name: updated.name,
    status: updated.status,
    revision: updated.revision,
  };
},

  async archive(
    shopId: string,
    optionSetId: string,
  ) {
    const current = await optionSetRepository.findById(
      shopId,
      optionSetId,
    );

    if (!current) {
      throw new OptionSetNotFoundError();
    }

    if (current.status === "ARCHIVED") {
      return { id: current.id, status: current.status };
    }

    const archived = await optionSetRepository.archive(
      shopId,
      optionSetId,
    );

    if (!archived) {
      throw new OptionSetNotFoundError();
    }

    return { id: optionSetId, status: "ARCHIVED" as const };
  },

  async restore(
    shopId: string,
    optionSetId: string,
  ) {
    const current = await optionSetRepository.findById(
      shopId,
      optionSetId,
    );

    if (!current) {
      throw new OptionSetNotFoundError();
    }

    if (current.status !== "ARCHIVED") {
      return { id: current.id, status: current.status };
    }

    const restored = await optionSetRepository.restore(
      shopId,
      optionSetId,
    );

    if (!restored) {
      throw new OptionSetNotFoundError();
    }

    return { id: optionSetId, status: "DRAFT" as const };
  },

  async duplicate(
    shopId: string,
    optionSetId: string,
  ) {
    const source = await optionSetRepository.findById(
      shopId,
      optionSetId,
    );

    if (!source) {
      throw new OptionSetNotFoundError();
    }

    const name = `${source.name} - Copy`;
    const handle = await createUniqueHandle(shopId, name);

    const duplicated = await optionSetRepository.duplicate({
      shopId,
      name,
      handle,
      description: source.description,
      internalNote: source.internalNote,
      displayTitle: source.displayTitle,
      tags: source.tags,
      priority: source.priority,
    });

    return {
      id: duplicated.id,
      name: duplicated.name,
      handle: duplicated.handle,
      status: duplicated.status,
    };
  },

  async create(
    shopId: string,
    input: CreateOptionSetInput,
  ) {
    const handle = await createUniqueHandle(
      shopId,
      input.name,
    );

    const publishedAt =
      input.status === "PUBLISHED"
        ? new Date()
        : null;

    const optionSet =
      await optionSetRepository.create({
        shopId,
        name: input.name.trim(),
        handle,
        description: input.description,
        internalNote: input.internalNote,
        status: input.status,
        publishedAt,
      });

    return {
      id: optionSet.id,
      name: optionSet.name,
      handle: optionSet.handle,
      status: optionSet.status,
    };
  },
};