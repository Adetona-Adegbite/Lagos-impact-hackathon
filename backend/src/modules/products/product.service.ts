import prisma from "../../config/db.js";
import { Prisma } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";
import { PRODUCT_CATEGORIES } from "./categories.js";

export const createProduct = async (data: {
  id?: string;
  name: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  userId: string;
}) => {
  const existingProduct = await prisma.product.findUnique({
    where: {
      barcode_userId: {
        barcode: data.barcode,
        userId: data.userId,
      },
    },
  });

  if (existingProduct) {
    throw {
      statusCode: 409,
      message: "Product with this barcode already exists",
    };
  }

  // Create product and initialize inventory with 0
  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        id: data.id,
        name: data.name,
        barcode: data.barcode,
        category: data.category,
        sellingPrice: data.sellingPrice,
        purchasePrice: data.purchasePrice,
        userId: data.userId,
      },
    });

    await tx.inventory.create({
      data: {
        productId: newProduct.id,
        quantity: 0,
      },
    });

    return newProduct;
  });

  return product;
};

export const getProducts = async (
  userId: string,
  page: number = 1,
  limit: number = 20,
  search?: string,
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    userId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { barcode: { contains: search } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        inventory: {
          select: { quantity: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      inventory: {
        select: { quantity: true },
      },
    },
  });

  if (!product) {
    throw { statusCode: 404, message: "Product not found" };
  }

  return product;
};

export const updateProduct = async (
  id: string,
  data: {
    name?: string;
    category?: string;
    sellingPrice?: number;
    purchasePrice?: number;
  },
) => {
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) throw { statusCode: 404, message: "Product not found" };

  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      inventory: {
        select: { quantity: true },
      },
    },
  });

  return product;
};

export const deleteProduct = async (id: string) => {
  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) throw { statusCode: 404, message: "Product not found" };

  // Use transaction to delete inventory first.
  // Note: If SaleItems exist, this transaction will likely fail on product deletion due to FK constraints.
  await prisma.$transaction(async (tx) => {
    // Try to delete inventory if it exists
    await tx.inventory.deleteMany({
      where: { productId: id },
    });

    await tx.product.delete({
      where: { id },
    });
  });

  return { message: "Product deleted successfully" };
};

export const getCategories = () => {
  return PRODUCT_CATEGORIES;
};

export const recommendCategory = async (name: string) => {
  if (!process.env.GEMINI_API_KEY) {
    throw {
      statusCode: 500,
      message: "Gemini API key is not configured.",
    };
  }
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `Based on the product name "${name}", which of the following categories is the best fit? Please choose only one from the list.

Categories:
${PRODUCT_CATEGORIES.join("\n")}

Respond with only the category name from the list provided.`;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    const category = result.text?.trim();

    // Return the category if it's in our list, otherwise maybe a default or the raw response
    if (category && PRODUCT_CATEGORIES.includes(category)) {
      return category;
    } else {
      // A simple fallback if Gemini hallucinates a category
      console.warn(
        `Gemini returned a category not in the list: "${category}". Picking first category as fallback.`,
      );
      return PRODUCT_CATEGORIES[0];
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw {
      statusCode: 500,
      message: "Failed to get category recommendation.",
    };
  }
};
