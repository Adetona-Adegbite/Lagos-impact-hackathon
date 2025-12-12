// src/screens/VerifyOtpScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Animated,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { authApi } from "../../services/api";
import { authStorage } from "../../services/authStorage";
import { SyncService } from "../../services/sync";
import { t } from "../../utils/localization";

const MAIN_GREEN = "#36e27b";
const RESEND_COOLDOWN = 30; // seconds

type Props = {
  route?: { params?: { phone?: string; shopName?: string } };
  navigation?: any;
  // optional: provide real handlers from parent / context
  verifyCode?: (code: string) => Promise<boolean>;
  resendCode?: () => Promise<void>;
};

export default function VerifyOtpScreen({
  route,
  navigation,
  verifyCode,
  resendCode,
}: Props) {
  const phone = route?.params?.phone ?? "Unknown";
  const shopName = route?.params?.shopName;

  // OTP state as array of 6 digits (strings)
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // resend cooldown
  const [cooldown, setCooldown] = useState<number>(RESEND_COOLDOWN);
  const cooldownRef = useRef<number | null>(null);

  // subtle shake animation for errors
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // start cooldown when screen mounts (assume code just sent)
    startCooldown();

    return () => {
      if (cooldownRef.current) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          if (cooldownRef.current) {
            clearInterval(cooldownRef.current);
            cooldownRef.current = null;
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000) as unknown as number;
  };

  const focusInput = (idx: number) => {
    inputsRef.current[idx]?.focus();
  };

  const onChangeDigit = (text: string, idx: number) => {
    // accept only digits, allow paste of full code
    const sanitized = text.replace(/\D/g, "");
    if (sanitized.length === 0) {
      // user cleared
      const copy = [...digits];
      copy[idx] = "";
      setDigits(copy);
      return;
    }

    // if user pasted full code
    if (sanitized.length > 1) {
      const arr = sanitized.split("").slice(0, 6);
      const merged = [...digits];
      for (let i = 0; i < arr.length; i++) merged[i] = arr[i];
      setDigits(merged);
      // focus next empty or last
      const next = arr.length >= 6 ? 5 : arr.length;
      focusInput(next);
      return;
    }

    // normal single digit entry
    const copy = [...digits];
    copy[idx] = sanitized;
    setDigits(copy);

    if (sanitized && idx < 5) {
      // move focus to next
      focusInput(idx + 1);
    }
  };

  const onKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace") {
      if (digits[idx] === "" && idx > 0) {
        focusInput(idx - 1);
        const copy = [...digits];
        copy[idx - 1] = "";
        setDigits(copy);
      }
    }
  };

  const runShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getCode = () => digits.join("");

  const handleVerify = async () => {
    setError(null);
    const code = getCode();
    if (code.length < 6) {
      setError(t("otpEnter6DigitError"));
      runShake();
      return;
    }

    setIsVerifying(true);
    try {
      // if verifyCode prop provided, use it; otherwise use dummy logic
      if (verifyCode) {
        const ok = await verifyCode(code);
        if (!ok) throw new Error("Invalid code");
      } else {
        const response = await authApi.verifyOtp(phone, code, shopName);
        await authStorage.saveAuthData(response.token, response.user);
        // Trigger initial sync (fire and forget)
        SyncService.syncProductsDown().catch((e) =>
          console.log("Initial sync warning:", e),
        );
      }

      setError(null);
      // navigate to next screen (replace with your route)
      navigation?.navigate?.("HomeScreen") ??
        Alert.alert(t("otpVerifiedTitle"), t("otpVerifiedSubtitle"));
    } catch (e: any) {
      setError(e.message || t("otpVerificationFailedError"));
      runShake();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    try {
      if (resendCode) {
        await resendCode();
      } else {
        await authApi.requestOtp(phone);
      }
      startCooldown();
    } catch (e) {
      setError(t("otpResendFailedError"));
    }
  };

  const clearAll = () => {
    setDigits(["", "", "", "", "", ""]);
    focusInput(0);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.back}
              onPress={() => navigation?.goBack?.()}
            >
              <MaterialIcons name="arrow-back" size={20} color="#111" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("verifyCodeTitle")}</Text>
            <View style={{ width: 42 }} />
          </View>

          {/* Info */}
          <Text style={styles.info}>
            {t("otpSubtitle")}{" "}
            <Text style={{ fontWeight: "800" }}>{phone}</Text>
          </Text>

          {/* OTP inputs */}
          <Animated.View
            style={[
              styles.otpRow,
              {
                transform: [{ translateX: shakeAnim }],
              },
            ]}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <TextInput
                key={`otp-${i}`}
                // @ts-ignore
                ref={(r) => (inputsRef.current[i] = r)}
                value={digits[i]}
                onChangeText={(t) => onChangeDigit(t, i)}
                onKeyPress={(e) => onKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={6} // we handle paste separately; allow longer for paste
                returnKeyType="done"
                textContentType="oneTimeCode"
                style={[styles.otpInput, error ? styles.otpInputError : null]}
                accessible
                accessibilityLabel={`OTP digit ${i + 1}`}
                selectionColor={MAIN_GREEN}
                onFocus={() => {
                  // clear selection if there is a single char so typing replaces it
                  /* no-op */
                }}
              />
            ))}
          </Animated.View>

          {/* helper and error */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.verifyBtn, isVerifying && { opacity: 0.7 }]}
              onPress={handleVerify}
              activeOpacity={0.85}
              disabled={isVerifying}
            >
              <Text style={styles.verifyBtnText}>
                {isVerifying ? t("verifying") : t("verify")}
              </Text>
            </TouchableOpacity>

            <View style={styles.rowBetween}>
              <TouchableOpacity
                onPress={clearAll}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.linkText}>{t("clear")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldown > 0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text
                  style={[
                    styles.linkText,
                    cooldown > 0 ? { color: "#9AA0A6" } : null,
                  ]}
                >
                  {cooldown > 0
                    ? t("resendIn").replace("{cooldown}", `${cooldown}`)
                    : t("resendCode")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* small helper text */}
          <Text style={styles.small}>{t("otpHelperText")}</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#122117" },
  wrap: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 20) : 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#29372e",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },

  info: { fontSize: 14, color: "#6B7280", marginBottom: 24 },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginHorizontal: 10,
  },
  otpInput: {
    width: 42,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E9E8",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  otpInputError: {
    borderColor: "#F87171",
    shadowColor: "#F87171",
    shadowOpacity: 0.12,
  },

  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 4,
    textAlign: "center",
  },

  actions: { paddingTop: 12, paddingHorizontal: 6 },
  verifyBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: MAIN_GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: MAIN_GREEN,
    shadowOpacity: 0.18,
    elevation: 4,
  },
  verifyBtnText: { color: "#062", fontWeight: "800", fontSize: 16 },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  linkText: { color: MAIN_GREEN, fontWeight: "700" },

  small: { marginTop: 18, color: "#6B7280", fontSize: 13, textAlign: "center" },
});
