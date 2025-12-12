import { Request, Response, NextFunction } from "express";
import * as productService from "./product.service.js";
import { sendSuccess } from "../../utils/responses.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as AuthRequest).user!.userId;
    const product = await productService.createProduct({ ...req.body, userId });
    sendSuccess(res, product, "Product created successfully", 201);
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
    const userId = (req as AuthRequest).user!.userId;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string;

    const result = await productService.getProducts(
      userId,
      page,
      limit,
      search,
    );
    sendSuccess(res, result, "Products retrieved successfully");
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
    const product = await productService.getProductById(id);
    sendSuccess(res, product, "Product retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id, req.body);
    sendSuccess(res, product, "Product updated successfully");
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id);
    sendSuccess(res, null, result.message);
  } catch (error) {
    next(error);
  }
};
