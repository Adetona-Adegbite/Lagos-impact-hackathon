import prisma from "../../config/db.js";
import {
  createBusinessVirtualAccount,
  getVirtualAccountByCustomerIdentifier,
  simulateSquadPayment,
  type VirtualAccountData,
} from "./squad.service.js";

/* ============ DEMO ACCOUNT (hardcoded for sandbox) ============ */
const DEMO_VA_NUMBER = "8399671767";
const DEMO_VA_BANK = "GTBank";
const DEMO_BANK_CODE = "058";

/* ============ USER VIRTUAL ACCOUNT SETUP ============ */

export async function setupUserVirtualAccount(
  userId: string,
  phoneNumber: string,
  shopName?: string | null,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  // If already has a VA, return it
  if (user.virtualAccountNumber) {
    return {
      virtualAccountNumber: user.virtualAccountNumber,
      virtualAccountName: user.virtualAccountName,
      virtualBankName: user.virtualBankName,
    };
  }

  const customerIdentifier = `squad_${userId}`;
  const businessName = shopName || "My Shop";

  // Try to create via Squad API (business model)
  let vaData: VirtualAccountData | null = null;
  try {
    vaData = await createBusinessVirtualAccount({
      customer_identifier: customerIdentifier,
      business_name: businessName,
      mobile_num: phoneNumber.replace(/\+234/, "0").slice(0, 11),
      bvn: process.env.DEFAULT_BVN || "22740052802",
      beneficiary_account:
        process.env.DEFAULT_BENEFICIARY_ACCOUNT || "0795451592",
    });
  } catch (err) {
    console.error("Squad API error:", err);
  }

  // For demo/sandbox: always use the hardcoded account
  if (!vaData) {
    vaData = {
      first_name: businessName,
      last_name: "",
      bank_code: DEMO_BANK_CODE,
      virtual_account_number: DEMO_VA_NUMBER,
      beneficiary_account:
        process.env.DEFAULT_BENEFICIARY_ACCOUNT || "0795451592",
      customer_identifier: customerIdentifier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    console.log(
      `[DEMO] Using hardcoded VA: ${DEMO_VA_NUMBER} for user ${userId}`,
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      virtualAccountNumber: vaData.virtual_account_number,
      virtualAccountName: `${vaData.first_name} ${vaData.last_name}`.trim(),
      virtualBankName: getBankName(vaData.bank_code),
      customerIdentifier: vaData.customer_identifier,
    },
  });

  return {
    virtualAccountNumber: updatedUser.virtualAccountNumber,
    virtualAccountName: updatedUser.virtualAccountName,
    virtualBankName: updatedUser.virtualBankName,
  };
}

/* ============ WEBHOOK PAYMENT PROCESSING ============ */

export async function processWebhookPayment(payload: {
  transaction_reference: string;
  virtual_account_number: string;
  principal_amount: string;
  settled_amount?: string;
  fee_charged?: string;
  customer_identifier: string;
  sender_name?: string;
  remarks?: string;
  currency?: string;
  transaction_date?: string;
}) {
  const user = await prisma.user.findFirst({
    where: { customerIdentifier: payload.customer_identifier },
  });

  if (!user) {
    console.error(
      "Webhook: No user found for customer_identifier",
      payload.customer_identifier,
    );
    return null;
  }

  const existing = await prisma.payment.findUnique({
    where: { transactionReference: payload.transaction_reference },
  });

  if (existing) {
    return existing;
  }

  const amount = parseFloat(payload.principal_amount);
  const settledAmount = payload.settled_amount
    ? parseFloat(payload.settled_amount)
    : amount;
  const feeCharged = payload.fee_charged ? parseFloat(payload.fee_charged) : 0;

  const payment = await prisma.payment.create({
    data: {
      transactionReference: payload.transaction_reference,
      amount,
      settledAmount,
      feeCharged,
      senderName: payload.sender_name || null,
      remarks: payload.remarks || null,
      currency: payload.currency || "NGN",
      status: "RECEIVED",
      userId: user.id,
    },
  });

  // Auto-link if exactly one sale matches the amount
  const matchingSales = await prisma.sale.findMany({
    where: {
      userId: user.id,
      totalAmount: amount,
      payment: { is: null },
    },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  if (matchingSales.length === 1) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { saleId: matchingSales[0].id, status: "AUTO_LINKED" },
    });
  }

  return payment;
}

/* ============ USER PAYMENTS ============ */

export async function getUserPayments(userId: string) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      sale: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });
}

export async function getUnlinkedPayments(userId: string) {
  return prisma.payment.findMany({
    where: { userId, saleId: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSalesMatchingAmount(
  userId: string,
  amount: number,
  tolerance: number = 50,
) {
  const minAmount = amount - tolerance;
  const maxAmount = amount + tolerance;

  return prisma.sale.findMany({
    where: {
      userId,
      totalAmount: {
        gte: minAmount,
        lte: maxAmount,
      },
      payment: { is: null },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
  });
}

export async function linkPaymentToSale(
  paymentId: string,
  saleId: string,
  userId: string,
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
  });
  if (!payment) throw { statusCode: 404, message: "Payment not found" };

  const sale = await prisma.sale.findFirst({
    where: { id: saleId, userId },
  });
  if (!sale) throw { statusCode: 404, message: "Sale not found" };

  if (payment.saleId) {
    throw { statusCode: 400, message: "Payment already linked" };
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: { saleId, status: "LINKED" },
  });

  return updated;
}

/* ============ SIMULATE PAYMENT (sandbox only) ============ */

export async function simulatePayment(
  userId: string,
  amount: number,
  virtualAccountNumber?: string,
) {
  if (process.env.NODE_ENV === "production") {
    throw {
      statusCode: 403,
      message: "Payment simulation is only available in sandbox",
    };
  }

  if (amount <= 0 || amount > 10_000_000) {
    throw {
      statusCode: 400,
      message: "Amount must be between 1 and 10,000,000",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { statusCode: 404, message: "User not found" };

  const vaNumber =
    virtualAccountNumber || user.virtualAccountNumber || DEMO_VA_NUMBER;

  // 1. Call Squad simulate API
  const success = await simulateSquadPayment(vaNumber, amount);

  if (!success) {
    throw { statusCode: 502, message: "Failed to simulate payment with Squad" };
  }

  // 2. Create the payment record immediately (sandbox webhooks may be delayed)
  const transactionReference = `SIM_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const payment = await prisma.payment.create({
    data: {
      transactionReference,
      amount,
      currency: "NGN",
      status: "RECEIVED",
      userId,
      remarks: "Simulated transfer (sandbox)",
    },
  });

  // 3. Try auto-linking to a matching sale (exact amount, no tolerance for simulate)
  const matchingSales = await prisma.sale.findMany({
    where: {
      userId,
      totalAmount: amount,
      payment: { is: null },
    },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  let linkedSale = null;
  if (matchingSales.length === 1) {
    linkedSale = matchingSales[0];
    await prisma.payment.update({
      where: { id: payment.id },
      data: { saleId: linkedSale.id, status: "AUTO_LINKED" },
    });
  }

  return {
    success: true,
    message: "Simulated payment created successfully",
    paymentId: payment.id,
    transactionReference,
    amount,
    status: linkedSale ? "AUTO_LINKED" : "RECEIVED",
    linkedSaleId: linkedSale?.id || null,
  };
}

function getBankName(bankCode: string): string {
  const banks: Record<string, string> = {
    "044": "Access Bank",
    "014": "Afribank",
    "023": "Citibank",
    "050": "Ecobank",
    "011": "First Bank",
    "214": "First City Monument Bank",
    "070": "Fidelity Bank",
    "058": "Guaranty Trust Bank",
    "030": "Heritage Bank",
    "301": "Jaiz Bank",
    "082": "Keystone Bank",
    "076": "Polaris Bank",
    "221": "Stanbic IBTC",
    "068": "Standard Chartered",
    "232": "Sterling Bank",
    "100": "SunTrust Bank",
    "032": "Union Bank",
    "033": "United Bank for Africa",
    "215": "Unity Bank",
    "035": "Wema Bank",
    "057": "Zenith Bank",
  };
  return banks[bankCode] || "Squad Bank";
}
