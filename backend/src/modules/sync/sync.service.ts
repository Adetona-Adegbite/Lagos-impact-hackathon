import { Prisma } from "@prisma/client";
import prisma from "../../config/db.js";
import { PushSyncInput, OperationPayload } from "./sync.schema.js";

export class SyncService {
  /**
   * Process a batch of operations from a client device
   */
  static async processPush(userId: string, input: PushSyncInput) {
    const { deviceId, operations } = input;
    const results: {
      clientOpId: string;
      status: "applied" | "skipped" | "failed";
      error?: string;
    }[] = [];

    // Process each operation sequentially
    for (const op of operations) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1. Idempotency Check
          const existing = await tx.operation.findUnique({
            where: { clientOpId: op.clientOpId },
          });

          if (existing) {
            return { status: "skipped" as const };
          }

          // 2. Apply Operation to Domain Entities
          await this.applyOperation(tx, userId, op);

          // 3. Record Operation in Log
          await tx.operation.create({
            data: {
              clientOpId: op.clientOpId,
              userId,
              deviceId,
              entityType: op.entityType,
              entityId: op.entityId,
              opType: op.opType,
              payload: op.payload as Prisma.InputJsonValue,
              baseVersion: op.baseVersion,
              clientTimestamp: new Date(op.timestamp),
            },
          });

          return { status: "applied" as const };
        });

        results.push({ clientOpId: op.clientOpId, status: result.status });
      } catch (error: any) {
        console.error(`Failed to process operation ${op.clientOpId}:`, error);
        results.push({
          clientOpId: op.clientOpId,
          status: "failed",
          error: error.message || "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Retrieve operations that occurred after a specific timestamp
   */
  static async processPull(userId: string, since?: Date, limit: number = 100) {
    const where: Prisma.OperationWhereInput = {
      userId,
    };

    if (since) {
      where.createdAt = {
        gt: since,
      };
    }

    const operations = await prisma.operation.findMany({
      where,
      orderBy: {
        createdAt: "asc",
      },
      take: limit,
    });

    return {
      operations,
      lastSyncTimestamp:
        operations.length > 0
          ? operations[operations.length - 1].createdAt
          : since || new Date(),
    };
  }

  /**
   * Internal method to route operation to specific entity logic
   */
  private static async applyOperation(
    tx: Prisma.TransactionClient,
    userId: string,
    op: OperationPayload
  ) {
    switch (op.opType) {
      case "CREATE":
        await this.handleCreate(tx, userId, op);
        break;
      case "UPDATE":
        await this.handleUpdate(tx, userId, op);
        break;
      case "DELETE":
        await this.handleDelete(tx, userId, op);
        break;
      case "ADJUST_STOCK":
        await this.handleAdjustStock(tx, userId, op);
        break;
      case "CREATE_SALE":
        await this.handleCreateSale(tx, userId, op);
        break;
      default:
        throw new Error(`Unknown operation type: ${op.opType}`);
    }
  }

  // --- Entity Handlers ---

  private static async handleCreate(
    tx: Prisma.TransactionClient,
    userId: string,
    op: OperationPayload
  ) {
    const payload = op.payload as any;

    if (op.entityType === "Product") {
      await tx.product.create({
        data: {
          id: op.entityId,
          userId,
          name: payload.name,
          barcode: payload.barcode,
          category: payload.category,
          sellingPrice: payload.sellingPrice,
          purchasePrice: payload.purchasePrice,
          version: 1,
          deleted: false,
        },
      });

      // Initialize empty inventory for new product
      await tx.inventory.create({
        data: {
          productId: op.entityId,
          quantity: 0,
          version: 1,
        },
      });
    } else {
      throw new Error(`Create handler not implemented for ${op.entityType}`);
    }
  }

  private static async handleUpdate(
    tx: Prisma.TransactionClient,
    userId: string,
    op: OperationPayload
  ) {
    const payload = op.payload as any;

    if (op.entityType === "Product") {
      // Last-Write-Wins: Update fields and increment version
      // We explicitly exclude 'id', 'userId', 'createdAt' from payload updates for safety
      const {
        id,
        userId: uid,
        createdAt,
        updatedAt,
        version,
        ...updateData
      } = payload;

      await tx.product.update({
        where: { id: op.entityId, userId },
        data: {
          ...updateData,
          version: { increment: 1 },
        },
      });
    } else {
      throw new Error(`Update handler not implemented for ${op.entityType}`);
    }
  }

  private static async handleDelete(
    tx: Prisma.TransactionClient,
    userId: string,
    op: OperationPayload
  ) {
    if (op.entityType === "Product") {
      // Soft Delete
      await tx.product.update({
        where: { id: op.entityId, userId },
        data: {
          deleted: true,
          version: { increment: 1 },
        },
      });
    } else {
      throw new Error(`Delete handler not implemented for ${op.entityType}`);
    }
  }

  private static async handleAdjustStock(
    tx: Prisma.TransactionClient,
    userId: string,
    op: OperationPayload
  ) {
    // EntityId is expected to be productId
    const payload = op.payload as { delta: number };

    if (!payload.delta) return;

    await tx.inventory.update({
      where: { productId: op.entityId },
      data: {
        quantity: { increment: payload.delta },
        version: { increment: 1 },
      },
    });
  }

  private static async handleCreateSale(
    tx: Prisma.TransactionClient,
    userId: string,
    op: OperationPayload
  ) {
    const payload = op.payload as {
      totalAmount: number;
      items: Array<{
        id?: string;
        productId: string;
        quantity: number;
        priceAtSale: number;
      }>;
    };

    // 1. Create Sale Header
    const sale = await tx.sale.create({
      data: {
        id: op.entityId,
        userId,
        totalAmount: payload.totalAmount,
        // We use server time for 'createdAt' to maintain causal ordering on server,
        // but typically analytics might want the client timestamp.
        // For sync consistency, server time is safer for sorting.
      },
    });

    // 2. Create Items and Adjust Stock
    for (const item of payload.items) {
      await tx.saleItem.create({
        data: {
          id: item.id, // Optional: if client generates this ID
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
        },
      });

      // Decrement stock
      await tx.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          version: { increment: 1 },
        },
      });
    }
  }
}
