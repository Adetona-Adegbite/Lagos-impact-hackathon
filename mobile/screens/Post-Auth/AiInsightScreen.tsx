// src/screens/AIInsightsScreen.tsx
import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { authStorage } from "../../services/authStorage";
import { localizationService, t } from "../../utils/localization";
import {
  MainInsightsInput,
  MainInsightsOutput,
} from "../../src/types/insights";
import { insightsApi } from "../../services/api";

const { width } = Dimensions.get("window");
const PRIMARY = "#dd4f05";
const WARNING = "#eab308";
const DANGER = "#ef4444";
const CARD_DARK = "#1a1a1a";

type Range = "month" | "ytd";

export default function AIInsightsScreen({ navigation }: { navigation: any }) {
  const [range, setRange] = useState<Range>("month");
  const [query, setQuery] = useState("");
  const [shopName, setShopName] = useState("My Shop");

  const [insights, setInsights] = useState<MainInsightsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentLanguage = localizationService.getCurrentLanguage();

  useEffect(() => {
    const loadSettings = async () => {
      const authData = await authStorage.getAuthData();
      if (authData?.user?.shopName) {
        setShopName(authData.user.shopName);
      }
    };
    loadSettings();
  }, []); // Depend on [] so it runs once on mount

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        const authData = await authStorage.getAuthData();
        if (!authData?.token) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const result = await insightsApi.generateMainInsights(
          authData.token,
          currentLanguage,
        );
        setInsights(result);
      } catch (e: any) {
        setError(e.message || "Failed to fetch insights.");
      } finally {
        setLoading(false);
      }
    };

    if (shopName !== "My Shop") {
      fetchInsights();
    }
  }, [shopName, currentLanguage]); // Refetch if shopName or language changes

  const sampleWeekly = [40, 60, 30, 75, 90, 50, 20];

  const filteredNote = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return `Filtered by: "${q}"`;
  }, [query]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={() => navigation?.goBack?.()}
          >
            <MaterialIcons name="arrow-back" size={20} color="#111" />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeText}>{t("welcomeBack")}</Text>
            <Text style={styles.userName}>{shopName}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => console.log("scan tapped")}
        >
          <MaterialIcons name="qr-code-scanner" size={18} color="#dd4f05" />
          <Text style={styles.scanText}>Scan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>AI Insights Panel</Text>
          <Text style={styles.pageSubtitle}>
            Tax, compliance, and growth metrics.
          </Text>
        </View>

        {/* Date range toggle */}
        <View style={styles.rangeWrap}>
          <View style={styles.rangePills}>
            <TouchableOpacity
              style={[
                styles.rangePill,
                range === "month" && styles.rangePillActive,
              ]}
              onPress={() => setRange("month")}
            >
              <Text
                style={[
                  styles.rangeText,
                  range === "month" && styles.rangeTextActive,
                ]}
              >
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.rangePill,
                range === "ytd" && styles.rangePillActive,
              ]}
              onPress={() => setRange("ytd")}
            >
              <Text
                style={[
                  styles.rangeText,
                  range === "ytd" && styles.rangeTextActive,
                ]}
              >
                YTD
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <MaterialIcons name="search" size={18} color="#c4a898" />
            <TextInput
              placeholder="Search insights or products..."
              placeholderTextColor="#c4a898"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={PRIMARY}
            style={{ marginTop: 50 }}
          />
        ) : error ? (
          <View style={styles.auditCard}>
            <Text style={styles.auditTitle}>Error</Text>
            <Text style={styles.auditText}>{error}</Text>
          </View>
        ) : insights ? (
          <>
            {/* Business Direction Card */}
            <View style={styles.taxCard}>
              <View style={styles.taxTopRow}>
                <View style={styles.taxLeft}>
                  <View style={styles.iconBadge}>
                    <MaterialIcons name="insights" size={18} color={PRIMARY} />
                  </View>
                  <Text style={styles.taxLabel}>Business Direction</Text>
                </View>
              </View>
              <View style={styles.taxBody}>
                <Text style={styles.taxNote}>
                  {insights.business_direction}
                </Text>
                <Text
                  style={[
                    styles.taxNote,
                    { marginTop: 10, fontStyle: "italic" },
                  ]}
                >
                  {insights.closing_note}
                </Text>
              </View>
            </View>

            {/* Key Insights */}
            <View style={styles.auditCard}>
              <View style={styles.auditTop}>
                <View
                  style={[styles.auditIcon, { backgroundColor: "#fffbe6" }]}
                >
                  <MaterialIcons name="star" size={18} color="#f59e0b" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.auditTitle}>Key Insights</Text>
                </View>
              </View>
              {insights.key_insights.map((insight, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    marginTop: 8,
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <Text style={{ color: "#666", marginTop: 2 }}>•</Text>
                  <Text style={styles.auditText}>{insight}</Text>
                </View>
              ))}
            </View>

            {/* Prediction and Risks */}
            <View style={styles.metricsGrid}>
              <View style={styles.largeCard}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View style={styles.purpleIcon}>
                    <MaterialIcons
                      name="online-prediction"
                      size={18}
                      color="#7c3aed"
                    />
                  </View>
                  <Text style={styles.cardTitleSmall}>
                    Near-Term Prediction
                  </Text>
                </View>
                <Text style={[styles.smallNote, { marginTop: 8 }]}>
                  {insights.near_term_prediction}
                </Text>
              </View>

              {insights.risk_alerts.length > 0 && (
                <View style={styles.largeCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <View
                      style={[styles.tealIcon, { backgroundColor: "#fee2e2" }]}
                    >
                      <MaterialIcons name="warning" size={18} color="#ef4444" />
                    </View>
                    <Text style={styles.cardTitleSmall}>Risk Alerts</Text>
                  </View>
                  {insights.risk_alerts.map((alert, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.smallNote,
                        { marginTop: 4, color: "#7f1d1d" },
                      ]}
                    >
                      - {alert}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            {/* Recommended Actions */}
            <View style={styles.auditCard}>
              <View style={styles.auditTop}>
                <View
                  style={[styles.auditIcon, { backgroundColor: "#fff2ec" }]}
                >
                  <MaterialIcons name="task-alt" size={18} color="#dd4f05" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.auditTitle}>Recommended Actions</Text>
                </View>
              </View>
              {insights.recommended_actions.map((action, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    marginTop: 8,
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <Text style={{ color: "#dd4f05", marginTop: 2 }}>✓</Text>
                  <Text style={styles.auditText}>{action}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {filteredNote ? (
          <Text style={styles.filteredNote}>{filteredNote}</Text>
        ) : null}
      </ScrollView>

      {/* Floating AI FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => console.log("ask ai")}
      >
        <MaterialCommunityIcons name="robot" size={22} color="#dd4f05" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderColor: "#e6e9e8",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: { fontSize: 12, color: "#c4a898" },
  userName: { fontSize: 16, fontWeight: "800", color: "#fff" },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff2ec",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scanText: { color: "#dd4f05", fontWeight: "800", marginLeft: 8 },
  scroll: { flex: 1 },

  titleContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  pageTitle: { fontSize: 22, fontWeight: "900", color: "#fff" },
  pageSubtitle: { fontSize: 13, color: "#fff", marginTop: 4 },

  rangeWrap: { paddingHorizontal: 16, marginBottom: 12 },
  rangePills: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 4,
    width: "48%",
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  rangePillActive: {
    backgroundColor: "#121212",
    shadowColor: "#fff",
    elevation: 2,
  },
  rangeText: { color: "#fff", fontWeight: "700" },
  rangeTextActive: { color: "#fff" },

  searchRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    borderRadius: 999,
    height: 44,
    paddingHorizontal: 12,
    // borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, color: "#fff" },

  taxCard: {
    margin: 16,
    borderRadius: 14,
    backgroundColor: "#1c1c1c",
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef2f4",
    shadowColor: "#fff",
    shadowOpacity: 0.03,
    elevation: 2,
  },
  taxTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taxLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff2ec",
    alignItems: "center",
    justifyContent: "center",
  },
  taxLabel: { fontWeight: "800", fontSize: 15, color: "#fff" },
  tagHealthy: {
    backgroundColor: "#fff2ec",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagHealthyText: { color: "#dd4f05", fontWeight: "800", fontSize: 12 },

  taxBody: { marginTop: 12 },
  taxScoreRow: { flexDirection: "row", alignItems: "baseline" },
  taxScore: { fontSize: 36, fontWeight: "900", color: "#fff" },
  taxMax: { marginLeft: 8, color: "#6b7280", fontWeight: "700" },
  progressTrack: {
    height: 10,
    backgroundColor: "#eef2f4",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: { height: "100%", backgroundColor: PRIMARY },

  taxNote: { marginTop: 8, color: "#6b7280" },

  metricsGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#1c1c1c",
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2f4",
  },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricTitle: { fontWeight: "700", fontSize: 13 },
  metricValue: { fontSize: 16, fontWeight: "900", marginTop: 8, color: "#fff" },
  metricFooter: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  metricFooterText: { color: WARNING, fontSize: 12, marginLeft: 6 },
  metricFooterRight: { flexDirection: "row", justifyContent: "space-between" },
  metricFooterTextSmall: { fontSize: 12, color: "#6b7280" },

  smallProgressWrap: {
    height: 8,
    backgroundColor: "#eef2f4",
    borderRadius: 999,
    overflow: "hidden",
  },
  smallProgressFill: { height: "100%", backgroundColor: "#2563eb" },

  auditCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#fff2f2",
    padding: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  auditTop: { flexDirection: "row", alignItems: "center" },
  auditIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  auditTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  auditTitle: { fontWeight: "800", fontSize: 14 },
  auditText: { marginTop: 6, color: "#6b7280" },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: DANGER,
    marginLeft: 8,
  },

  auditAvatars: { flexDirection: "row", marginTop: 10, alignItems: "center" },
  avatarTx: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 10, fontWeight: "900", color: "#fff" },

  reviewBtn: {
    marginTop: 12,
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  reviewBtnText: { color: DANGER, fontWeight: "900" },

  largeCard: {
    flex: 1,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "#1c1c1c",
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2f4",
  },
  purpleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleSmall: { fontWeight: "800", color: "#fff" },
  largeStat: { fontSize: 18, fontWeight: "900", color: "#fff" },
  smallStat: { fontSize: 12, color: "#dd4f05", fontWeight: "700" },

  sparkBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
    gap: 6,
  },
  spark: { flex: 1, borderRadius: 4, marginHorizontal: 4 },

  tealIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#ecfeff",
    alignItems: "center",
    justifyContent: "center",
  },
  smallNote: { marginTop: 8, color: "#6b7280", fontSize: 12 },
  deductionYes: {
    backgroundColor: "#fff2ec",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deductionYesText: { color: "#dd4f05", fontWeight: "900", marginTop: 6 },

  filteredNote: {
    paddingHorizontal: 16,
    color: "#6b7280",
    fontStyle: "italic",
  },

  fab: {
    position: "absolute",
    bottom: 28,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff2ec",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  /* small helpers */
  cardTitle: { fontWeight: "800", fontSize: 14 },
  bold: { fontWeight: "800" },
});
