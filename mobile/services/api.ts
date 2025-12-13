import { Platform } from "react-native";
import Constants from "expo-constants";

// Use 10.0.2.2 for Android Emulator to access host machine's localhost
// Use localhost for iOS Simulator
// Replace with your machine's local IP address if testing on physical device
const hostUri = Constants.expoConfig?.hostUri;
const ipAddress = hostUri?.split(":")[0];

const DEV_API_URL = ipAddress
  ? `http://${ipAddress}:3000`
  : Platform.select({
      // Fallback for when not running in Expo Go or with a dev client,
      // or for physical device testing.
      android: "http://192.168.101.6:3000",
      ios: "http://localhost:3000",
      default: "http://localhost:3000",
    });

export const BASE_URL = DEV_API_URL;

interface RequestConfig extends RequestInit {
  data?: any;
}

async function request<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<T> {
  const { data, headers, ...customConfig } = config;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: config.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...customConfig,
  });

  const responseData = await response.json();

  if (!response.ok) {
    const error: any = new Error(
      responseData.message || "Something went wrong",
    );
    error.status = response.status;
    throw error;
  }

  return responseData.data || responseData;
}

export const authApi = {
  requestOtp: (phoneNumber: string) => {
    return request<{ message: string }>("/api/v1/auth/request-otp", {
      method: "POST",
      data: { phoneNumber },
    });
  },

  verifyOtp: (phoneNumber: string, code: string, shopName?: string) => {
    return request<{ user: any; token: string }>("/api/v1/auth/verify-otp", {
      method: "POST",
      data: { phoneNumber, code, shopName },
    });
  },
};

export const productsApi = {
  create: (data: any, token: string) => {
    return request<any>("/api/v1/products", {
      method: "POST",
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  update: (id: string, data: any, token: string) => {
    return request<any>(`/api/v1/products/${id}`, {
      method: "PATCH",
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  delete: (id: string, token: string) => {
    return request<any>(`/api/v1/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getAll: (token: string, page = 1, limit = 1000) => {
    return request<any>(`/api/v1/products?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getCategories: (token: string) => {
    return request<string[]>("/api/v1/products/categories", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  recommendCategory: (name: string, token: string) => {
    return request<{ category: string }>(
      `/api/v1/products/recommend-category?name=${encodeURIComponent(name)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },
};

export const salesApi = {
  sync: (sales: any[], token: string) => {
    return request<any>("/api/v1/sales/sync", {
      method: "POST",
      data: { sales },
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getAll: (token: string, page = 1, limit = 1000) => {
    return request<any>(`/api/v1/sales?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export const inventoryApi = {
  update: (data: { productId: string; quantity: number }, token: string) => {
    // This endpoint should set the quantity for a product, not increment it.
    return request<any>("/api/v1/inventory/set-quantity", {
      method: "POST",
      data,
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
