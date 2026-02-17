import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import { env } from "../../config/env.js";
import { MessageCentralSDK, VerificationStatus } from "./otp.service..js";

const messageCentralSDK = new MessageCentralSDK({
  customerId: env.MESSAGE_CENTRAL_CUSTOMER_ID!,
  base64Password: Buffer.from(env.MESSAGE_CENTRAL_PASSWORD!, "utf8").toString(
    "base64",
  ),
});

export const requestOtp = async (phoneNumber: string) => {
  // Generate OTP
  const { verificationId } = await messageCentralSDK.sendOtp({
    mobileNumber: phoneNumber,
  });
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Save OTP to database
  // We can delete existing OTPs for this phone number to avoid clutter
  await prisma.otp.deleteMany({
    where: { phoneNumber },
  });

  await prisma.otp.create({
    data: {
      phoneNumber,
      verificationId,
      expiresAt,
    },
  });

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
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!otpRecord) {
    throw { statusCode: 400, message: "Invalid or expired OTP" };
  }

  const { message, responseCode } = await messageCentralSDK.verifyOtp({
    verificationId: otpRecord.verificationId,
    code,
  });
  if (responseCode !== 200) {
    switch (message as VerificationStatus) {
      case "ALREADY_VERIFIED":
      case "VERIFICATION_COMPLETED":
        break;
      case "VERIFICATION_EXPIRED":
        throw { statusCode: 400, message: "OTP has expired" };
      default:
        throw { statusCode: 400, message: "Invalid OTP" };
    }
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
        shopName: shopName || "My Shop",
      },
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

export const updateUserProfile = async (
  userId: string,
  data: { shopName?: string },
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      shopName: data.shopName,
    },
  });

  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    shopName: user.shopName,
  };
};
