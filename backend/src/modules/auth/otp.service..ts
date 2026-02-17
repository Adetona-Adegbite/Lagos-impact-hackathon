import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

/* =========================
   Constants
========================= */

const BASE_URL = "https://cpaas.messagecentral.com";

export const OTP_LENGTH = 6;

/* =========================
   Types
========================= */

export type FlowType = "SMS" | "WHATSAPP" | "RCS" | "SAUTH";

export interface SDKConfig {
  customerId: string;
  base64Password: string;
  defaultCountryCode?: string;
  timeoutMs?: number;
}

export interface ApiError {
  responseCode: number | string;
  message?: string;
}

export interface AuthTokenData {
  status: number;
  token: string;
}

export interface SendOtpData {
  verificationId: string;
  mobileNumber: string;
  timeout: string;
  transactionId: string;
}

export type VerificationStatus =
  | "VERIFICATION_COMPLETED"
  | "VERIFICATION_FAILED"
  | "VERIFICATION_EXPIRED"
  | "WRONG_OTP_PROVIDED"
  | "ALREADY_VERIFIED";

export interface VerifyOtpData {
  verificationId: string;
  mobileNumber: string;
  verificationStatus: VerificationStatus;
  transactionId: string;
}

interface ApiResponse<T> {
  responseCode: number | string;
  message: string;
  data: T;
}

/* =========================
   SDK Class
========================= */

export class MessageCentralSDK {
  private customerId: string;
  private base64Password: string;
  private defaultCountryCode: string;

  private axios: AxiosInstance;

  private cachedToken: string | null = null;
  private tokenExpiry = 0;

  constructor(config: SDKConfig) {
    this.customerId = config.customerId;
    this.base64Password = config.base64Password;
    this.defaultCountryCode = config.defaultCountryCode ?? "234";

    this.axios = axios.default.create({
      baseURL: BASE_URL,
      timeout: config.timeoutMs ?? 10000,
    });
  }

  /* =========================
     Internal helpers
  ========================= */

  private async request<T>(
    config: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const res = await this.axios.request<ApiResponse<T>>(config);

      const data = res.data;

      return data;
    } catch (err: any) {
      if (err.response?.data) {
        const apiErr = err.response.data;
        console.log(apiErr);
        throw new Error(
          `API error: ${apiErr.responseCode} - ${apiErr.message}`,
        );
      }

      throw new Error(err.message || "Unknown request error");
    }
  }

  private async getAuthToken(): Promise<string> {
    const now = Date.now();

    // reuse token if still valid
    if (this.cachedToken && now < this.tokenExpiry) {
      return this.cachedToken;
    }

    const params = new URLSearchParams({
      customerId: this.customerId,
      key: this.base64Password,
      scope: "NEW",
    });

    const response = await this.axios.request<AuthTokenData>({
      method: "GET",
      url: `/auth/v1/authentication/token?${params.toString()}`,
      headers: { accept: "*/*" },
    });

    const token = response.data.token;

    // assume 5 min validity if not provided
    this.cachedToken = token;
    this.tokenExpiry = now + 5 * 60 * 1000;

    return token;
  }

  /* =========================
     Public methods
  ========================= */

  /**
   * Send OTP
   */
  async sendOtp(options: {
    mobileNumber: string;
    countryCode?: string;
    otpLength?: number;
    flowType?: FlowType;
  }): Promise<SendOtpData> {
    const token = await this.getAuthToken();

    const params = new URLSearchParams({
      customerId: this.customerId,
      countryCode: options.countryCode ?? this.defaultCountryCode,
      mobileNumber: options.mobileNumber,
      flowType: options.flowType ?? "SMS",
      otpLength: String(options.otpLength ?? OTP_LENGTH),
    });

    const response = await this.request<SendOtpData>({
      method: "POST",
      url: `/verification/v3/send?${params.toString()}`,
      headers: {
        authToken: token,
      },
    });

    return response.data;
  }

  /**
   * Verify OTP
   */
  async verifyOtp(options: {
    verificationId: string;
    code: string;
  }): Promise<ApiResponse<VerifyOtpData>> {
    const token = await this.getAuthToken();

    const params = new URLSearchParams({
      verificationId: options.verificationId,
      code: options.code,
    });

    const response = await this.request<VerifyOtpData>({
      method: "GET",
      url: `/verification/v3/validateOtp?${params.toString()}`,
      headers: {
        authToken: token,
      },
    });

    return response;
  }
}
