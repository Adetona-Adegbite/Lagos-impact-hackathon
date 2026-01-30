import React, { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Store,
  Store as StoreIcon,
} from "lucide-react-native";
import { authApi } from "../../services/api";
import { t, localizationService } from "../../utils/localization";
import { Button } from "../../components/ui/button";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

const LANGUAGES = [
  { label: "english", code: "en" },
  { label: "hausa", code: "hausa" },
  { label: "yoruba", code: "yoruba" },
  { label: "igbo", code: "igbo" },
  { label: "pidgin", code: "pcm" },
];

export default function LoginScreen({ navigation }: { navigation?: any }) {
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(
    localizationService.getCurrentLanguage(),
  );

  const handleSetLanguage = async (lang: string) => {
    await localizationService.setLanguage(lang);
    setLanguage(lang);
  };

  const handleGetCode = async () => {
    if (!phone) {
      Alert.alert(t("requiredTitle"), t("phoneNumberRequired"));
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestOtp(phone);
      navigation?.navigate("VerifyOtp", { phone, shopName });
    } catch (error: any) {
      Alert.alert(t("errorTitle"), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openLink = (url: string) =>
    Linking.openURL(url).catch((e) => console.warn(e));

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
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          className="flex-1 px-5 pt-2"
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Button
              variant="secondary"
              size="icon"
              className="w-11 h-11 rounded-full bg-secondary"
              onPress={() => navigation?.goBack?.()}
            >
              <ArrowLeft size={20} color="white" />
            </Button>

            <View className="flex-row gap-1.5 items-center">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <View className="w-2 h-2 rounded-full bg-primary/30" />
              <View className="w-2 h-2 rounded-full bg-primary/30" />
            </View>
          </View>

          {/* Hero Section */}
          <View className="py-2 px-0.5 mb-6">
            <View className="w-14 h-14 rounded-full bg-primary items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <StoreIcon size={28} color="#122117" strokeWidth={2.5} />
            </View>
            <Text variant="h1" className="mb-2">
              {t("welcomeOga")}
            </Text>
            <Text
              variant="p"
              className="text-muted-foreground leading-relaxed max-w-[520px]"
            >
              {t("loginSubtitle")}
            </Text>
          </View>

          {/* Language Selector */}
          <View className="mb-6">
            <Text className="text-sm font-bold mb-3 text-foreground">
              {t("selectLanguage")}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSetLanguage(lang.code)}
                  className={cn(
                    "px-4 py-2 rounded-xl bg-secondary border border-transparent",
                    language === lang.code && "bg-primary border-primary/20",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      language === lang.code
                        ? "text-primary-foreground font-bold"
                        : "text-foreground",
                    )}
                  >
                    {t(lang.label)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Form */}
          <View className="gap-5">
            {/* Phone Number Field */}
            <View>
              <Text className="text-sm font-bold mb-2 text-foreground">
                {t("phoneNumber")}
              </Text>
              <View className="flex-row items-center h-14 rounded-full bg-secondary border border-border overflow-hidden">
                <View className="flex-row items-center pl-4 pr-3 border-r border-border h-full bg-secondary">
                  <Text className="text-lg mr-2">🇳🇬</Text>
                  <Text className="text-base text-foreground font-semibold">
                    +234
                  </Text>
                </View>
                <Input
                  className="flex-1 bg-transparent border-0 h-full text-lg px-4"
                  placeholder="8012345678"
                  placeholderTextColor="#9AA0A6"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <View className="pr-4">
                  <Smartphone size={20} color="#9AA0A6" />
                </View>
              </View>
            </View>

            {/* Shop Name Field */}
            <View>
              <Text className="text-sm font-bold mb-2 text-foreground">
                {t("shopName")}
              </Text>
              <View className="flex-row items-center h-14 rounded-full bg-secondary border border-border overflow-hidden">
                <Input
                  className="flex-1 bg-transparent border-0 h-full text-lg px-4"
                  placeholder="e.g. Mama Nkechi Store"
                  placeholderTextColor="#9AA0A6"
                  value={shopName}
                  onChangeText={setShopName}
                />
                <View className="pr-4">
                  <Store size={20} color="#9AA0A6" />
                </View>
              </View>
            </View>

            {/* Primary Action Button */}
            <Button
              onPress={handleGetCode}
              disabled={isLoading}
              className={cn(
                "h-14 rounded-full bg-primary mt-2 shadow-lg shadow-primary/20",
                isLoading && "opacity-70",
              )}
            >
              {isLoading ? (
                <ActivityIndicator color="#062" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-primary-foreground font-black text-base uppercase tracking-tight">
                    {t("getCode")}
                  </Text>
                  <ArrowRight size={18} color="#062" strokeWidth={3} />
                </View>
              )}
            </Button>
          </View>

          {/* Footer */}
          <View className="mt-8 items-center px-4">
            <Text className="text-muted-foreground text-center text-xs leading-5">
              {t("termsAgreement")}{" "}
              <Text
                className="text-primary font-bold"
                onPress={() => openLink("https://example.com/terms")}
              >
                {t("terms")}
              </Text>{" "}
              and{" "}
              <Text
                className="text-primary font-bold"
                onPress={() => openLink("https://example.com/privacy")}
              >
                {t("privacyPolicy")}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
