import { Request, Response, NextFunction } from 'express';
import * as inventoryService from './inventory.service.js';
import { sendSuccess } from '../../utils/responses.js';

export const restock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const result = await inventoryService.restockProduct(productId, quantity);
    sendSuccess(res, result, 'Product restocked successfully');
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await inventoryService.getInventory(page, limit);
    sendSuccess(res, result, 'Inventory retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 10;
    const result = await inventoryService.getLowStock(threshold);
    sendSuccess(res, result, 'Low stock items retrieved successfully');
  } catch (error) {
    next(error);
  }
};
