import { z } from "zod";

// --- Product Schemas ---

export const ProductBaseSchema = z.object({
  name: z.string(),
  barcode: z.string(),
  category: z.string(),
  sellingPrice: z.number(),
  purchasePrice: z.number(),
});

export const CreateProductSchema = ProductBaseSchema;

export const UpdateProductSchema = ProductBaseSchema.partial().extend({
  deleted: z.boolean().optional(),
});

// --- Inventory Schemas ---

export const AdjustStockSchema = z.object({
  delta: z.number(),
});

// --- Sale Schemas ---

export const SaleItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  quantity: z.number(),
  priceAtSale: z.number(),
});

export const CreateSaleSchema = z.object({
  id: z.string().optional(),
  totalAmount: z.number(),
  items: z.array(SaleItemSchema),
  createdAt: z.string().datetime().optional(),
});

// --- Types ---

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;
export type SaleItemInput = z.infer<typeof SaleItemSchema>;
export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;

export const OpTypeSchema = z.enum([
  "CREATE",
  "UPDATE",
  "DELETE",
  "ADJUST_STOCK",
  "CREATE_SALE",
]);

// --- Payload Schemas ---

export const CreateProductPayloadSchema = CreateProductSchema;
export const UpdateProductPayloadSchema = UpdateProductSchema;
export const AdjustStockPayloadSchema = AdjustStockSchema;
export const CreateSalePayloadSchema = CreateSaleSchema;

// --- Operation Schemas ---

const BaseOperationSchema = z.object({
  clientOpId: z.string(),
  entityId: z.string(),
  baseVersion: z.number().optional(),
  timestamp: z.string().datetime(), // Client-side timestamp
});

export const CreateProductOperationSchema = BaseOperationSchema.extend({
  opType: z.literal("CREATE"),
  entityType: z.literal("Product"),
  payload: CreateProductPayloadSchema,
});

export const UpdateProductOperationSchema = BaseOperationSchema.extend({
  opType: z.literal("UPDATE"),
  entityType: z.literal("Product"),
  payload: UpdateProductPayloadSchema,
});

export const DeleteProductOperationSchema = BaseOperationSchema.extend({
  opType: z.literal("DELETE"),
  entityType: z.literal("Product"),
  payload: z.record(z.unknown()).optional(),
});

export const AdjustStockOperationSchema = BaseOperationSchema.extend({
  opType: z.literal("ADJUST_STOCK"),
  entityType: z.string(), // "Product" or "Inventory"
  payload: AdjustStockPayloadSchema,
});

export const CreateSaleOperationSchema = BaseOperationSchema.extend({
  opType: z.literal("CREATE_SALE"),
  entityType: z.literal("Sale"),
  payload: CreateSalePayloadSchema,
});

// Discriminated Union
export const OperationPayloadSchema = z.discriminatedUnion("opType", [
  CreateProductOperationSchema,
  UpdateProductOperationSchema,
  DeleteProductOperationSchema,
  AdjustStockOperationSchema,
  CreateSaleOperationSchema,
]);

export const PushSyncSchema = z.object({
  body: z.object({
    deviceId: z.string(),
    operations: z.array(OperationPayloadSchema),
  }),
});

export const PullSyncSchema = z.object({
  query: z.object({
    since: z.string().datetime().optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

// Export types
export type OperationPayload = z.infer<typeof OperationPayloadSchema>;
export type PushSyncInput = z.infer<typeof PushSyncSchema>["body"];
export type PullSyncQuery = z.infer<typeof PullSyncSchema>["query"];

export type CreateProductOperation = z.infer<
  typeof CreateProductOperationSchema
>;
export type UpdateProductOperation = z.infer<
  typeof UpdateProductOperationSchema
>;
export type DeleteProductOperation = z.infer<
  typeof DeleteProductOperationSchema
>;
export type AdjustStockOperation = z.infer<typeof AdjustStockOperationSchema>;
export type CreateSaleOperation = z.infer<typeof CreateSaleOperationSchema>;

export type CreateProductPayload = z.infer<typeof CreateProductPayloadSchema>;
export type UpdateProductPayload = z.infer<typeof UpdateProductPayloadSchema>;
export type AdjustStockPayload = z.infer<typeof AdjustStockPayloadSchema>;
export type CreateSalePayload = z.infer<typeof CreateSalePayloadSchema>;
