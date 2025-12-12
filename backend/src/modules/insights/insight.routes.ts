import { Router } from "express";
import * as insightController from "./insight.controller.js";
import { authenticate } from "../../middlewares/auth.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Insights
 *   description: AI-powered insights and analytics
 */

router.use(authenticate);

/**
 * @swagger
 * /insights/top-selling:
 *   get:
 *     summary: Get top selling products
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top selling products retrieved
 */
router.get("/top-selling", insightController.getTopSelling);

/**
 * @swagger
 * /insights/low-stock:
 *   get:
 *     summary: Get low stock predictions
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock predictions retrieved
 */
router.get("/low-stock", insightController.getLowStock);

/**
 * @swagger
 * /insights/trends:
 *   get:
 *     summary: Get sales trends
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sales trends retrieved
 */
router.get("/trends", insightController.getTrends);

/**
 * @swagger
 * /insights/recommendations:
 *   get:
 *     summary: Get AI recommendations
 *     tags: [Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI recommendations retrieved
 */
router.get("/recommendations", insightController.getRecommendations);

export default router;
