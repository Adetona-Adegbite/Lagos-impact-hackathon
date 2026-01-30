import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Alert,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { authApi } from "../../services/api";
import { authStorage } from "../../services/authStorage";
import { syncEngine } from "../../services/sync/SyncEngine";
import { t } from "../../utils/localization";
import { Button } from "../../components/ui/button";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

const RESEND_COOLDOWN = 30; // seconds

type Props = {
  route?: { params?: { phone?: string; shopName?: string } };
  navigation?: any;
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

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cooldown, setCooldown] = useState<number>(RESEND_COOLDOWN);
  const cooldownRef = useRef<number | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    const sanitized = text.replace(/\D/g, "");
    if (sanitized.length === 0) {
      const copy = [...digits];
      copy[idx] = "";
      setDigits(copy);
      return;
    }

    if (sanitized.length > 1) {
      const arr = sanitized.split("").slice(0, 6);
      const merged = [...digits];
      for (let i = 0; i < arr.length; i++) merged[i] = arr[i];
      setDigits(merged);
      const next = arr.length >= 6 ? 5 : arr.length;
      focusInput(next);
      return;
    }

    const copy = [...digits];
    copy[idx] = sanitized;
    setDigits(copy);

    if (sanitized && idx < 5) {
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
      if (verifyCode) {
        const ok = await verifyCode(code);
        if (!ok) throw new Error("Invalid code");
      } else {
        const response = await authApi.verifyOtp(phone, code, shopName);
        const userToSave = { ...response.user };
        if (shopName) {
          userToSave.shopName = shopName;
        }
        await authStorage.saveAuthData(response.token, userToSave);
        syncEngine
          .initialize()
          .catch((e) => console.log("Initial sync warning:", e));
      }
      setError(null);
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
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-5 pt-2">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Button
              variant="secondary"
              size="icon"
              className="w-11 h-11 rounded-full bg-secondary"
              onPress={() => navigation?.goBack?.()}
            >
              <ArrowLeft size={20} color="white" />
            </Button>
            <Text variant="h3" className="font-extrabold text-foreground">
              {t("verifyCodeTitle")}
            </Text>
            <View className="w-11" />
          </View>

          {/* Info */}
          <Text className="text-sm text-muted-foreground mb-8 leading-5 px-1">
            {t("otpSubtitle")}{" "}
            <Text className="font-extrabold text-foreground">{phone}</Text>
          </Text>

          {/* OTP inputs */}
          <Animated.View
            className="flex-row justify-between mb-4 mx-2"
            style={{ transform: [{ translateX: shakeAnim }] }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Input
                key={`otp-${i}`}
                // @ts-ignore
                ref={(r) => (inputsRef.current[i] = r)}
                value={digits[i]}
                onChangeText={(t) => onChangeDigit(t, i)}
                onKeyPress={(e) => onKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="done"
                textContentType="oneTimeCode"
                className={cn(
                  "w-[46px] h-14 bg-secondary border border-border text-center text-xl font-black text-foreground rounded-xl",
                  error && "border-destructive text-destructive",
                )}
                accessible
                accessibilityLabel={`OTP digit ${i + 1}`}
              />
            ))}
          </Animated.View>

          {/* helper and error */}
          {error && (
            <Text className="text-destructive text-xs font-bold text-center mb-4">
              {error}
            </Text>
          )}

          {/* actions */}
          <View className="px-1.5 pt-3">
            <Button
              onPress={handleVerify}
              disabled={isVerifying}
              className={cn(
                "h-14 rounded-full bg-primary mb-5 shadow-lg shadow-primary/20",
                isVerifying && "opacity-70",
              )}
            >
              <Text className="text-primary-foreground font-black text-base uppercase tracking-tight">
                {isVerifying ? t("verifying") : t("verify")}
              </Text>
            </Button>

            <View className="flex-row justify-between items-center px-2">
              <Pressable onPress={clearAll} hitSlop={12}>
                <Text className="text-primary font-bold">{t("clear")}</Text>
              </Pressable>

              <Pressable
                onPress={handleResend}
                disabled={cooldown > 0}
                hitSlop={12}
              >
                <Text
                  className={cn(
                    "text-primary font-bold",
                    cooldown > 0 && "text-muted-foreground",
                  )}
                >
                  {cooldown > 0
                    ? t("resendIn").replace("{cooldown}", `${cooldown}`)
                    : t("resendCode")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* small helper text */}
          <Text className="mt-10 text-muted-foreground text-xs text-center leading-5 px-4">
            {t("otpHelperText")}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
