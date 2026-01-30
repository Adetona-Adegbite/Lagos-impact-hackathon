import { z } from "zod";

export const OpTypeSchema = z.enum([
  "CREATE",
  "UPDATE",
  "DELETE",
  "ADJUST_STOCK",
  "CREATE_SALE",
]);

export const OperationPayloadSchema = z.object({
  clientOpId: z.string(),
  opType: OpTypeSchema,
  entityType: z.string(),
  entityId: z.string(),
  payload: z.record(z.any()),
  baseVersion: z.number().optional(),
  timestamp: z.string().datetime(), // Client-side timestamp
});

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

export type OperationPayload = z.infer<typeof OperationPayloadSchema>;
export type PushSyncInput = z.infer<typeof PushSyncSchema>["body"];
export type PullSyncQuery = z.infer<typeof PullSyncSchema>["query"];
