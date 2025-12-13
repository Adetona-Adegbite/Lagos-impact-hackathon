// src/screens/TaxExportScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";

const { width } = Dimensions.get("window");
const PRIMARY = "#36e27b";
const ORANGE = "#F97316";

type Receipt = {
  id: string;
  date: string;
  method: string;
  total: number;
  vat: number;
};

const SAMPLE_RECEIPTS: Receipt[] = [
  { id: "r1", date: "2023-10-01", method: "Cash", total: 3200, vat: 200 },
  { id: "r2", date: "2023-10-02", method: "POS", total: 8500, vat: 510 },
  { id: "r3", date: "2023-10-03", method: "Transfer", total: 12400, vat: 744 },
];

export default function TaxExportScreen({ navigation }: { navigation?: any }) {
  const [period, setPeriod] = useState<string>("October 2023");

  /* ---------- CSV export ---------- */
  const exportCSV = async () => {
    try {
      const header = ["id", "date", "method", "total", "vat"].join(",");
      const rows = SAMPLE_RECEIPTS.map((r) =>
        [r.id, r.date, r.method, r.total, r.vat].join(","),
      );
      const csv = [header, ...rows].join("\n");

      const filename = `tax-export-${period.replace(/\s+/g, "-")}.csv`;

      // Use documentDirectory if available, else fallback to cacheDirectory or empty string.
      const baseDir =
        (FileSystem as any).documentDirectory ??
        (FileSystem as any).cacheDirectory ??
        "";
      if (!baseDir) {
        // As a last resort, try writing to cacheDirectory without type errors
        Alert.alert(
          "Storage path missing",
          "Could not find a suitable file directory on this device.",
        );
        return;
      }
      const filepath = `${baseDir}${filename}`;

      await FileSystem.writeAsStringAsync(
        filepath,
        csv /*, { encoding: (FileSystem as any).EncodingType?.UTF8 } */,
      );

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert("CSV saved", `Saved to ${filepath}`);
        return;
      }

      await Sharing.shareAsync(filepath, {
        mimeType: "text/csv",
        dialogTitle: `Export CSV - ${period}`,
      });
    } catch (err: any) {
      console.error("CSV export error", err);
      Alert.alert("Export failed", err?.message ?? String(err));
    }
  };

  /* ---------- PDF export ---------- */
  const exportPDF = async () => {
    try {
      const rowsHtml = SAMPLE_RECEIPTS.map(
        (r) => `
        <tr>
          <td style="padding:8px;border:1px solid #eee">${r.id}</td>
          <td style="padding:8px;border:1px solid #eee">${r.date}</td>
          <td style="padding:8px;border:1px solid #eee">${r.method}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:right">₦${r.total.toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #eee;text-align:right">₦${r.vat.toLocaleString()}</td>
        </tr>
      `,
      ).join("");

      const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width,initial-scale=1"/>
        </head>
        <body style="font-family: Arial, Helvetica, sans-serif; padding:20px; color:#0f172a">
          <h2 style="margin:0 0 12px 0">Tax Export - ${period}</h2>
          <table style="width:100%; border-collapse:collapse; margin-top:12px">
            <thead>
              <tr>
                <th style="padding:8px;border:1px solid #eee;text-align:left">ID</th>
                <th style="padding:8px;border:1px solid #eee;text-align:left">Date</th>
                <th style="padding:8px;border:1px solid #eee;text-align:left">Method</th>
                <th style="padding:8px;border:1px solid #eee;text-align:right">Total</th>
                <th style="padding:8px;border:1px solid #eee;text-align:right">VAT</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

      // Generate PDF file (returns a URI)
      const { uri } = await Print.printToFileAsync({ html });

      // target path where we'll store the PDF for sharing
      const filename = `tax-export-${period.replace(/\s+/g, "-")}.pdf`;
      const baseDir =
        (FileSystem as any).documentDirectory ??
        (FileSystem as any).cacheDirectory ??
        "";
      if (!baseDir) {
        Alert.alert(
          "Storage path missing",
          "Could not find a suitable file directory on this device.",
        );
        return;
      }
      const target = `${baseDir}${filename}`;

      // On Android printToFileAsync may return a content URI or a tmp file — copy it to our target path
      if (Platform.OS === "android") {
        // copyAsync expects real file paths; cast to any to avoid TS issues in environments with old types
        await (FileSystem as any).copyAsync({ from: uri, to: target });
      } else {
        // on iOS move is preferable, but fall back to copy if move fails
        try {
          await (FileSystem as any).moveAsync({ from: uri, to: target });
        } catch {
          await (FileSystem as any).copyAsync({ from: uri, to: target });
        }
      }

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert("PDF saved", `Saved to ${target}`);
        return;
      }

      await Sharing.shareAsync(target, {
        mimeType: "application/pdf",
        dialogTitle: `Export PDF - ${period}`,
      });
    } catch (err: any) {
      console.error("PDF export error", err);
      Alert.alert("Export failed", err?.message ?? String(err));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.iconBtn}
        >
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tax Export</Text>

        <TouchableOpacity
          onPress={() => console.log("help")}
          style={styles.iconBtn}
        >
          <MaterialIcons name="help-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Period selector */}
        <View style={styles.centerRow}>
          <TouchableOpacity
            style={styles.periodChip}
            onPress={() => {
              /* open your period picker */
              Alert.alert("Period picker", "Open period selector here");
            }}
          >
            <MaterialIcons
              name="calendar-month"
              size={18}
              color="#6b7280"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.periodText}>{period}</Text>
            <MaterialIcons
              name="expand-more"
              size={18}
              color="#6b7280"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>

        {/* Action Panel */}
        <View style={styles.actionPanel}>
          <View style={{ flex: 1 }}>
            <View style={styles.actionBadgeRow}>
              <MaterialIcons name="warning" size={18} color={ORANGE} />
              <Text style={styles.actionBadgeText}>Action Needed</Text>
            </View>
            <Text style={styles.actionTitle}>8 receipts missing VAT</Text>
            <Text style={styles.actionSubtitle}>
              AI Compliance Check found issues that need your attention before
              export.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.fixButton}
            onPress={() => Alert.alert("Review & Fix", "Open review UI")}
          >
            <Text style={styles.fixButtonText}>Review & Fix Issues</Text>
          </TouchableOpacity>
        </View>

        {/* Tax Summary */}
        <View style={styles.sectionHeader}>
          <MaterialIcons name="auto-awesome" size={18} color={PRIMARY} />
          <Text style={styles.sectionTitle}>Tax Summary</Text>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>AI Auto-Filled</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Turnover</Text>
              <Text style={styles.summaryValue}>₦ 1,250,000</Text>
            </View>

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>VAT Output</Text>
              <View style={styles.rowAlign}>
                <Text style={styles.summaryValue}>₦ 93,750</Text>
                <MaterialIcons
                  name="auto-awesome"
                  size={18}
                  color={PRIMARY}
                  style={{ marginLeft: 6 }}
                />
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>₦ 400,000</Text>
            </View>

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Est. Tax Due</Text>
              <Text style={[styles.summaryValue, { color: PRIMARY }]}>
                ₦ 75,000
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => Alert.alert("Edit values", "Open manual edit UI")}
          >
            <MaterialIcons name="edit" size={16} color="#6b7280" />
            <Text style={styles.editText}>Edit Values Manually</Text>
          </TouchableOpacity>
        </View>

        {/* Prediction */}
        <View style={styles.predictCard}>
          <View style={styles.predictHeader}>
            <View style={styles.predictIconWrap}>
              <MaterialIcons name="insights" size={18} color={PRIMARY} />
            </View>
            <Text style={styles.predictTitle}>Next Month's Forecast</Text>
          </View>

          <Text style={styles.predictText}>
            Based on recent sales trends, set aside approximately{" "}
            <Text style={{ fontWeight: "800" }}>₦ 105,000</Text> for next
            month’s tax.
          </Text>

          <View style={styles.predictTrack}>
            <View style={[styles.predictFill, { width: "75%" }]} />
          </View>
          <Text style={styles.predictConfidence}>High Confidence</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action bar */}
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
          <MaterialIcons name="ios-share" size={18} color="#111" />
          <Text style={[styles.bottomBtnText, { color: "#111" }]}>
            Export CSV
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#122117",
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    borderBottomWidth: 0.3,
    borderColor: "#e6e9e8",
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },

  content: { padding: 16, paddingBottom: 200 },

  centerRow: { alignItems: "center", marginBottom: 12 },
  periodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eef2f4",
    shadowColor: "#000",
    elevation: 1,
  },
  periodText: { color: "#111", fontWeight: "700" },

  actionPanel: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  actionBadgeText: { color: ORANGE, fontWeight: "800", fontSize: 12 },
  actionTitle: {
    fontWeight: "900",
    fontSize: 18,
    color: "#fff",
    marginBottom: 4,
  },
  actionSubtitle: { color: "#6b7280", fontSize: 13, marginBottom: 8 },

  fixButton: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 8,
  },
  fixButtonText: { color: "#fff", fontWeight: "800" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  aiTag: {
    marginLeft: "auto",
    backgroundColor: PRIMARY + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiTagText: { color: PRIMARY, fontWeight: "800", fontSize: 11 },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eef2f4",
    padding: 14,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCol: { flex: 1 },
  summaryLabel: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  summaryValue: { fontSize: 16, fontWeight: "900", color: "#111" },
  rowAlign: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, backgroundColor: "#eef2f4", marginVertical: 12 },

  editBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editText: { marginLeft: 8, color: "#6b7280", fontWeight: "700" },

  predictCard: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e6e9e8",
    marginBottom: 24,
  },
  predictHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  predictIconWrap: {
    backgroundColor: PRIMARY + "20",
    padding: 6,
    borderRadius: 8,
  },
  predictTitle: { fontWeight: "800" },
  predictText: { color: "#6b7280", marginBottom: 10 },
  predictTrack: {
    height: 8,
    backgroundColor: "#eaeff0",
    borderRadius: 999,
    overflow: "hidden",
  },
  predictFill: { height: "100%", backgroundColor: PRIMARY },
  predictConfidence: {
    textAlign: "right",
    fontSize: 11,
    color: "#6b7280",
    marginTop: 6,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  bottomBtn: {
    flex: 1,
    height: 48,
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
  csvBtn: {
    backgroundColor: PRIMARY,
  },
  bottomBtnText: { color: "#111", fontWeight: "800" },
});
