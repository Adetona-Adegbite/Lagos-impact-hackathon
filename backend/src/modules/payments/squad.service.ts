import { env } from "../../config/env.js";
import crypto from "crypto";

const SQUAD_BASE_URL =
  env.NODE_ENV === "production"
    ? "https://api-d.squadco.com"
    : "https://sandbox-api-d.squadco.com";

interface SquadApiResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

export interface VirtualAccountData {
  first_name: string;
  last_name: string;
  bank_code: string;
  virtual_account_number: string;
  beneficiary_account: string | null;
  customer_identifier: string;
  created_at: string;
  updated_at: string;
}

export interface SquadWebhookPayload {
  transaction_reference: string;
  virtual_account_number: string;
  principal_amount: string;
  settled_amount: string;
  fee_charged: string;
  transaction_date: string;
  customer_identifier: string;
  transaction_indicator: string;
  remarks: string;
  currency: string;
  channel: string;
  sender_name: string;
  meta?: {
    freeze_transaction_ref: string | null;
    reason_for_frozen_transaction: string | null;
  };
  encrypted_body?: string;
}

async function squadRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<SquadApiResponse<T>> {
  const url = `${SQUAD_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.SQUAD_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = (await response.json()) as SquadApiResponse<T>;
  return data;
}

/* ============ BUSINESS MODEL VIRTUAL ACCOUNT ============ */

export async function createBusinessVirtualAccount(payload: {
  customer_identifier: string;
  business_name: string;
  mobile_num: string;
  bvn: string;
  beneficiary_account?: string;
}): Promise<VirtualAccountData | null> {
  const result = await squadRequest<VirtualAccountData>(
    "/virtual-account/business",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );

  if (!result.success || result.status !== 200) {
    console.error("Squad Business VA creation failed:", result.message);
    return null;
  }

  return result.data;
}

export async function getVirtualAccountByCustomerIdentifier(
  customerIdentifier: string,
): Promise<VirtualAccountData | null> {
  const result = await squadRequest<VirtualAccountData>(
    `/virtual-account/${customerIdentifier}`,
  );

  if (!result.success || result.status !== 200) {
    return null;
  }

  return result.data;
}

/* ============ SIMULATE PAYMENT (sandbox only) ============ */

export async function simulateSquadPayment(
  virtualAccountNumber: string,
  amount: number,
): Promise<boolean> {
  const result = await squadRequest<any>("/virtual-account/simulate/payment", {
    method: "POST",
    body: JSON.stringify({
      virtual_account_number: virtualAccountNumber,
      amount: String(amount),
    }),
  });

  return result.success && result.status === 200;
}

/* ============ WEBHOOK ============ */

export function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
): boolean {
  if (!signature) return false;
  if (!env.SQUAD_SECRET_KEY) return false;

  const hash = crypto
    .createHmac("sha512", env.SQUAD_SECRET_KEY)
    .update(payload)
    .digest("hex");

  return hash === signature;
}
