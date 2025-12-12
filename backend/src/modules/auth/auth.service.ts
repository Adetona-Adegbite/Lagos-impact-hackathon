import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { env } from "../../config/env.js";
import { UniClient } from "uni-sdk";

const client = new UniClient({
  accessKeyId: env.UNIMTX_ACCESS_KEY_ID,
});

export const requestOtp = async (phoneNumber: string) => {
  await client.otp.send({
    to: phoneNumber,
  });

  return { message: "OTP sent successfully" };
};

export const verifyOtp = async (
  phoneNumber: string,
  code: string,
  shopName?: string,
) => {
  const verification = await client.otp.verify({
    to: phoneNumber,
    code,
  });

  if (!verification.valid) {
    throw { statusCode: 400, message: "Invalid or expired OTP" };
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { phoneNumber },
  });

  if (!user) {
    // Register new user
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

  // Generate Token
  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      shopName: user.shopName,
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
      createdAt: true,
    },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return user;
};
