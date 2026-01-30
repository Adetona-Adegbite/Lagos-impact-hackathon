import { Request, Response, NextFunction } from "express";
import { SyncService } from "./sync.service.js";
import { PushSyncInput, PullSyncQuery } from "./sync.schema.js";

export class SyncController {
  static async push(
    req: Request<{}, {}, PushSyncInput>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // @ts-ignore - User is attached by auth middleware
      const userId = req.user.userId;

      const result = await SyncService.processPush(userId, req.body);

      res.status(200).json({
        success: true,
        message: "Sync push processed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async pull(
    req: Request<{}, {}, {}, PullSyncQuery>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // @ts-ignore - User is attached by auth middleware
      const userId = req.user.userId;
      const { since, limit } = req.query;

      const result = await SyncService.processPull(
        userId,
        since ? new Date(since) : undefined,
        limit,
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
