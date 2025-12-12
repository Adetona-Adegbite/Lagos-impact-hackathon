import prisma from "../../config/db.js";

export const restockProduct = async (
  productId: string,
  quantityToAdd: number,
) => {
  const inventory = await prisma.inventory.findUnique({
    where: { productId },
  });

  if (!inventory) {
    // If for some reason inventory record doesn't exist (should exist on product creation), create it
    // Check if product exists first
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw { statusCode: 404, message: "Product not found" };
    }

    return prisma.inventory.create({
      data: {
        productId,
        quantity: quantityToAdd,
      },
      include: { product: true },
    });
  }

  const updatedInventory = await prisma.inventory.update({
    where: { productId },
    data: {
      quantity: {
        increment: quantityToAdd,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true,
        },
      },
    },
  });

  return updatedInventory;
};

export const getInventory = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
) => {
  const skip = (page - 1) * limit;

  const where = {
    product: { userId },
  };

  const [inventory, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
            category: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.inventory.count({ where }),
  ]);

  return {
    items: inventory,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getLowStock = async (userId: string, threshold: number = 10) => {
  const lowStockItems = await prisma.inventory.findMany({
    where: {
      product: { userId },
      quantity: {
        lte: threshold,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true,
          category: true,
        },
      },
    },
    orderBy: {
      quantity: "asc",
    },
  });

  return lowStockItems;
};
