import prisma from "../../config/db.js";
import { GoogleGenAI } from "@google/genai";

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface SyncSaleItem {
  productId: string;
  quantity: number;
  priceAtSale: number;
}

interface SyncSale {
  id?: string;
  totalAmount: number;
  createdAt?: string;
  items: SyncSaleItem[];
}

export const processCheckout = async (items: CheckoutItem[]) => {
  if (items.length === 0) {
    throw { statusCode: 400, message: "Cart cannot be empty" };
  }

  // 1. Fetch products to get prices and check existence
  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { inventory: true },
  });

  if (products.length !== productIds.length) {
    throw { statusCode: 400, message: "One or more products not found" };
  }

  // Map products for easier lookup
  const productMap = new Map(products.map((p) => [p.id, p]));

  // 2. Validate Inventory and Calculate Total
  let totalAmount = 0;
  const saleItemsData: {
    productId: string;
    quantity: number;
    priceAtSale: number;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      // Should not happen due to length check above, but safe guard
      throw { statusCode: 400, message: `Product ${item.productId} not found` };
    }

    if (!product.inventory || product.inventory.quantity < item.quantity) {
      throw {
        statusCode: 400,
        message: `Insufficient stock for product: ${product.name}. Available: ${product.inventory?.quantity || 0}`,
      };
    }

    const lineTotal = product.sellingPrice * item.quantity;
    totalAmount += lineTotal;

    saleItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      priceAtSale: product.sellingPrice,
    });
  }

  // 3. Execute Transaction
  const sale = await prisma.$transaction(async (tx) => {
    // Create Sale Header
    const newSale = await tx.sale.create({
      data: {
        totalAmount,
        items: {
          createMany: {
            data: saleItemsData,
          },
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, barcode: true },
            },
          },
        },
      },
    });

    // Update Inventory
    for (const item of items) {
      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });
    }

    return newSale;
  });

  return sale;
};

export const getSales = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          select: {
            quantity: true,
            priceAtSale: true,
            product: {
              select: { name: true },
            },
            productId: true,
          },
        },
      },
    }),
    prisma.sale.count(),
  ]);

  return {
    items: sales,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getSaleById = async (id: string) => {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              barcode: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!sale) {
    throw { statusCode: 404, message: "Sale not found" };
  }

  return sale;
};

export const syncSales = async (sales: SyncSale[]) => {
  const results = [];

  for (const saleData of sales) {
    // Check if sale already exists
    if (saleData.id) {
      const existing = await prisma.sale.findUnique({
        where: { id: saleData.id },
      });
      if (existing) {
        results.push({ id: saleData.id, status: "already_synced" });
        continue;
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Create Sale
        await tx.sale.create({
          data: {
            id: saleData.id, // Use provided ID if available
            totalAmount: saleData.totalAmount,
            createdAt: saleData.createdAt
              ? new Date(saleData.createdAt)
              : undefined,
            items: {
              create: saleData.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtSale: item.priceAtSale,
              })),
            },
          },
        });

        // Update Inventory
        for (const item of saleData.items) {
          // Check if inventory exists for this product
          const inventory = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { productId: item.productId },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      });
      results.push({ id: saleData.id, status: "synced" });
    } catch (error) {
      console.error(`Failed to sync sale ${saleData.id}:`, error);
      results.push({
        id: saleData.id,
        status: "failed",
        error: "Transaction failed",
      });
    }
  }

  return { results };
};

export const generateBusinessInsights = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [todaySales, monthSales, lowStock] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: today } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }),
    prisma.inventory.findMany({
      where: { quantity: { lte: 10 } },
      take: 3,
      include: { product: { select: { name: true } } },
      orderBy: { quantity: "asc" },
    }),
  ]);

  const todayRevenue = todaySales._sum.totalAmount || 0;
  const monthRevenue = monthSales._sum.totalAmount || 0;
  const lowStockNames = lowStock.map((i) => i.product.name).join(", ");

  if (!process.env.GEMINI_API_KEY) {
    return {
      message: "Configure Gemini API Key to see AI insights.",
      chips: [
        { title: "Revenue", value: `₦${monthRevenue.toLocaleString()}` },
        { title: "Status", value: "Offline mode" },
      ],
    };
  }

  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
    You are a smart retail business assistant. Analyze this data:
    - Today's Revenue: ₦${todayRevenue}
    - Month Revenue: ₦${monthRevenue}
    - Low Stock Items: ${lowStockNames || "None"}
    - Date: ${today.toDateString()}

    Generate a JSON response for a dashboard widget.
    Structure:
    {
      "message": "Concise, actionable insight (max 20 words). E.g. 'Good sales today! Restock Indomie.'",
      "chips": [
        { "title": "Tax Risk", "value": "Low/Medium/High", "color": "#10B981/#F59E0B/#EF4444" },
        { "title": "Est. Revenue", "value": "₦X (Month Projection)" },
        { "title": "VAT (7.5%)", "value": "₦X (Collected)" },
        { "title": "Attention", "value": "Short alert e.g. 'Low Stock' or 'All Good'" }
      ]
    }
    Output ONLY valid JSON. Do not use markdown blocks.
  `;

  try {
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
            chips: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  value: { type: "string" },
                  color: { type: "string" },
                },
                required: ["title", "value", "color"],
              },
            },
          },
          required: ["message", "chips"],
        },
      },
    });
    const text = result.text || "{}";
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      message: "Great job on sales today! Keep it up.",
      chips: [
        {
          title: "Est. Revenue",
          value: `₦${monthRevenue.toLocaleString()}`,
        },
        {
          title: "VAT Collected",
          value: `₦${(monthRevenue * 0.075).toLocaleString()}`,
        },
      ],
    };
  }
};
