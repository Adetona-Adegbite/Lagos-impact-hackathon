import * as SQLite from "expo-sqlite";

// Open the database (creates it if it doesn't exist)
// Note: In newer versions of Expo SDK, this might need adaptation if using the 'next' API.
// This uses the standard legacy API which is stable.
const db = SQLite.openDatabase("supamart.db");

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
 * Initialize database tables
 */
export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Products table
        tx.executeSql(
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
        tx.executeSql(
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
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY NOT NULL,
            totalAmount REAL NOT NULL,
            createdAt TEXT NOT NULL,
            syncStatus TEXT DEFAULT 'pending'
          );`,
        );

        // Sale Items table
        tx.executeSql(
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
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
          );`,
        );
      },
      (error) => {
        console.error("Failed to initialize database:", error);
        reject(error);
      },
      () => {
        console.log("Database initialized successfully");
        resolve();
      },
    );
  });
};

/**
 * Generic execute SQL wrapper for convenience
 */
export const executeSql = (
  sql: string,
  params: (string | number | null)[] = [],
): Promise<SQLite.SQLResultSet> => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        sql,
        params,
        (_, result) => {
          resolve(result);
        },
        (_, error) => {
          console.error(`Error executing SQL: ${sql}`, error);
          reject(error);
          return false; // Stop transaction
        },
      );
    });
  });
};

/**
 * Drop all tables (useful for debugging or logout)
 */
export const clearDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql("DROP TABLE IF EXISTS sale_items;");
        tx.executeSql("DROP TABLE IF EXISTS sales;");
        tx.executeSql("DROP TABLE IF EXISTS inventory;");
        tx.executeSql("DROP TABLE IF EXISTS products;");
        tx.executeSql("DROP TABLE IF EXISTS settings;");
      },
      (error) => reject(error),
      () => resolve(),
    );
  });
};

export default db;
