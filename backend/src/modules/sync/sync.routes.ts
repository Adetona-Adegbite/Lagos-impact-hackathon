import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { SyncController } from "./sync.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { PushSyncSchema, PullSyncSchema } from "./sync.schema.js";

const router = Router();

const validate =
  (schema: z.AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.errors });
    }
  };

router.post(
  "/push",
  authenticate,
  validate(PushSyncSchema),
  SyncController.push
);

router.get(
  "/pull",
  authenticate,
  validate(PullSyncSchema),
  SyncController.pull
);

export default router;
