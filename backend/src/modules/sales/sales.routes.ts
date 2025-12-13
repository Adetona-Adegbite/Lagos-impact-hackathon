import { Router } from "express";
import { z } from "zod";
import * as salesController from "./sales.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate, idSchema } from "../../utils/validators.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales and checkout management
 */

const checkoutSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string().cuid("Invalid Product ID"),
          quantity: z
            .number()
            .int()
            .positive("Quantity must be a positive integer"),
        }),
      )
      .min(1, "Cart cannot be empty"),
  }),
});

const syncSalesSchema = z.object({
  body: z.object({
    sales: z.array(
      z.object({
        id: z.string().optional(),
        totalAmount: z.number(),
        createdAt: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.string(),
            quantity: z.number(),
            priceAtSale: z.number(),
          }),
        ),
      }),
    ),
  }),
});

router.use(authenticate);

/**
 * @swagger
 * /sales/sync:
 *   post:
 *     summary: Sync offline sales
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sales
 *             properties:
 *               sales:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     totalAmount:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                           quantity:
 *                             type: number
 *                           priceAtSale:
 *                             type: number
 *     responses:
 *       200:
 *         description: Sales synced successfully
 */
router.post("/sync", validate(syncSalesSchema), salesController.sync);

/**
 * @swagger
 * /sales/checkout:
 *   post:
 *     summary: Process checkout
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Checkout successful
 *       400:
 *         description: Validation error or insufficient stock
 */
router.post("/checkout", validate(checkoutSchema), salesController.checkout);

/**
 * @swagger
 * /sales/insights:
 *   get:
 *     summary: Get AI-powered business insights
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Insights generated
 */
router.get("/insights", salesController.getBusinessInsights);

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Get all sales history
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sales history retrieved
 */
router.get("/", salesController.getAll);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Get sale details by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sale details retrieved
 *       404:
 *         description: Sale not found
 */
router.get("/:id", validate(idSchema), salesController.getOne);

export default router;
