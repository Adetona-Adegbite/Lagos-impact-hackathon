import { Router } from "express";
import { z } from "zod";
import * as inventoryController from "./inventory.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../utils/validators.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management
 */

const restockSchema = z.object({
  body: z.object({
    productId: z.string().cuid("Invalid Product ID"),
    quantity: z.number().int().positive("Quantity must be a positive integer"),
  }),
});

const lowStockSchema = z.object({
  query: z.object({
    threshold: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

router.use(authenticate);

/**
 * @swagger
 * /inventory/restock:
 *   post:
 *     summary: Restock a product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product restocked successfully
 *       404:
 *         description: Product not found
 */
router.post("/restock", validate(restockSchema), inventoryController.restock);

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get inventory list
 *     tags: [Inventory]
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
 *         description: Inventory list retrieved
 */
router.get("/", inventoryController.getAll);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Get low stock items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *         description: Stock threshold (default 10)
 *     responses:
 *       200:
 *         description: Low stock items retrieved
 */
router.get(
  "/low-stock",
  validate(lowStockSchema),
  inventoryController.getLowStock,
);

export default router;
