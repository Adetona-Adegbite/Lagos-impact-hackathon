import * as SQLite from "expo-sqlite";

// Open the database (creates it if it doesn't exist)
// This uses the new synchronous API available in Expo SDK 50+ (expo-sqlite v14+)
const db = SQLite.openDatabaseSync("supamartv3.db");

export type SyncStatus = "pending" | "synced" | "failed";

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  createdAt: string;
  updatedAt: string; // for sync tracking
  deleted: number; // 0 or 1, for soft deletes
  syncStatus: SyncStatus;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Sale {
  id: string;
  totalAmount: number;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  priceAtSale: number;
}

/**
 * Polyfill for legacy SQLResultSet interface to maintain compatibility with existing code.
 * The new expo-sqlite API returns different structures for writes (SQLiteRunResult) and reads (array).
 */
export interface SQLResultSet {
  insertId?: number;
  rowsAffected: number;
  rows: {
    length: number;
    item: (index: number) => any;
    _array: any[];
  };
}

/**
 * Initialize database tables
 */
export const initDatabase = async (): Promise<void> => {
  try {
    await db.withExclusiveTransactionAsync(async (tx) => {
      // Products table
      await tx.execAsync(
        `CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            barcode TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            sellingPrice REAL NOT NULL,
            purchasePrice REAL NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deleted INTEGER DEFAULT 0,
            syncStatus TEXT DEFAULT 'pending'
          );`,
      );

      // Inventory table
      await tx.execAsync(
        `CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY NOT NULL,
            productId TEXT UNIQUE NOT NULL,
            quantity INTEGER NOT NULL,
            updatedAt TEXT NOT NULL,
            syncStatus TEXT DEFAULT 'pending',
            FOREIGN KEY (productId) REFERENCES products (id)
          );`,
      );

      // Sales table
      await tx.execAsync(
        `CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY NOT NULL,
            totalAmount REAL NOT NULL,
            createdAt TEXT NOT NULL,
            syncStatus TEXT DEFAULT 'pending'
          );`,
      );

      // Sale Items table
      await tx.execAsync(
        `CREATE TABLE IF NOT EXISTS sale_items (
            id TEXT PRIMARY KEY NOT NULL,
            saleId TEXT NOT NULL,
            productId TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            priceAtSale REAL NOT NULL,
            FOREIGN KEY (saleId) REFERENCES sales (id),
            FOREIGN KEY (productId) REFERENCES products (id)
          );`,
      );

      // Settings table
      await tx.execAsync(
        `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
          );`,
      );
    });
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
};

/**
 * Generic execute SQL wrapper for convenience.
 * Mimics the legacy executeSql behavior but uses new expo-sqlite methods.
 */
export const executeSql = async (
  sql: string,
  params: (string | number | null)[] = [],
): Promise<SQLResultSet> => {
  // Simple heuristic to distinguish between reads (SELECT) and writes (INSERT, UPDATE, DELETE)
  const isSelect = sql.trim().toUpperCase().startsWith("SELECT");

  try {
    if (isSelect) {
      // For SELECT statements, use getAllAsync
      const result = await db.getAllAsync(sql, ...params);
      return {
        rowsAffected: 0,
        rows: {
          length: result.length,
          item: (index: number) => result[index],
          _array: result as any[],
        },
      };
    } else {
      // For INSERT, UPDATE, DELETE, use runAsync
      const result = await db.runAsync(sql, ...params);
      return {
        insertId: result.lastInsertRowId,
        rowsAffected: result.changes,
        rows: {
          length: 0,
          item: (index: number) => null,
          _array: [],
        },
      };
    }
  } catch (error) {
    console.error(`Error executing SQL: ${sql}`, error);
    throw error;
  }
};

/**
 * Drop all tables (useful for debugging or logout)
 */
export const clearDatabase = async (): Promise<void> => {
  try {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.runAsync("DROP TABLE IF EXISTS sale_items;");
      await tx.runAsync("DROP TABLE IF EXISTS sales;");
      await tx.runAsync("DROP TABLE IF EXISTS inventory;");
      await tx.runAsync("DROP TABLE IF EXISTS products;");
      await tx.runAsync("DROP TABLE IF EXISTS settings;");
    });
  } catch (error) {
    console.error("Failed to clear database:", error);
    throw error;
  }
};

export default db;
