// src/screens/AIInsightsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const PRIMARY = "#36e27b";
const WARNING = "#eab308";
const DANGER = "#ef4444";
const CARD_DARK = "#1a2c24";

type Range = "month" | "ytd";

export default function AIInsightsScreen({ navigation }: { navigation: any }) {
  const [range, setRange] = useState<Range>("month");
  const [query, setQuery] = useState("");

  const sampleWeekly = [40, 60, 30, 75, 90, 50, 20];
  const taxScore = 85;
  const estVAT = 42500;
  const turnover = 18200000;

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
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Oga Emmanuel</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => console.log("scan tapped")}
        >
          <MaterialIcons name="qr-code-scanner" size={18} color="#062" />
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
            <MaterialIcons name="search" size={18} color="#9EB7A8" />
            <TextInput
              placeholder="Search insights or products..."
              placeholderTextColor="#9EB7A8"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Tax Compliance card */}
        <TouchableOpacity activeOpacity={0.95} style={styles.taxCard}>
          <View style={styles.taxTopRow}>
            <View style={styles.taxLeft}>
              <View style={styles.iconBadge}>
                <MaterialIcons name="verified-user" size={18} color={PRIMARY} />
              </View>
              <Text style={styles.taxLabel}>Tax Compliance Score</Text>
            </View>
            <View>
              <View style={styles.tagHealthy}>
                <Text style={styles.tagHealthyText}>Healthy</Text>
              </View>
            </View>
          </View>

          <View style={styles.taxBody}>
            <View style={styles.taxScoreRow}>
              <Text style={styles.taxScore}>{taxScore}</Text>
              <Text style={styles.taxMax}>/ 100</Text>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${taxScore}%` }]} />
            </View>

            <Text style={styles.taxNote}>
              Your business is compliant. Keep recording expenses & receipts to
              maintain score.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Two metric cards */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity style={styles.metricCard}>
            <View style={styles.metricRow}>
              <MaterialIcons name="account-balance" size={18} color="#0f172a" />
              <Text style={styles.metricTitle}>Est. VAT Liability</Text>
            </View>
            <Text style={styles.metricValue}>₦ {estVAT.toLocaleString()}</Text>
            <View style={styles.metricFooter}>
              <MaterialIcons name="warning" size={12} color={WARNING} />
              <Text style={styles.metricFooterText}> Due in 12 days</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.metricCard}>
            <View style={styles.metricRow}>
              <MaterialIcons name="monitor" size={18} color="#0f172a" />
              <Text style={styles.metricTitle}>Annual Turnover</Text>
            </View>
            <Text style={styles.metricValue}>
              ₦ {turnover.toLocaleString()}
            </Text>
            <View style={{ marginTop: 10 }}>
              <View style={styles.smallProgressWrap}>
                <View style={[styles.smallProgressFill, { width: "72%" }]} />
              </View>
              <View style={styles.metricFooterRight}>
                <Text style={styles.metricFooterTextSmall}>
                  Progress to 25M cap
                </Text>
                <Text style={styles.metricFooterTextSmall}>72%</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Audit Readiness */}
        <View style={styles.auditCard}>
          <View style={styles.auditTop}>
            <View style={styles.auditIcon}>
              <MaterialIcons name="policy" size={18} color={DANGER} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.auditTitleRow}>
                <Text style={styles.auditTitle}>Audit Readiness Alert</Text>
                <View style={styles.pulseDot} />
              </View>
              <Text style={styles.auditText}>
                Found <Text style={styles.bold}>3 high-value transactions</Text>{" "}
                missing digital receipts or tax tags.
              </Text>
            </View>
          </View>

          <View style={styles.auditAvatars}>
            <View style={styles.avatarTx}>
              <Text style={styles.avatarText}>TX</Text>
            </View>
            <View
              style={[
                styles.avatarTx,
                { marginLeft: -8, backgroundColor: "#e5e7eb" },
              ]}
            >
              <Text style={styles.avatarText}>TX</Text>
            </View>
            <View
              style={[
                styles.avatarTx,
                { marginLeft: -8, backgroundColor: "#fee2e2" },
              ]}
            >
              <Text style={styles.avatarText}>+1</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.reviewBtn}>
            <Text style={styles.reviewBtnText}>Review Missing Items</Text>
          </TouchableOpacity>
        </View>

        {/* Profit / Deductions grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.largeCard}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View style={styles.purpleIcon}>
                <MaterialIcons name="trending-up" size={18} color="#7c3aed" />
              </View>
              <Text style={styles.cardTitleSmall}>Profit Consistency</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Text style={styles.largeStat}>Stable</Text>
              <Text style={styles.smallStat}>+2.4% vs last mo</Text>
            </View>
            <View style={styles.sparkBars}>
              <View
                style={[
                  styles.spark,
                  { height: "40%", backgroundColor: "#e9d5ff" },
                ]}
              />
              <View
                style={[
                  styles.spark,
                  { height: "60%", backgroundColor: "#ddd6fe" },
                ]}
              />
              <View
                style={[
                  styles.spark,
                  { height: "50%", backgroundColor: "#c7b2ff" },
                ]}
              />
              <View
                style={[
                  styles.spark,
                  { height: "75%", backgroundColor: "#a78bfa" },
                ]}
              />
            </View>
          </View>

          <View style={styles.largeCard}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View style={styles.tealIcon}>
                <MaterialIcons name="savings" size={18} color="#0f766e" />
              </View>
              <Text style={styles.cardTitleSmall}>Deductions Finder</Text>
            </View>
            <Text style={styles.smallNote}>
              Is "Generator Fuel" deductible?
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <View style={styles.deductionYes}>
                <MaterialIcons name="check-circle" size={20} color="#059669" />
                <Text style={styles.deductionYesText}>YES</Text>
              </View>
              <View style={{ flex: 1, justifyContent: "center" }}>
                {/* <Text style={styles.smallNoteMuted}>
                 */}
                <Text>Valid business expense.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sales Overview */}
        <View style={styles.salesOverview}>
          <View style={styles.salesHeader}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <MaterialIcons name="bar-chart" size={18} color="#111" />
              <Text style={styles.cardTitleSmall}>Sales Overview</Text>
            </View>
            <Text style={styles.largeStat}>₦ 154,200</Text>
          </View>

          <View style={styles.weeklyGraph}>
            {sampleWeekly.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.weeklyBar,
                  {
                    height: `${h}%`,
                    backgroundColor: i === 4 ? PRIMARY : "#E5E7EB",
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {filteredNote ? (
          <Text style={styles.filteredNote}>{filteredNote}</Text>
        ) : null}
      </ScrollView>

      {/* Floating AI FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => console.log("ask ai")}
      >
        <MaterialCommunityIcons name="robot" size={22} color="#062" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
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
  welcomeText: { fontSize: 12, color: "#9eb7a8" },
  userName: { fontSize: 16, fontWeight: "800", color: "#111" },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scanText: { color: "#064e3b", fontWeight: "800", marginLeft: 8 },
  scroll: { flex: 1 },

  titleContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  pageTitle: { fontSize: 22, fontWeight: "900", color: "#111" },
  pageSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },

  rangeWrap: { paddingHorizontal: 16, marginBottom: 12 },
  rangePills: {
    flexDirection: "row",
    backgroundColor: "#e9eef0",
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
    backgroundColor: "#fff",
    shadowColor: "#000",
    elevation: 2,
  },
  rangeText: { color: "#6b7280", fontWeight: "700" },
  rangeTextActive: { color: "#111" },

  searchRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#eef2f4",
  },
  searchInput: { flex: 1, marginLeft: 8, color: "#111" },

  taxCard: {
    margin: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    padding: 14,
    borderWidth: 1,
    borderColor: "#eef2f4",
    shadowColor: "#000",
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
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  taxLabel: { fontWeight: "800", fontSize: 15, color: "#111" },
  tagHealthy: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagHealthyText: { color: "#065f46", fontWeight: "800", fontSize: 12 },

  taxBody: { marginTop: 12 },
  taxScoreRow: { flexDirection: "row", alignItems: "baseline" },
  taxScore: { fontSize: 36, fontWeight: "900", color: "#111" },
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
    backgroundColor: "#fff",
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2f4",
  },
  metricRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricTitle: { fontWeight: "700", fontSize: 13 },
  metricValue: { fontSize: 16, fontWeight: "900", marginTop: 8, color: "#111" },
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
  avatarText: { fontSize: 10, fontWeight: "900", color: "#111" },

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
    backgroundColor: "#fff",
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
  cardTitleSmall: { fontWeight: "800", color: "#111" },
  largeStat: { fontSize: 18, fontWeight: "900", color: "#111" },
  smallStat: { fontSize: 12, color: "#059669", fontWeight: "700" },

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
    backgroundColor: "#ecfdf5",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deductionYesText: { color: "#065f46", fontWeight: "900", marginTop: 6 },

  salesOverview: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderWidth: 1,
    borderColor: "#eef2f4",
  },
  salesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weeklyGraph: {
    flexDirection: "row",
    height: 120,
    alignItems: "flex-end",
    marginTop: 12,
    gap: 6,
  },
  weeklyBar: { flex: 1, marginHorizontal: 4, borderRadius: 6 },

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
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  /* small helpers */
  cardTitle: { fontWeight: "800", fontSize: 14 },
  bold: { fontWeight: "800" },
});
