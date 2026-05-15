import { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service.js";
import { sendSuccess } from "../../utils/responses.js";
import { AuthRequest } from "../../middlewares/auth.js";
import { verifyWebhookSignature } from "./squad.service.js";

export const getMyPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const payments = await paymentsService.getUserPayments(userId);
    sendSuccess(res, payments, "Payments retrieved");
  } catch (error) {
    next(error);
  }
};

export const getUnlinkedPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const payments = await paymentsService.getUnlinkedPayments(userId);
    sendSuccess(res, payments, "Unlinked payments retrieved");
  } catch (error) {
    next(error);
  }
};

export const getSalesMatch = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const amount = parseFloat(req.query.amount as string);
    if (isNaN(amount)) {
      throw { statusCode: 400, message: "Valid amount is required" };
    }
    const sales = await paymentsService.getSalesMatchingAmount(userId, amount);
    sendSuccess(res, sales, "Matching sales retrieved");
  } catch (error) {
    next(error);
  }
};

export const linkPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { saleId } = req.body;
    if (!saleId) {
      throw { statusCode: 400, message: "saleId is required" };
    }
    const result = await paymentsService.linkPaymentToSale(id, saleId, userId);
    sendSuccess(res, result, "Payment linked to sale");
  } catch (error) {
    next(error);
  }
};

export const simulatePayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { amount, virtualAccountNumber } = req.body;

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      throw { statusCode: 400, message: "Valid positive amount is required" };
    }

    const result = await paymentsService.simulatePayment(
      userId,
      amount,
      virtualAccountNumber,
    );
    sendSuccess(res, result, "Payment simulated successfully");
  } catch (error) {
    next(error);
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const signature = req.headers["x-squad-signature"] as string | undefined;
    const payload = JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      console.warn("Invalid webhook signature received");
    }

    const body = req.body;

    // Regular Virtual Account webhook
    if (
      body.virtual_account_number &&
      body.transaction_reference &&
      body.customer_identifier
    ) {
      await paymentsService.processWebhookPayment({
        transaction_reference: body.transaction_reference,
        virtual_account_number: body.virtual_account_number,
        principal_amount: body.principal_amount,
        settled_amount: body.settled_amount,
        fee_charged: body.fee_charged,
        customer_identifier: body.customer_identifier,
        sender_name: body.sender_name,
        remarks: body.remarks,
        currency: body.currency,
        transaction_date: body.transaction_date,
      });
    }

    // Card / bank transfer webhook (charge_successful)
    else if (body.Event === "charge_successful" && body.Body) {
      const tx = body.Body;
      // These don't have virtual accounts, but we could handle them if needed
      console.log("Card/Bank charge webhook:", tx.transaction_ref);
    }

    res.status(200).json({
      response_code: 200,
      response_description: "Success",
    });
  } catch (error) {
    next(error);
  }
};
