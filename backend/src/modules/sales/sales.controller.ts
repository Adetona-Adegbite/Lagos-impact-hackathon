import { Request, Response, NextFunction } from "express";
import * as salesService from "./sales.service.js";
import { sendSuccess } from "../../utils/responses.js";

export const checkout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { items } = req.body;
    const result = await salesService.processCheckout(items);
    sendSuccess(res, result, "Checkout successful", 201);
  } catch (error) {
    next(error);
  }
};

export const sync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sales } = req.body;
    const result = await salesService.syncSales(sales);
    sendSuccess(res, result, "Sales synced successfully");
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await salesService.getSales(page, limit);
    sendSuccess(res, result, "Sales retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await salesService.getSaleById(id);
    sendSuccess(res, result, "Sale details retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const getBusinessInsights = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await salesService.generateBusinessInsights();
    sendSuccess(res, result, "Business insights generated");
  } catch (error) {
    next(error);
  }
};
