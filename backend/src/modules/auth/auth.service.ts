import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { env } from "../../config/env.js";
import { setupUserVirtualAccount } from "../payments/payments.service.js";

// Helper to generate a 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const requestOtp = async (phoneNumber: string) => {
  // Generate OTP
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  // Save OTP to database
  // We can delete existing OTPs for this phone number to avoid clutter
  await prisma.otp.deleteMany({
    where: { phoneNumber },
  });

  await prisma.otp.create({
    data: {
      phoneNumber,
      code,
      expiresAt,
    },
  });

  // In a real application, you would integrate with an SMS provider (e.g., Twilio) here.
  // For this implementation, we will log the OTP to the console.
  console.log(`[OTP-Mock] OTP for ${phoneNumber} is: ${code}`);

  return { message: "OTP sent successfully" };
};

export const verifyOtp = async (
  phoneNumber: string,
  code: string,
  shopName?: string,
) => {
  // Find valid OTP
  const otpRecord = await prisma.otp.findFirst({
    where: {
      phoneNumber,
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otpRecord) {
    throw { statusCode: 400, message: "Invalid or expired OTP" };
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  let isNewUser = false;

  if (!user) {
    // Register new user
    isNewUser = true;
    user = await prisma.user.create({
      data: {
        phoneNumber,
        shopName: shopName || null,
      },
    });
  } else if (shopName && !user.shopName) {
    // Optionally update shop name if provided and not set
    user = await prisma.user.update({
      where: { id: user.id },
      data: { shopName },
    });
  }

  // Delete the used OTP
  await prisma.otp.delete({
    where: { id: otpRecord.id },
  });

  // Generate Token
  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Set up virtual account for new users (or users without one)
  let virtualAccount = null;
  if (isNewUser || !user.virtualAccountNumber) {
    try {
      virtualAccount = await setupUserVirtualAccount(
        user.id,
        user.phoneNumber,
        user.shopName,
      );
    } catch (err) {
      console.error("Failed to set up virtual account:", err);
    }
  } else {
    virtualAccount = {
      virtualAccountNumber: user.virtualAccountNumber,
      virtualAccountName: user.virtualAccountName,
      virtualBankName: user.virtualBankName,
    };
  }

  return {
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      shopName: user.shopName,
      virtualAccountNumber: virtualAccount?.virtualAccountNumber || null,
      virtualAccountName: virtualAccount?.virtualAccountName || null,
      virtualBankName: virtualAccount?.virtualBankName || null,
    },
    token,
  };
};

export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phoneNumber: true,
      shopName: true,
      virtualAccountNumber: true,
      virtualAccountName: true,
      virtualBankName: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return user;
};
