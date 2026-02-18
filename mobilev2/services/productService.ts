import { executeSql, Product, Inventory, Sale, SaleItem } from './database';
import { productsApi, inventoryApi, salesApi } from './api';
import { authStorage } from './authStorage';
import { syncEngine } from './sync/SyncEngine';
import { localizationService } from '../utils/localization';
import cuid from 'cuid';

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
   * Search products by name or barcode
   */
  searchProducts: async (query: string): Promise<(Product & { quantity: number })[]> => {
    const sql = `
      SELECT p.*, i.quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.productId
      WHERE (p.name LIKE ? OR p.barcode LIKE ?) AND p.deleted = 0
      ORDER BY p.name ASC
      LIMIT 50;
    `;
    const searchPattern = `%${query}%`;
    const result = await executeSql(sql, [searchPattern, searchPattern]);
    return result.rows._array;
  },

  /**
   * Find a product by barcode
   */
  getProductByBarcode: async (
    barcode: string
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
   * Get a product by ID
   */
  getProductById: async (id: string): Promise<(Product & { quantity: number }) | null> => {
    const sql = `
      SELECT p.*, i.quantity
      FROM products p
      LEFT JOIN inventory i ON p.id = i.productId
      WHERE p.id = ? AND p.deleted = 0
      LIMIT 1;
    `;
    const result = await executeSql(sql, [id]);
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
        ]
      );

      await executeSql(
        `INSERT INTO inventory (id, productId, quantity, updatedAt, syncStatus)
             VALUES (?, ?, ?, ?, 'pending')`,
        [inventoryId, productId, data.quantity, now]
      );

      await syncEngine.recordAction('CREATE', 'Product', productId, {
        name: data.name,
        barcode: data.barcode,
        category: data.category,
        sellingPrice: data.sellingPrice,
        purchasePrice: data.purchasePrice,
      });

      if (data.quantity !== 0) {
        await syncEngine.recordAction('ADJUST_STOCK', 'Product', productId, {
          delta: data.quantity,
        });
      }

      return productId;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  /**
   * Update an existing product
   */
  updateProduct: async (
    id: string,
    data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'syncStatus'>>
  ): Promise<void> => {
    const now = getCurrentTimestamp();
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.barcode !== undefined) {
      updates.push('barcode = ?');
      params.push(data.barcode);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }
    if (data.sellingPrice !== undefined) {
      updates.push('sellingPrice = ?');
      params.push(data.sellingPrice);
    }
    if (data.purchasePrice !== undefined) {
      updates.push('purchasePrice = ?');
      params.push(data.purchasePrice);
    }

    if (updates.length === 0) return;

    updates.push('updatedAt = ?');
    params.push(now);
    updates.push('syncStatus = ?');
    params.push('pending');

    params.push(id);

    const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    await executeSql(sql, params);

    await syncEngine.recordAction('UPDATE', 'Product', id, data);
  },

  /**
   * Update inventory quantity for a product
   */
  updateInventory: async (productId: string, newQuantity: number): Promise<void> => {
    const now = getCurrentTimestamp();
    // Check if inventory record exists
    const check = await executeSql('SELECT id, quantity FROM inventory WHERE productId = ?', [
      productId,
    ]);

    let delta = newQuantity;

    if (check.rows.length > 0) {
      const currentQty = check.rows.item(0).quantity;
      delta = newQuantity - currentQty;

      await executeSql(
        `UPDATE inventory SET quantity = ?, updatedAt = ?, syncStatus = 'pending' WHERE productId = ?`,
        [newQuantity, now, productId]
      );
    } else {
      const inventoryId = generateId();
      await executeSql(
        `INSERT INTO inventory (id, productId, quantity, updatedAt, syncStatus)
             VALUES (?, ?, ?, ?, 'pending')`,
        [inventoryId, productId, newQuantity, now]
      );
    }

    if (delta !== 0) {
      await syncEngine.recordAction('ADJUST_STOCK', 'Product', productId, {
        delta,
      });
    }
  },

  /**
   * Process a sale: create sale record, create sale items, update inventory
   */
  processSale: async (
    items: { productId: string; quantity: number; price: number }[]
  ): Promise<string> => {
    const saleId = generateId();
    const now = getCurrentTimestamp();
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      // 1. Create Sale
      await executeSql(
        `INSERT INTO sales (id, totalAmount, createdAt, syncStatus) VALUES (?, ?, ?, 'pending')`,
        [saleId, totalAmount, now]
      );

      // 2. Process items
      for (const item of items) {
        const itemId = generateId();
        // Create Sale Item
        await executeSql(
          `INSERT INTO sale_items (id, saleId, productId, quantity, priceAtSale)
                 VALUES (?, ?, ?, ?, ?)`,
          [itemId, saleId, item.productId, item.quantity, item.price]
        );

        // Update Inventory (decrement)
        await executeSql(
          `UPDATE inventory
                 SET quantity = quantity - ?, updatedAt = ?, syncStatus = 'pending'
                 WHERE productId = ?`,
          [item.quantity, now, item.productId]
        );
      }

      await syncEngine.recordAction('CREATE_SALE', 'Sale', saleId, {
        totalAmount,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          priceAtSale: i.price,
        })),
      });

      return saleId;
    } catch (error) {
      console.error('Error processing sale:', error);
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
      [now, productId]
    );

    await syncEngine.recordAction('DELETE', 'Product', productId, {});
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    const today = new Date().toISOString().split('T')[0];

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

  /**
   * Get all sales history
   */
  getAllSales: async () => {
    const sql = `
      SELECT
        s.id,
        s.totalAmount,
        s.createdAt,
        (SELECT p.name FROM sale_items si JOIN products p ON si.productId = p.id WHERE si.saleId = s.id LIMIT 1) as title,
        (SELECT COUNT(*) FROM sale_items si WHERE si.saleId = s.id) as itemCount
      FROM sales s
      ORDER BY s.createdAt DESC
    `;
    const result = await executeSql(sql);
    return result.rows._array;
  },

  /**
   * Get a sale by ID with its items
   */
  getSaleById: async (saleId: string) => {
    const saleSql = `SELECT * FROM sales WHERE id = ? LIMIT 1`;
    const saleRes = await executeSql(saleSql, [saleId]);
    if (saleRes.rows.length === 0) return null;

    const sale = saleRes.rows.item(0);

    const itemsSql = `
      SELECT si.*, p.name as title, p.category
      FROM sale_items si
      JOIN products p ON si.productId = p.id
      WHERE si.saleId = ?
    `;
    const itemsRes = await executeSql(itemsSql, [saleId]);

    return {
      ...sale,
      items: itemsRes.rows._array,
    };
  },

  /**
   * Get sales history for a specific product
   */
  getProductSales: async (productId: string) => {
    const sql = `
      SELECT
        s.id as saleId,
        s.createdAt,
        si.quantity,
        si.priceAtSale
      FROM sale_items si
      JOIN sales s ON si.saleId = s.id
      WHERE si.productId = ?
      ORDER BY s.createdAt DESC
    `;
    const result = await executeSql(sql, [productId]);
    return result.rows._array;
  },

  /**
   * Get all product categories
   */
  getCategories: async (): Promise<string[]> => {
    const token = await authStorage.getToken();
    if (!token) throw new Error('Not authenticated');
    return productsApi.getCategories(token);
  },

  /**
   * Get all product categories from local database
   */
  getLocalCategories: async (): Promise<string[]> => {
    const sql = `SELECT DISTINCT category FROM products WHERE deleted = 0 AND category IS NOT NULL AND category != '' ORDER BY category ASC`;
    const result = await executeSql(sql);
    return result.rows._array.map((row) => row.category);
  },

  /**
   * Get revenue per category
   */
  getCategoryRevenues: async (
    range: 'month' | 'ytd' = 'month'
  ): Promise<{ category: string; totalRevenue: number }[]> => {
    const startDate = new Date();

    if (range === 'month') {
      startDate.setDate(1); // First day of current month
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setMonth(0, 1); // First day of current year
      startDate.setHours(0, 0, 0, 0);
    }
    const startDateStr = startDate.toISOString();

    const sql = `
     SELECT p.category, SUM(si.quantity * si.priceAtSale) as totalRevenue
     FROM sale_items si
     JOIN products p ON si.productId = p.id
     JOIN sales s ON si.saleId = s.id
     WHERE s.createdAt >= ? AND p.category IS NOT NULL AND p.category != ''
     GROUP BY p.category
     ORDER BY totalRevenue DESC
   `;
    const result = await executeSql(sql, [startDateStr]);
    return result.rows._array;
  },

  /**
   * Recommend a category for a product
   */
  recommendCategory: async (name: string): Promise<{ category: string }> => {
    const token = await authStorage.getToken();
    if (!token) throw new Error('Not authenticated');
    return productsApi.recommendCategory(name, token);
  },

  /**
   * Get report statistics
   */
  getReportStats: async (range: 'month' | 'ytd' = 'month') => {
    const startDate = new Date();

    if (range === 'month') {
      startDate.setDate(1); // First day of current month
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setMonth(0, 1); // First day of current year
      startDate.setHours(0, 0, 0, 0);
    }
    const startDateStr = startDate.toISOString();

    // 1. Fastest Moving Products
    const fastestSql = `
      SELECT p.name, SUM(si.quantity) as totalQuantity, SUM(si.quantity * si.priceAtSale) as totalRevenue
      FROM sale_items si
      JOIN products p ON si.productId = p.id
      JOIN sales s ON si.saleId = s.id
      WHERE s.createdAt >= ?
      GROUP BY p.id
      ORDER BY totalQuantity DESC
      LIMIT 5
    `;
    const fastestRes = await executeSql(fastestSql, [startDateStr]);

    // 2. Slowest Moving Products
    const slowestSql = `
        SELECT p.name, COALESCE(SUM(sub.quantity), 0) as totalQuantity
        FROM products p
        LEFT JOIN (
            SELECT si.productId, si.quantity
            FROM sale_items si
            JOIN sales s ON si.saleId = s.id
            WHERE s.createdAt >= ?
        ) sub ON p.id = sub.productId
        WHERE p.deleted = 0
        GROUP BY p.id
        ORDER BY totalQuantity ASC
        LIMIT 5
    `;
    const slowestRes = await executeSql(slowestSql, [startDateStr]);

    // 3. Most Profitable Day of Week
    const profitableDaySql = `
      SELECT strftime('%w', createdAt) as dayOfWeek, SUM(totalAmount) as totalSales
      FROM sales
      WHERE createdAt >= ?
      GROUP BY dayOfWeek
      ORDER BY totalSales DESC
      LIMIT 1
    `;
    const profitableDayRes = await executeSql(profitableDaySql, [startDateStr]);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestDay = 'N/A';
    let bestDayTotal = 0;

    if (profitableDayRes.rows.length > 0) {
      const dayIndex = parseInt(profitableDayRes.rows.item(0).dayOfWeek);
      if (!isNaN(dayIndex)) {
        bestDay = days[dayIndex];
        bestDayTotal = profitableDayRes.rows.item(0).totalSales;
      }
    }

    return {
      fastestMoving: fastestRes.rows._array,
      slowestMoving: slowestRes.rows._array,
      mostProfitableDay: { day: bestDay, total: bestDayTotal },
    };
  },

  /**
   * Get business insights from the backend
   */
  getBusinessInsights: async () => {
    const token = await authStorage.getToken();
    if (!token) throw new Error('Not authenticated');
    const lang = localizationService.getCurrentLanguage() || 'en';
    return salesApi.getInsights(token, lang);
  },
};
