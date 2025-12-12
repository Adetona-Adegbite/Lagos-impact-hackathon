// src/screens/CreditProfileScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const { width } = Dimensions.get("window");
const PRIMARY = "#36e27b";
const SURFACE = "#1a2c22";
const SURFACE_BORDER = "#2f4538";
const BG = "#122117";

type Tx = {
  id: string;
  date: string;
  desc: string;
  amount: number;
  type: "in" | "out";
};

const SAMPLE_TX: Tx[] = [
  {
    id: "t1",
    date: "2023-10-01",
    desc: "Sales - Cash",
    amount: 320000,
    type: "in",
  },
  {
    id: "t2",
    date: "2023-10-03",
    desc: "Stock Purchase",
    amount: 85000,
    type: "out",
  },
  {
    id: "t3",
    date: "2023-10-08",
    desc: "Sales - POS",
    amount: 450000,
    type: "in",
  },
  { id: "t4", date: "2023-10-12", desc: "Deposit", amount: 120000, type: "in" },
];

export default function CreditProfileScreen({
  navigation,
}: {
  navigation?: any;
}) {
  const [period] = useState<string>("Last 6 months");
  const [score] = useState<number>(780);

  /* ---------- CSV export ---------- */
  const exportCSV = async () => {
    try {
      const header = ["id", "date", "description", "amount", "type"].join(",");
      const rows = SAMPLE_TX.map((t) =>
        [t.id, t.date, `"${t.desc}"`, t.amount, t.type].join(",")
      );
      const csv = [header, ...rows].join("\n");

      const filename = `credit-profile-${period.replace(/\s+/g, "-")}.csv`;
      const baseDir =
        (FileSystem as any).documentDirectory ??
        (FileSystem as any).cacheDirectory ??
        "";
      if (!baseDir) {
        Alert.alert("Storage error", "No writable directory found on device.");
        return;
      }
      const filepath = `${baseDir}${filename}`;

      await (FileSystem as any).writeAsStringAsync(filepath, csv, {
        encoding: (FileSystem as any).EncodingType?.UTF8 ?? undefined,
      });

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Saved", `CSV saved to: ${filepath}`);
        return;
      }

      await Sharing.shareAsync(filepath, {
        mimeType: "text/csv",
        dialogTitle: `Credit Profile CSV - ${period}`,
      });
    } catch (err: any) {
      console.error("CSV export error", err);
      Alert.alert("Export failed", err?.message ?? String(err));
    }
  };

  /* ---------- PDF export ---------- */
  const exportPDF = async () => {
    try {
      const rowsHtml = SAMPLE_TX.map(
        (t) => `
        <tr>
          <td style="padding:8px;border:1px solid #eee">${t.id}</td>
          <td style="padding:8px;border:1px solid #eee">${t.date}</td>
          <td style="padding:8px;border:1px solid #eee">${t.desc}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:right">₦${t.amount.toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:center">${
            t.type
          }</td>
        </tr>`
      ).join("");

      const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
          <style>
            body { font-family: -apple-system, Roboto, Arial, sans-serif; color: #0f172a; padding: 18px; }
            h1 { margin:0 0 6px 0; font-size:20px; }
            .meta { color:#6b7280; margin-bottom:12px; }
            table { width:100%; border-collapse:collapse; margin-top:12px; }
            th, td { border:1px solid #eee; padding:8px; font-size:12px; }
            th { background:#fafafa; text-align:left; }
          </style>
        </head>
        <body>
          <h1>Credit Profile Report</h1>
          <div class="meta">Period: ${period} • Score: ${score}</div>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Date</th><th>Description</th><th style="text-align:right">Amount</th><th style="text-align:center">Type</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>`;

      const { uri } = await Print.printToFileAsync({ html });

      const filename = `credit-profile-${period.replace(/\s+/g, "-")}.pdf`;
      const baseDir =
        (FileSystem as any).documentDirectory ??
        (FileSystem as any).cacheDirectory ??
        "";
      if (!baseDir) {
        Alert.alert("Storage error", "No writable directory found on device.");
        return;
      }
      const target = `${baseDir}${filename}`;

      if (Platform.OS === "android") {
        await (FileSystem as any).copyAsync({ from: uri, to: target });
      } else {
        try {
          await (FileSystem as any).moveAsync({ from: uri, to: target });
        } catch {
          await (FileSystem as any).copyAsync({ from: uri, to: target });
        }
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Saved", `PDF saved to ${target}`);
        return;
      }

      await Sharing.shareAsync(target, {
        mimeType: "application/pdf",
        dialogTitle: `Credit Profile PDF - ${period}`,
      });
    } catch (err: any) {
      console.error("PDF export error", err);
      Alert.alert("Export failed", err?.message ?? String(err));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.iconBtn}
        >
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Credit Profile</Text>

        <TouchableOpacity
          onPress={() => Alert.alert("Share", "Share profile")}
          style={styles.iconBtn}
        >
          <MaterialIcons name="share" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <View style={styles.ringWrap}>
            <View style={styles.ringInner}>
              <Text style={styles.aiLabel}>AI Score</Text>
              <Text style={styles.scoreText}>{score}</Text>
              <View style={styles.scoreBadge}>
                <MaterialIcons name="verified" size={14} color={PRIMARY} />
                <Text style={styles.badgeText}>Excellent Stability</Text>
              </View>
            </View>
          </View>
          <Text style={styles.heroSub}>
            Based on 6 months of transaction history, inventory turnover, and
            cash flow consistency.
          </Text>
        </View>

        {/* Risk Flags */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Risk Analysis</Text>
          <View style={styles.flagPill}>
            <Text style={styles.flagText}>Action Required</Text>
          </View>
        </View>

        <View style={styles.riskCard}>
          <TouchableOpacity
            style={styles.riskSummary}
            activeOpacity={0.9}
            onPress={() => {}}
          >
            <View style={styles.riskLeft}>
              <MaterialIcons name="warning" size={20} color="#f59e0b" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.riskTitle}>2 Risk Flags Detected</Text>
                <Text style={styles.riskSub}>
                  Review flagged items to keep your score healthy
                </Text>
              </View>
            </View>
            <MaterialIcons name="expand-more" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <View style={styles.riskList}>
            <View style={styles.riskRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.riskItemTitle}>High Return Rate (15%)</Text>
                <Text style={styles.riskItemSub}>
                  Observed last week. Check inventory quality for "Electronics".
                </Text>
              </View>
            </View>

            <View style={styles.riskRow}>
              <View style={styles.dot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.riskItemTitle}>Irregular Deposits</Text>
                <Text style={styles.riskItemSub}>
                  Cash deposits on Tuesdays dropped by 40% vs average.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Financial Health Grid */}
        <View style={styles.gridHeader}>
          <Text style={styles.sectionTitle}>Financial Health</Text>
          <TouchableOpacity
            onPress={() => Alert.alert("Report", "Open full report")}
          >
            <Text style={styles.viewReport}>View Full Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Avg. Monthly Income</Text>
            <Text style={styles.gridValue}>₦450,000</Text>
            <View style={styles.gridDelta}>
              <MaterialIcons name="trending-up" size={14} color={PRIMARY} />
              <Text style={styles.gridDeltaText}>+12%</Text>
            </View>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Stability Rating</Text>
            <Text style={styles.gridValue}>Grade A</Text>
            <Text style={styles.gridSmall}>Top 10% of shops</Text>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Peak Sales</Text>
            <View style={styles.row}>
              <MaterialIcons name="schedule" size={18} color="#fff" />
              <Text style={styles.gridValue}>Fri, 6-9 PM</Text>
            </View>
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.gridLabel}>Returning Customers</Text>
            <View style={styles.row}>
              <MaterialIcons name="groups" size={18} color="#fff" />
              <Text style={styles.gridValue}>85%</Text>
            </View>
          </View>
        </View>

        {/* Trends */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.trendTitle}>Income Trend (6 Months)</Text>
            <Text style={styles.trendSub}>Last updated today</Text>
          </View>

          <View style={styles.trendBars}>
            {[
              { label: "May", h: 40 },
              { label: "Jun", h: 55 },
              { label: "Jul", h: 45 },
              { label: "Aug", h: 70 },
              { label: "Sep", h: 60 },
              { label: "Oct", h: 90 },
            ].map((b, i) => (
              <View key={i} style={styles.trendBarWrap}>
                <View
                  style={[
                    styles.trendBar,
                    i === 5 ? styles.trendBarActive : null,
                    { height: `${b.h}%` },
                  ]}
                />
                <Text
                  style={[
                    styles.trendLabel,
                    i === 5 ? styles.trendLabelActive : null,
                  ]}
                >
                  {b.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Narrative */}
        <View style={styles.narrative}>
          <View style={styles.narrativeIcon}>
            <MaterialIcons name="auto-awesome" size={18} color={PRIMARY} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.narrativeTitle}>AI Credit Insight</Text>
            <Text style={styles.narrativeText}>
              Your shop shows strong recurring revenue from staple goods. This
              profile is optimized for micro-loan approval with{" "}
              <Text style={{ fontWeight: "700" }}>92% confidence</Text>.
            </Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Export Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.pdfBtn]}
          onPress={exportPDF}
        >
          <MaterialIcons name="picture-as-pdf" size={18} color="#111" />
          <Text style={styles.bottomBtnText}>PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, styles.csvBtn]}
          onPress={exportCSV}
        >
          <MaterialIcons name="ios-share" size={18} color="#fff" />
          <Text style={[styles.bottomBtnText, { color: "#fff" }]}>
            Export CSV
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BG,
    borderBottomWidth: 0.4,
    borderBottomColor: "#e6e9e8",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },

  content: { padding: 16, paddingBottom: 180 },

  heroWrap: { alignItems: "center", marginBottom: 18 },
  ringWrap: {
    width: Math.min(320, width - 48),
    height: Math.min(320, width - 48),
    borderRadius: 999,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: SURFACE_BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: PRIMARY,
    shadowOpacity: 0.12,
    elevation: 6,
  },
  ringInner: { alignItems: "center", justifyContent: "center" },
  aiLabel: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  scoreText: { fontSize: 56, fontWeight: "900", color: "#fff" },
  scoreBadge: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderColor: SURFACE_BORDER,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { color: "#cbd5c6", marginLeft: 6, fontSize: 12 },

  heroSub: {
    marginTop: 10,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 420,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111" },
  flagPill: {
    backgroundColor: "rgba(245,158,11,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },
  flagText: { color: "#f59e0b", fontWeight: "700", fontSize: 12 },

  riskCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  riskSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  riskLeft: { flexDirection: "row", alignItems: "center" },
  riskTitle: { fontWeight: "800", color: "#111" },
  riskSub: { color: "#6b7280", fontSize: 12 },
  riskList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#fff6ea",
  },
  riskRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#f59e0b",
    marginTop: 6,
  },
  riskItemTitle: { fontWeight: "700", color: "#111" },
  riskItemSub: { color: "#6b7280", fontSize: 12 },

  gridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  viewReport: { color: PRIMARY, fontWeight: "700" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between" as any,
  },
  gridCard: {
    width: "48%",
    backgroundColor: SURFACE,
    borderColor: SURFACE_BORDER,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  gridLabel: { color: "#9eb7a8", fontSize: 12 },
  gridValue: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 6 },
  gridSmall: { color: "#9eb7a8", fontSize: 12 },
  gridDelta: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  gridDeltaText: { color: PRIMARY, fontWeight: "700", marginLeft: 6 },

  row: { flexDirection: "row", alignItems: "center", gap: 8 },

  trendCard: {
    backgroundColor: SURFACE,
    borderColor: SURFACE_BORDER,
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  trendTitle: { color: "#fff", fontWeight: "800" },
  trendSub: { color: "#9eb7a8", fontSize: 12 },
  trendBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 8,
  },
  trendBarWrap: { flex: 1, alignItems: "center" as any },
  trendBar: {
    width: "100%",
    backgroundColor: "rgba(54,226,123,0.2)",
    borderRadius: 6,
  },
  trendBarActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    elevation: 6,
  },
  trendLabel: { color: "#9eb7a8", fontSize: 10, marginTop: 6 },
  trendLabelActive: { color: "#fff", fontWeight: "800" },

  narrative: {
    marginTop: 12,
    backgroundColor: SURFACE,
    borderColor: SURFACE_BORDER,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  narrativeIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(54,226,123,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  narrativeTitle: { color: "#fff", fontWeight: "800" },
  narrativeText: { color: "#9eb7a8", marginTop: 4 },

  bottomBar: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 18,
    flexDirection: "row",
    gap: 12,
  },
  bottomBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  pdfBtn: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e6e9e8",
  },
  csvBtn: { backgroundColor: PRIMARY },
  bottomBtnText: { color: "#111", fontWeight: "800", marginLeft: 6 },
});
