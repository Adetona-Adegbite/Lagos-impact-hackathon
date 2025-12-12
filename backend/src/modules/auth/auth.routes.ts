import { Router } from "express";
import { z } from "zod";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middlewares/auth.js";
import { validate } from "../../utils/validators.js";

const router = Router();

const requestOtpSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .min(10, "Phone number must be at least 10 characters"),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(1, "Phone number is required"),
    code: z.string().length(6, "OTP code must be 6 digits"),
    shopName: z.string().optional(),
  }),
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User management
 */

/**
 * @swagger
 * /auth/request-otp:
 *   post:
 *     summary: Request an OTP for login/registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: User's phone number
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/request-otp",
  validate(requestOtpSchema),
  authController.requestOtp,
);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - code
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               code:
 *                 type: string
 *                 description: 6 digit OTP
 *               shopName:
 *                 type: string
 *                 description: Optional shop name (for registration)
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     token:
 *                       type: string
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", authenticate, authController.getProfile);

export default router;
