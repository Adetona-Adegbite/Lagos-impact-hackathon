import { executeSql } from "./database";
import { productsApi, inventoryApi, salesApi } from "./api";

// Helper to get token
const getToken = async (): Promise<string | null> => {
  const result = await executeSql("SELECT value FROM settings WHERE key = ?", [
    "token",
  ]);
  if (result.rows.length > 0) {
    return result.rows.item(0).value;
  }
  return null;
};

export const SyncService = {
  /**
   * Push pending sales to the server
   */
  syncSalesUp: async () => {
    const token = await getToken();
    if (!token) {
      console.warn("[Sync] No token found, skipping syncSalesUp");
      return;
    }

    // 1. Get pending sales
    const salesResult = await executeSql(
      "SELECT * FROM sales WHERE syncStatus = 'pending'",
    );

    if (salesResult.rows.length === 0) return;

    const sales = [];
    for (let i = 0; i < salesResult.rows.length; i++) {
      const sale = salesResult.rows.item(i);

      // Get items for this sale
      const itemsResult = await executeSql(
        "SELECT * FROM sale_items WHERE saleId = ?",
        [sale.id],
      );

      const items = [];
      for (let j = 0; j < itemsResult.rows.length; j++) {
        const item = itemsResult.rows.item(j);
        items.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
        });
      }

      sales.push({
        id: sale.id,
        totalAmount: sale.totalAmount,
        createdAt: sale.createdAt,
        items,
      });
    }

    // 2. Send to backend
    console.log(`[Sync] Uploading ${sales.length} pending sales...`);
    const response = await salesApi.sync(sales, token);

    // 3. Mark successful ones as synced
    if (response.results) {
      for (const res of response.results) {
        if (res.status === "synced" || res.status === "already_synced") {
          await executeSql(
            "UPDATE sales SET syncStatus = 'synced' WHERE id = ?",
            [res.id],
          );
        }
      }
    }
  },

  /**
   * Push locally created products to server
   */
  syncProductsUp: async () => {
    const token = await getToken();
    if (!token) return;

    const result = await executeSql(
      "SELECT * FROM products WHERE syncStatus = 'pending'",
    );

    if (result.rows.length > 0) {
      console.log(`[Sync] Uploading ${result.rows.length} pending products...`);
    }

    for (let i = 0; i < result.rows.length; i++) {
      const product = result.rows.item(i);

      try {
        await productsApi.create(
          {
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            category: product.category,
            sellingPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
          },
          token,
        );

        await executeSql(
          "UPDATE products SET syncStatus = 'synced' WHERE id = ?",
          [product.id],
        );
      } catch (e: any) {
        if (e.status === 409) {
          // Product already exists on server, mark as synced
          console.warn(
            `Product ${product.id} already exists on server. Marking as synced.`,
          );
          await executeSql(
            "UPDATE products SET syncStatus = 'synced' WHERE id = ?",
            [product.id],
          );
        } else {
          console.error("Failed to sync product", product.id, e);
          // Continue to next product
        }
      }
    }
  },

  /**
   * Push local inventory updates to the server
   */
  syncInventoryUp: async () => {
    const token = await getToken();
    if (!token) return;

    const result = await executeSql(
      "SELECT productId, quantity FROM inventory WHERE syncStatus = 'pending'",
    );

    if (result.rows.length > 0) {
      console.log(
        `[Sync] Uploading ${result.rows.length} pending inventory updates...`,
      );
    }

    for (let i = 0; i < result.rows.length; i++) {
      const item = result.rows.item(i);
      try {
        // Assuming an API to set the quantity for a product.
        await inventoryApi.update(
          {
            productId: item.productId,
            quantity: item.quantity,
          },
          token,
        );

        await executeSql(
          "UPDATE inventory SET syncStatus = 'synced' WHERE productId = ?",
          [item.productId],
        );
      } catch (e) {
        console.error(
          "Failed to sync inventory for product",
          item.productId,
          e,
        );
        // Continue to next item
      }
    }
  },

  /**
   * Download latest products and inventory from server
   */
  syncProductsDown: async () => {
    const token = await getToken();
    if (!token) return;

    // Fetch all products
    // TODO: implement pagination loop if total > limit
    const response = await productsApi.getAll(token, 1, 1000);
    const products = response.items || [];

    console.log(`[Sync] Downloaded ${products.length} products`);

    await executeSql("BEGIN TRANSACTION");
    try {
      for (const p of products) {
        // Check local status
        const local = await executeSql(
          "SELECT syncStatus FROM products WHERE id = ?",
          [p.id],
        );
        if (
          local.rows.length > 0 &&
          local.rows.item(0).syncStatus === "pending"
        ) {
          // Local changes pending, skip overwrite
          continue;
        }

        // Insert or Replace Product
        await executeSql(
          `INSERT OR REPLACE INTO products (id, name, barcode, category, sellingPrice, purchasePrice, createdAt, updatedAt, deleted, syncStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'synced')`,
          [
            p.id,
            p.name,
            p.barcode,
            p.category,
            p.sellingPrice,
            p.purchasePrice,
            p.createdAt,
            new Date().toISOString(), // updatedAt
          ],
        );

        // Upsert Inventory
        if (p.inventory) {
          const existInv = await executeSql(
            "SELECT id FROM inventory WHERE productId = ?",
            [p.id],
          );
          if (existInv.rows.length > 0) {
            await executeSql(
              "UPDATE inventory SET quantity = ?, syncStatus = 'synced', updatedAt = ? WHERE productId = ?",
              [p.inventory.quantity, new Date().toISOString(), p.id],
            );
          } else {
            // Create a deterministic ID for local inventory record if needed
            const invId = `inv_${p.id}`;
            await executeSql(
              "INSERT INTO inventory (id, productId, quantity, updatedAt, syncStatus) VALUES (?, ?, ?, ?, 'synced')",
              [invId, p.id, p.inventory.quantity, new Date().toISOString()],
            );
          }
        }
      }
      await executeSql("COMMIT");
    } catch (e) {
      await executeSql("ROLLBACK");
      throw e;
    }
  },

  /**
   * Download latest sales from server
   */
  syncSalesDown: async () => {
    const token = await getToken();
    if (!token) return;

    // Fetch all sales
    const response = await salesApi.getAll(token, 1, 1000);
    const sales = response.items || [];

    console.log(`[Sync] Downloaded ${sales.length} sales`);

    await executeSql("BEGIN TRANSACTION");
    try {
      for (const s of sales) {
        // Check local status
        const local = await executeSql(
          "SELECT syncStatus FROM sales WHERE id = ?",
          [s.id],
        );
        if (
          local.rows.length > 0 &&
          local.rows.item(0).syncStatus === "pending"
        ) {
          // Local changes pending, skip overwrite
          continue;
        }

        // Insert or Replace Sale
        await executeSql(
          `INSERT OR REPLACE INTO sales (id, totalAmount, createdAt, syncStatus)
           VALUES (?, ?, ?, 'synced')`,
          [s.id, s.totalAmount, s.createdAt],
        );

        // Handle items
        await executeSql("DELETE FROM sale_items WHERE saleId = ?", [s.id]);

        if (s.items) {
          for (const item of s.items) {
            const itemId = item.id || `${s.id}_${item.productId}`;
            await executeSql(
              `INSERT INTO sale_items (id, saleId, productId, quantity, priceAtSale)
               VALUES (?, ?, ?, ?, ?)`,
              [itemId, s.id, item.productId, item.quantity, item.priceAtSale],
            );
          }
        }
      }
      await executeSql("COMMIT");
    } catch (e) {
      await executeSql("ROLLBACK");
      throw e;
    }
  },

  syncUp: async () => {
    await SyncService.syncProductsUp();
    await SyncService.syncSalesUp();
    await SyncService.syncInventoryUp();
  },

  syncDown: async () => {
    await SyncService.syncProductsDown();
    await SyncService.syncSalesDown();
  },

  syncAll: async () => {
    // console.log("Starting sync...");
    try {
      await SyncService.syncUp();
      await SyncService.syncDown();
      // console.log("Sync completed.");
    } catch (e) {
      console.error("Sync failed:", e);
      throw e;
    }
  },
};
