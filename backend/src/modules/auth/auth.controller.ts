import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";
import { sendSuccess } from "../../utils/responses.js";
import { AuthRequest } from "../../middlewares/auth.js";

export const requestOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      throw { statusCode: 400, message: "Phone number is required" };
    }
    const result = await authService.requestOtp(phoneNumber);
    sendSuccess(res, result, "OTP sent successfully");
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phoneNumber, code, shopName } = req.body;
    if (!phoneNumber || !code) {
      throw {
        statusCode: 400,
        message: "Phone number and OTP code are required",
      };
    }
    const result = await authService.verifyOtp(phoneNumber, code, shopName);
    sendSuccess(res, result, "Authentication successful");
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const user = await authService.getUserProfile(userId);
    sendSuccess(res, user, "User profile retrieved");
  } catch (error) {
    next(error);
  }
};
