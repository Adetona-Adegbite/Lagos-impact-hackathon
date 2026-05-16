import { executeSql } from "./database";
import { paymentsApi } from "./api";
import { authStorage } from "./authStorage";

export interface Payment {
  id: string;
  transactionReference: string;
  amount: number;
  settledAmount: number | null;
  feeCharged: number | null;
  senderName: string | null;
  remarks: string | null;
  currency: string;
  status: string;
  saleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const paymentService = {
  initTable: async () => {
    await executeSql(`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        transactionReference TEXT NOT NULL,
        amount REAL NOT NULL,
        settledAmount REAL,
        feeCharged REAL,
        senderName TEXT,
        remarks TEXT,
        currency TEXT DEFAULT 'NGN',
        status TEXT DEFAULT 'PENDING',
        saleId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);
  },

  syncPayments: async (): Promise<Payment[]> => {
    const token = await authStorage.getToken();
    if (!token) return [];

    try {
      const remotePayments = await paymentsApi.getMyPayments(token);
      for (const p of remotePayments) {
        await executeSql(
          `INSERT OR REPLACE INTO payments
           (id, transactionReference, amount, settledAmount, feeCharged, senderName, remarks, currency, status, saleId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.transactionReference,
            p.amount,
            p.settledAmount ?? null,
            p.feeCharged ?? null,
            p.senderName ?? null,
            p.remarks ?? null,
            p.currency,
            p.status,
            p.saleId ?? null,
            p.createdAt,
            p.updatedAt,
          ],
        );
      }
      return remotePayments;
    } catch (err) {
      console.warn("Failed to sync payments:", err);
      return paymentService.getLocalPayments();
    }
  },

  getLocalPayments: async (): Promise<Payment[]> => {
    const result = await executeSql(
      `SELECT * FROM payments ORDER BY createdAt DESC`,
    );
    const payments: Payment[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      payments.push(result.rows.item(i));
    }
    return payments;
  },

  getUnlinkedPayments: async (): Promise<Payment[]> => {
    const result = await executeSql(
      `SELECT * FROM payments WHERE saleId IS NULL ORDER BY createdAt DESC`,
    );
    const payments: Payment[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      payments.push(result.rows.item(i));
    }
    return payments;
  },

  linkPaymentToSale: async (paymentId: string, saleId: string) => {
    const token = await authStorage.getToken();
    if (!token) throw new Error("Not authenticated");
    await paymentsApi.linkPayment(paymentId, saleId, token);
    await executeSql(
      `UPDATE payments SET saleId = ?, status = 'LINKED', updatedAt = ? WHERE id = ?`,
      [saleId, new Date().toISOString(), paymentId],
    );
  },

  getSalesMatch: async (amount: number) => {
    const token = await authStorage.getToken();
    if (!token) throw new Error("Not authenticated");
    return paymentsApi.getSalesMatch(amount, token);
  },

  simulatePayment: async (amount: number) => {
    const token = await authStorage.getToken();
    if (!token) throw new Error("Not authenticated");
    const result = await paymentsApi.simulatePayment(amount, token);
    // Insert the simulated payment locally so it shows up immediately
    if (result?.paymentId) {
      await executeSql(
        `INSERT OR REPLACE INTO payments
         (id, transactionReference, amount, settledAmount, feeCharged, senderName, remarks, currency, status, saleId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.paymentId,
          result.transactionReference,
          result.amount,
          null,
          null,
          null,
          result.message || "Simulated transfer",
          "NGN",
          result.status || "RECEIVED",
          result.linkedSaleId || null,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );
    }
    return result;
  },
};
