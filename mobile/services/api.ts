import { Platform } from "react-native";

// Use 10.0.2.2 for Android Emulator to access host machine's localhost
// Use localhost for iOS Simulator
// Replace with your machine's local IP address if testing on physical device
const DEV_API_URL = Platform.select({
  android: "http://10.0.2.2:3000",
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
    throw new Error(responseData.message || "Something went wrong");
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
