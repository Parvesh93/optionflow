import prisma from "~/db.server";

type EnsureShopInput = {
  shopifyDomain: string;
};

export async function ensureShop({
  shopifyDomain,
}: EnsureShopInput) {
  const normalizedDomain = shopifyDomain.trim().toLowerCase();

  return prisma.shop.upsert({
    where: {
      shopifyDomain: normalizedDomain,
    },
    create: {
      shopifyDomain: normalizedDomain,
      status: "ACTIVE",
      installedAt: new Date(),
    },
    update: {
      status: "ACTIVE",
      uninstalledAt: null,
      deletedAt: null,
    },
  });
}