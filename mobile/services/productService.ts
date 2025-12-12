import { executeSql, Product, Inventory, Sale, SaleItem } from "./database";
import { inventoryApi } from "./api";
import { authStorage } from "./authStorage";
import cuid from "cuid";

// Helper to generate IDs
const generateId = cuid;

const getCurrentTimestamp = () => new Date().toISOString();

export const productService = {
  /**
   * Get all products with their current inventory quantity
   */
  getAllProducts: async (): Promise<(Product & { quantity: number })[]> => {
    const sql = `
      SELECT p.*, i.quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.productId
      WHERE p.deleted = 0
      ORDER BY p.name ASC;
    `;
    const result = await executeSql(sql);
    return result.rows._array;
  },

  /**
   * Find a product by barcode
   */
  getProductByBarcode: async (
    barcode: string,
  ): Promise<(Product & { quantity: number }) | null> => {
    const sql = `
      SELECT p.*, i.quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.productId
      WHERE p.barcode = ? AND p.deleted = 0
      LIMIT 1;
    `;
    const result = await executeSql(sql, [barcode]);
    if (result.rows.length > 0) {
      return result.rows.item(0);
    }
    return null;
  },

  /**
   * Create a new product and initialize its inventory
   */
  createProduct: async (data: {
    name: string;
    barcode: string;
    category: string;
    sellingPrice: number;
    purchasePrice: number;
    quantity: number;
  }): Promise<string> => {
    const productId = generateId();
    const inventoryId = generateId();
    const now = getCurrentTimestamp();

    try {
      await executeSql(
        `INSERT INTO products (id, name, barcode, category, sellingPrice, purchasePrice, createdAt, updatedAt, deleted, syncStatus)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')`,
        [
          productId,
          data.name,
          data.barcode,
          data.category,
          data.sellingPrice,
          data.purchasePrice,
          now,
          now,
        ],
      );

      await executeSql(
        `INSERT INTO inventory (id, productId, quantity, updatedAt, syncStatus)
             VALUES (?, ?, ?, ?, 'pending')`,
        [inventoryId, productId, data.quantity, now],
      );

      return productId;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  /**
   * Update an existing product
   */
  updateProduct: async (
    id: string,
    data: Partial<
      Omit<Product, "id" | "createdAt" | "updatedAt" | "deleted" | "syncStatus">
    >,
  ): Promise<void> => {
    const now = getCurrentTimestamp();
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      params.push(data.name);
    }
    if (data.barcode !== undefined) {
      updates.push("barcode = ?");
      params.push(data.barcode);
    }
    if (data.category !== undefined) {
      updates.push("category = ?");
      params.push(data.category);
    }
    if (data.sellingPrice !== undefined) {
      updates.push("sellingPrice = ?");
      params.push(data.sellingPrice);
    }
    if (data.purchasePrice !== undefined) {
      updates.push("purchasePrice = ?");
      params.push(data.purchasePrice);
    }

    if (updates.length === 0) return;

    updates.push("updatedAt = ?");
    params.push(now);
    updates.push("syncStatus = ?");
    params.push("pending");

    params.push(id);

    const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
    await executeSql(sql, params);
  },

  /**
   * Update inventory quantity for a product
   */
  updateInventory: async (
    productId: string,
    newQuantity: number,
  ): Promise<void> => {
    const now = getCurrentTimestamp();
    // Check if inventory record exists
    const check = await executeSql(
      "SELECT id FROM inventory WHERE productId = ?",
      [productId],
    );

    if (check.rows.length > 0) {
      await executeSql(
        `UPDATE inventory SET quantity = ?, updatedAt = ?, syncStatus = 'pending' WHERE productId = ?`,
        [newQuantity, now, productId],
      );
    } else {
      const inventoryId = generateId();
      await executeSql(
        `INSERT INTO inventory (id, productId, quantity, updatedAt, syncStatus)
             VALUES (?, ?, ?, ?, 'pending')`,
        [inventoryId, productId, newQuantity, now],
      );
    }

    // Fire and forget sync to backend
    authStorage.getToken().then((token) => {
      if (token) {
        inventoryApi
          .update({ productId, quantity: newQuantity }, token)
          .catch((e) => console.warn("Live inventory update failed", e));
      }
    });
  },

  /**
   * Process a sale: create sale record, create sale items, update inventory
   */
  processSale: async (
    items: { productId: string; quantity: number; price: number }[],
  ): Promise<string> => {
    const saleId = generateId();
    const now = getCurrentTimestamp();
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    try {
      // 1. Create Sale
      await executeSql(
        `INSERT INTO sales (id, totalAmount, createdAt, syncStatus) VALUES (?, ?, ?, 'pending')`,
        [saleId, totalAmount, now],
      );

      // 2. Process items
      for (const item of items) {
        const itemId = generateId();
        // Create Sale Item
        await executeSql(
          `INSERT INTO sale_items (id, saleId, productId, quantity, priceAtSale)
                 VALUES (?, ?, ?, ?, ?)`,
          [itemId, saleId, item.productId, item.quantity, item.price],
        );

        // Update Inventory (decrement)
        await executeSql(
          `UPDATE inventory
                 SET quantity = quantity - ?, updatedAt = ?, syncStatus = 'pending'
                 WHERE productId = ?`,
          [item.quantity, now, item.productId],
        );
      }

      return saleId;
    } catch (error) {
      console.error("Error processing sale:", error);
      throw error;
    }
  },

  /**
   * Delete a product (soft delete)
   */
  deleteProduct: async (productId: string): Promise<void> => {
    const now = getCurrentTimestamp();
    await executeSql(
      `UPDATE products SET deleted = 1, updatedAt = ?, syncStatus = 'pending' WHERE id = ?`,
      [now, productId],
    );
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    const today = new Date().toISOString().split("T")[0];

    // 1. Today's Sales
    const salesSql = `
      SELECT SUM(totalAmount) as total
      FROM sales
      WHERE createdAt LIKE ?
    `;
    const salesRes = await executeSql(salesSql, [`${today}%`]);
    const todaySales = salesRes.rows.item(0).total || 0;

    // 2. Low Stock Count
    const lowStockSql = `
      SELECT COUNT(*) as count
      FROM inventory
      WHERE quantity <= 3
    `;
    const lowStockRes = await executeSql(lowStockSql);
    const lowStockCount = lowStockRes.rows.item(0).count || 0;

    // 3. Total Items
    const totalItemsSql = `
      SELECT COUNT(*) as count
      FROM products
      WHERE deleted = 0
    `;
    const totalItemsRes = await executeSql(totalItemsSql);
    const totalItemsCount = totalItemsRes.rows.item(0).count || 0;

    return {
      todaySales,
      lowStockCount,
      totalItemsCount,
    };
  },

  /**
   * Get recent sales
   */
  getRecentSales: async (limit: number = 5) => {
    const sql = `
      SELECT
        s.id,
        s.totalAmount,
        s.createdAt,
        (SELECT p.name FROM sale_items si JOIN products p ON si.productId = p.id WHERE si.saleId = s.id LIMIT 1) as title,
        (SELECT COUNT(*) FROM sale_items si WHERE si.saleId = s.id) as itemCount
      FROM sales s
      ORDER BY s.createdAt DESC
      LIMIT ?
    `;
    const result = await executeSql(sql, [limit]);
    return result.rows._array;
  },
};
