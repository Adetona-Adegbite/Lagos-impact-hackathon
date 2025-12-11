import { Request, Response, NextFunction } from "express";
import * as insightService from "./insight.service.js";
import { sendSuccess } from "../../utils/responses.js";

export const getTopSelling = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await insightService.getTopSelling();
    sendSuccess(res, result, "Top selling insights retrieved");
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await insightService.getLowStockInsights();
    sendSuccess(res, result, "Low stock insights retrieved");
  } catch (error) {
    next(error);
  }
};

export const getTrends = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await insightService.getTrends();
    sendSuccess(res, result, "Sales trends retrieved");
  } catch (error) {
    next(error);
  }
};

export const getRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await insightService.getRecommendations();
    sendSuccess(res, result, "AI recommendations retrieved");
  } catch (error) {
    next(error);
  }
};
