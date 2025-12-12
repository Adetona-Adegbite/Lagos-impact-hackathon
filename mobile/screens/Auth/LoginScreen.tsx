// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { authApi } from "../../services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";

const MAIN_GREEN = "#36e27b";

export default function LoginScreen({ navigation }: { navigation?: any }) {
  const [phone, setPhone] = useState("");
  const [shopName, setShopName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGetCode = async () => {
    if (!phone) {
      Alert.alert("Required", "Please enter your phone number.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.requestOtp(phone);
      navigation?.navigate("VerifyOtp", { phone, shopName });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = () => {
    // TODO: wire Google OAuth flow
    console.log("Google login");
  };

  const openLink = (url: string) =>
    Linking.openURL(url).catch((e) => console.warn(e));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.ka}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation?.goBack?.()}
            >
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={styles.pips}>
              <View style={styles.pipActive} />
              <View style={styles.pip} />
              <View style={styles.pip} />
            </View>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.brandCircle}>
              <MaterialIcons name="storefront" size={28} color="#122117" />
            </View>
            <Text style={styles.h1}>
              Welcome, Oga! <Text style={{ fontSize: 20 }}>👋</Text>
            </Text>
            <Text style={styles.h2}>
              Let's get your shop running. Enter your details to start tracking
              sales.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Phone */}
            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputRow}>
                <View style={styles.country}>
                  <Text style={styles.flag}>🇳🇬</Text>
                  <Text style={styles.countryCode}>+234</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="80 1234 5678"
                  placeholderTextColor="#9AA0A6"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <View style={styles.iconWrap}>
                  <MaterialIcons name="smartphone" size={20} color="#9AA0A6" />
                </View>
              </View>
            </View>

            {/* Shop Name */}
            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Shop Name</Text>
                <View style={styles.newShopTag}>
                  <Text style={styles.newShopText}>New Shop?</Text>
                </View>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Mama Nkechi Store"
                  placeholderTextColor="#9AA0A6"
                  value={shopName}
                  onChangeText={setShopName}
                />
                <View style={styles.iconWrap}>
                  <MaterialIcons name="store" size={20} color="#9AA0A6" />
                </View>
              </View>
            </View>

            {/* Primary Action */}
            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && { opacity: 0.7 }]}
              activeOpacity={0.88}
              onPress={handleGetCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#062" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Get Code</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#072" />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.divider} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleGoogle}
              activeOpacity={0.9}
            >
              <View style={styles.googleIcon}>
                {/* Google glyph approximation */}
                <AntDesign name="google" size={18} color="#DB4437" />
              </View>
              <Text style={styles.googleText}>Google</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.smallText}>
              By tapping "Get Code", you agree to our{" "}
              <Text
                style={styles.link}
                onPress={() => openLink("https://example.com/terms")}
              >
                Terms
              </Text>{" "}
              and{" "}
              <Text
                style={styles.link}
                onPress={() => openLink("https://example.com/privacy")}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          <View style={{ height: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#122117" },
  ka: { flex: 1 },
  container: {
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 20) : 18,
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#29372e",
    alignItems: "center",
    justifyContent: "center",
  },
  pips: { flexDirection: "row", gap: 6, alignItems: "center" },
  pipActive: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: MAIN_GREEN,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: `${MAIN_GREEN}55`,
  },

  hero: { paddingVertical: 10, paddingHorizontal: 2 },
  brandCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#26ca75",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: MAIN_GREEN,
    shadowOpacity: 0.18,
    elevation: 6,
  },
  h1: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 6 },
  h2: { fontSize: 15, color: "#9aa19d", lineHeight: 20, maxWidth: 520 },

  form: { marginTop: 8, gap: 12 },
  field: { marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8, color: "#fff" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newShopTag: {
    backgroundColor: "#29372e",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  newShopText: { fontSize: 11, color: "#6B7280" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 999,
    backgroundColor: "#27312b",
    borderWidth: 1,
    borderColor: "#333c35",
    overflow: "hidden",
  },
  country: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 10,
    backgroundColor: "#27312b",
    borderRightWidth: 1,
    borderRightColor: "#333c35",
    height: "100%",
  },
  flag: { fontSize: 18, marginRight: 8 },
  countryCode: { fontSize: 15, color: "#fff", fontWeight: "600" },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 16, color: "#111" },
  iconWrap: { paddingHorizontal: 14 },

  primaryBtn: {
    marginTop: 12,
    height: 56,
    borderRadius: 999,
    backgroundColor: MAIN_GREEN,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",

    shadowColor: MAIN_GREEN,
    shadowOpacity: 0.18,
    elevation: 6,
  },
  primaryBtnText: {
    color: "#062",
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 6,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    marginBottom: 6,
  },
  divider: { height: 1, flex: 1, backgroundColor: "#E6E9E8" },
  dividerText: { fontSize: 11, color: "#9AA0A6", fontWeight: "700" },

  socialBtn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E9E8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  googleIcon: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  googleText: { fontSize: 15, color: "#111", fontWeight: "700" },

  footer: { marginTop: 18, paddingVertical: 10, alignItems: "center" },
  smallText: { color: "#9AA0A6", textAlign: "center", fontSize: 12 },
  link: { color: MAIN_GREEN, fontWeight: "700" },
});
