import { Router } from "express";
import { z } from "zod";
import * as productController from "./product.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate, idSchema } from "../../utils/validators.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

const createProductSchema = z.object({
  body: z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    barcode: z.string().min(1, "Barcode is required"),
    category: z.string().min(1, "Category is required"),
    sellingPrice: z.number().positive("Selling price must be positive"),
    purchasePrice: z.number().positive("Purchase price must be positive"),
  }),
});

const updateProductSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid ID format"),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    sellingPrice: z.number().positive().optional(),
    purchasePrice: z.number().positive().optional(),
  }),
});

// All product routes are protected
router.use(authenticate);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - barcode
 *               - category
 *               - sellingPrice
 *               - purchasePrice
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               barcode:
 *                 type: string
 *               category:
 *                 type: string
 *               sellingPrice:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error or duplicate barcode
 */
router.post("/", validate(createProductSchema), productController.create);
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/", productController.getAll);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/:id", validate(idSchema), productController.getOne);
/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               sellingPrice:
 *                 type: number
 *               purchasePrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.patch("/:id", validate(updateProductSchema), productController.update);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete("/:id", validate(idSchema), productController.remove);

export default router;
