import { Router } from "express";
import { z } from "zod";
import * as paymentsController from "./payments.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../utils/validators.js";

const router = Router();

const linkPaymentSchema = z.object({
  body: z.object({
    saleId: z.string().min(1, "saleId is required"),
  }),
});

const simulatePaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive("Amount must be a positive number"),
    virtualAccountNumber: z.string().optional(),
  }),
});

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment and virtual account management
 */

// Public webhook endpoint (no auth)
router.post("/webhook", paymentsController.handleWebhook);

// Protected routes
router.use(authenticate);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Get all payments for the authenticated user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payments retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/", paymentsController.getMyPayments);

/**
 * @swagger
 * /payments/unlinked:
 *   get:
 *     summary: Get payments not linked to any sale
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unlinked payments retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/unlinked", paymentsController.getUnlinkedPayments);

/**
 * @swagger
 * /payments/sales-match:
 *   get:
 *     summary: Get sales that match a payment amount
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *         required: true
 *         description: Payment amount to match
 *     responses:
 *       200:
 *         description: Matching sales retrieved
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Unauthorized
 */
router.get("/sales-match", paymentsController.getSalesMatch);

/**
 * @swagger
 * /payments/{id}/link:
 *   post:
 *     summary: Link a payment to a specific sale
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saleId
 *             properties:
 *               saleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment linked to sale
 *       400:
 *         description: Already linked or invalid request
 *       404:
 *         description: Payment or sale not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/:id/link",
  validate(linkPaymentSchema),
  paymentsController.linkPayment,
);

/**
 * @swagger
 * /payments/simulate:
 *   post:
 *     summary: Simulate a payment transfer (sandbox only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount to simulate (NGN)
 *               virtualAccountNumber:
 *                 type: string
 *                 description: Optional VA number (defaults to user's VA)
 *     responses:
 *       200:
 *         description: Payment simulated successfully
 *       400:
 *         description: Invalid amount
 *       403:
 *         description: Not available in production
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/simulate",
  validate(simulatePaymentSchema),
  paymentsController.simulatePayment,
);

export default router;
