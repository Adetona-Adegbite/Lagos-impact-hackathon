import cuid from "cuid";
import { executeSql } from "../database";
import { syncApi } from "../api";

// Types
export type OpType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "ADJUST_STOCK"
  | "CREATE_SALE";

export interface Operation {
  id: string; // clientOpId
  op_type: OpType;
  entity_type: string;
  entity_id: string;
  payload: any;
  created_at: number;
  synced: number; // 0 or 1
}

const SYNC_INTERVAL_MS = 60000; // 1 minute

export class SyncEngine {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private deviceId: string | null = null;

  // --- Initialization ---

  async initialize() {
    await this.getOrCreateDeviceId();
    this.startLoop();
  }

  private async getOrCreateDeviceId() {
    const res = await executeSql(
      "SELECT value FROM settings WHERE key = ?",
      ["deviceId"]
    );
    if (res.rows.length > 0) {
      this.deviceId = res.rows.item(0).value;
    } else {
      this.deviceId = cuid();
      await executeSql(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
        ["deviceId", this.deviceId]
      );
    }
    console.log("[SyncEngine] Device ID:", this.deviceId);
  }

  private async getToken(): Promise<string | null> {
    const result = await executeSql("SELECT value FROM settings WHERE key = ?", [
      "token",
    ]);
    if (result.rows.length > 0) {
      return result.rows.item(0).value;
    }
    return null;
  }

  // --- Public API ---

  async recordAction(
    opType: OpType,
    entityType: string,
    entityId: string,
    payload: any,
    baseVersion?: number
  ) {
    const clientOpId = cuid();
    const timestamp = Date.now();
    const payloadStr = JSON.stringify(payload);

    console.log(
      `[SyncEngine] Recording ${opType} on ${entityType}:${entityId}`
    );

    try {
      await executeSql(
        `INSERT INTO operations_queue
        (id, op_type, entity_type, entity_id, payload, created_at, synced)
        VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [clientOpId, opType, entityType, entityId, payloadStr, timestamp]
      );

      // Trigger sync immediately (fire and forget)
      // We don't await this so UI doesn't block
      this.triggerSync();
    } catch (error) {
      console.error("[SyncEngine] Failed to record action:", error);
      throw error;
    }
  }

  startLoop() {
    if (this.syncInterval) return;
    console.log("[SyncEngine] Starting sync loop");
    this.syncInterval = setInterval(() => {
      this.triggerSync();
    }, SYNC_INTERVAL_MS);
  }

  stopLoop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // --- Sync Logic ---

  async triggerSync() {
    if (this.isSyncing) return;

    // Ensure we have basics
    const token = await this.getToken();
    if (!token) {
      // console.log("[SyncEngine] No token, skipping sync");
      return;
    }
    if (!this.deviceId) await this.getOrCreateDeviceId();

    this.isSyncing = true;
    try {
      // 1. Push Phase
      await this.pushPhase(token);

      // 2. Pull Phase
      await this.pullPhase(token);
    } catch (error) {
      console.error("[SyncEngine] Sync failed:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushPhase(token: string) {
    // 1. Get unsynced ops
    const res = await executeSql(
      "SELECT * FROM operations_queue WHERE synced = 0 ORDER BY created_at ASC LIMIT 50"
    );

    if (res.rows.length === 0) return;

    // Map to API format
    const opsToPush = [];
    for (let i = 0; i < res.rows.length; i++) {
      const item = res.rows.item(i);
      opsToPush.push({
        clientOpId: item.id,
        opType: item.op_type,
        entityType: item.entity_type,
        entityId: item.entity_id,
        payload: JSON.parse(item.payload),
        timestamp: new Date(item.created_at).toISOString(),
        // baseVersion: optional
      });
    }

    console.log(`[SyncEngine] Pushing ${opsToPush.length} operations...`);

    try {
      const response = await syncApi.push(
        {
          deviceId: this.deviceId!,
          operations: opsToPush,
        },
        token
      );

      if (response.success) {
        // Mark successes as synced
        const successfulIds = response.data
          .filter((r: any) => r.status !== "failed")
          .map((r: any) => r.clientOpId);

        if (successfulIds.length > 0) {
          const placeholders = successfulIds.map(() => "?").join(",");
          await executeSql(
            `UPDATE operations_queue SET synced = 1 WHERE id IN (${placeholders})`,
            successfulIds
          );
          console.log(
            `[SyncEngine] Marked ${successfulIds.length} ops as synced`
          );
        }

        // Handle failures? (currently just retry next time)
      }
    } catch (error) {
      console.error("[SyncEngine] Push error:", error);
      throw error;
    }
  }

  private async pullPhase(token: string) {
    // 1. Get last sync timestamp
    let lastSync: string | undefined;
    const res = await executeSql(
      "SELECT value FROM settings WHERE key = ?",
      ["lastSyncTimestamp"]
    );
    if (res.rows.length > 0) {
      lastSync = res.rows.item(0).value;
    }

    console.log(`[SyncEngine] Pulling since ${lastSync || "beginning"}`);

    try {
      const response = await syncApi.pull(lastSync, token);

      if (response.success && response.data) {
        const { operations, lastSyncTimestamp } = response.data;

        if (operations && operations.length > 0) {
          console.log(
            `[SyncEngine] Applying ${operations.length} remote operations`
          );
          await this.applyRemoteOperations(operations);
        } else {
            console.log("[SyncEngine] No new operations");
        }

        // Update timestamp
        await executeSql(
          "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
          ["lastSyncTimestamp", lastSyncTimestamp]
        );
      }
    } catch (error) {
      console.error("[SyncEngine] Pull error:", error);
      throw error;
    }
  }

  private async applyRemoteOperations(operations: any[]) {
    // Process strictly in order
    for (const op of operations) {
      // Skip echo (operations we generated)
      if (op.deviceId === this.deviceId) {
        continue;
      }

      try {
        await this.applySingleOperation(op);
      } catch (e) {
        console.error(
          `[SyncEngine] Failed to apply remote op ${op.clientOpId}`,
          e
        );
        // Continue to next op? Yes, best effort.
      }
    }
  }

  private async applySingleOperation(op: any) {
    const payload =
      typeof op.payload === "string" ? JSON.parse(op.payload) : op.payload;

    switch (op.opType) {
      case "CREATE":
        if (op.entityType === "Product") {
          await executeSql(
            `INSERT OR REPLACE INTO products
              (id, name, barcode, category, sellingPrice, purchasePrice, createdAt, updatedAt, deleted, syncStatus)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')`,
            [
              op.entityId,
              payload.name,
              payload.barcode,
              payload.category,
              payload.sellingPrice,
              payload.purchasePrice,
              new Date().toISOString(), // createdAt fallback
              new Date().toISOString(), // updatedAt
              0, // deleted
            ]
          );
          // Initialize local inventory
          const invId = `inv_${op.entityId}`;
          await executeSql(
            `INSERT OR IGNORE INTO inventory (id, productId, quantity, updatedAt, syncStatus) VALUES (?, ?, 0, ?, 'synced')`,
            [invId, op.entityId, new Date().toISOString()]
          );
        }
        break;

      case "UPDATE":
        if (op.entityType === "Product") {
          // Construct dynamic update
          const fields = [];
          const values = [];
          for (const [key, value] of Object.entries(payload)) {
            // Safe-guard columns
            if (["id", "userId", "createdAt", "updatedAt"].includes(key)) continue;
            fields.push(`${key} = ?`);
            values.push(value);
          }

          fields.push("updatedAt = ?");
          values.push(new Date().toISOString());

          fields.push("syncStatus = 'synced'");

          values.push(op.entityId);

          if (fields.length > 2) {
            await executeSql(
              `UPDATE products SET ${fields.join(", ")} WHERE id = ?`,
              values
            );
          }
        }
        break;

      case "DELETE":
        if (op.entityType === "Product") {
          await executeSql(
            "UPDATE products SET deleted = 1, syncStatus = 'synced' WHERE id = ?",
            [op.entityId]
          );
        }
        break;

      case "ADJUST_STOCK":
        // Payload: { delta: number }
        if (payload.delta) {
          await executeSql(
            `UPDATE inventory SET quantity = quantity + ?, syncStatus = 'synced' WHERE productId = ?`,
            [payload.delta, op.entityId]
          );
        }
        break;

      case "CREATE_SALE":
        // Payload: { totalAmount, items: [...] }
        const createdAt = op.clientTimestamp || new Date().toISOString();

        await executeSql(
          `INSERT OR REPLACE INTO sales (id, totalAmount, createdAt, syncStatus) VALUES (?, ?, ?, 'synced')`,
          [op.entityId, payload.totalAmount, createdAt]
        );

        if (payload.items) {
          for (const item of payload.items) {
            const itemId = item.id || cuid();
            // Insert Item
            await executeSql(
              `INSERT INTO sale_items (id, saleId, productId, quantity, priceAtSale) VALUES (?, ?, ?, ?, ?)`,
              [
                itemId,
                op.entityId,
                item.productId,
                item.quantity,
                item.priceAtSale,
              ]
            );

            // Replicate Side-Effect: Decrement Stock
            await executeSql(
              `UPDATE inventory SET quantity = quantity - ?, syncStatus = 'synced' WHERE productId = ?`,
              [item.quantity, item.productId]
            );
          }
        }
        break;
    }
  }
}

export const syncEngine = new SyncEngine();
