// src/screens/SalesReceiptScreen.tsx
import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const PRIMARY = "#36e27b";

type LineItem = {
  id: string;
  qty: number;
  title: string;
  category: string;
  price: number;
};

const SAMPLE_ITEMS: LineItem[] = [
  {
    id: "i1",
    qty: 1,
    title: "Peak Milk Sachet",
    category: "Dairy",
    price: 150,
  },
  { id: "i2", qty: 2, title: "Dangote Sugar", category: "Pantry", price: 1600 },
  { id: "i3", qty: 5, title: "Other Items", category: "Various", price: 12750 },
];

export default function SalesReceiptScreen({
  navigation,
}: {
  navigation?: any;
}) {
  const total = SAMPLE_ITEMS.reduce((s, it) => s + it.price, 0);
  const dateStr = "Oct 12, 2:30 PM";

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.topBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Receipt #1024</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <View style={styles.checkWrap}>
              <View style={styles.checkCircle}>
                <MaterialIcons name="check" size={20} color={PRIMARY} />
              </View>
              <Text style={styles.successText}>Payment Successful</Text>
              <Text style={styles.totalText}>₦{total.toLocaleString()}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{dateStr}</Text>
              <View style={styles.metaRight}>
                <MaterialIcons name="payments" size={16} color="#6b7280" />
                <Text style={styles.metaText}> Cash Payment</Text>
              </View>
            </View>
          </View>

          <View style={styles.itemsList}>
            {SAMPLE_ITEMS.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <View style={styles.qtyBox}>
                    <Text style={styles.qtyText}>{it.qty}x</Text>
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.itemTitle}>{it.title}</Text>
                    <Text style={styles.itemCategory}>{it.category}</Text>
                  </View>
                </View>
                <Text style={styles.itemPrice}>
                  ₦{it.price.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Analysis header */}
        <View style={styles.sectionHeader}>
          <MaterialIcons
            name="auto-awesome"
            size={20}
            color={PRIMARY}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.sectionTitle}>AI Analysis</Text>
        </View>

        {/* Insights */}
        <View style={styles.insights}>
          <View style={[styles.insightCard, styles.insightBlue]}>
            <View style={styles.accentBarBlue} />
            <View style={styles.insightLeft}>
              <View style={styles.insightIcon}>
                <MaterialIcons
                  name="account-balance"
                  size={18}
                  color="#1e3a8a"
                />
              </View>
            </View>
            <View style={styles.insightBody}>
              <Text style={styles.insightTitle}>VAT Eligible</Text>
              <Text style={styles.insightText}>
                This sale contains VAT-eligible items. Estimated tax on this
                receipt: <Text style={styles.insightHighlight}>₦1,120</Text>.
              </Text>
            </View>
          </View>

          <View style={[styles.insightCard, styles.insightYellow]}>
            <View style={styles.accentBarYellow} />
            <View style={styles.insightLeft}>
              <View style={styles.insightIcon}>
                <MaterialIcons name="trending-up" size={18} color="#92400e" />
              </View>
            </View>
            <View style={styles.insightBody}>
              <Text style={styles.insightTitle}>Notable Transaction</Text>
              <Text style={styles.insightText}>
                High-value transaction compared to store average (3× normal).
                Flagged as notable.
              </Text>
            </View>
          </View>

          <View style={[styles.insightCard, styles.insightRed]}>
            <View style={styles.accentBarRed} />
            <View style={styles.insightLeft}>
              <View style={styles.insightIcon}>
                <MaterialIcons name="inventory-2" size={18} color="#7f1d1d" />
              </View>
            </View>
            <View style={styles.insightBody}>
              <Text style={styles.insightTitle}>Low Inventory Risk</Text>
              <Text style={styles.insightText}>
                Stock levels after this sale put{" "}
                <Text style={styles.bold}>‘Peak Milk Sachet’</Text> into
                low-inventory risk.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Sticky footer: only "Include in Credit History" */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerBtnPrimary}
          activeOpacity={0.9}
          onPress={() => {
            // wire to your handler
            console.log("Include in credit history");
            // navigation?.goBack?.();
          }}
        >
          <MaterialIcons name="credit-score" size={18} color="#064e3b" />
          <Text style={styles.footerBtnText}>Include in Credit History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f8f7" },
  topBar: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 0.25,
    borderBottomColor: "#e6e9e8",
    backgroundColor: "#fff",
  },
  topBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
  },

  content: { padding: 16, paddingBottom: 0 },

  receiptCard: {
    borderRadius: 14,
    backgroundColor: "#fff",
    overflow: "hidden",
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#eef2f4",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    elevation: 2,
  },
  receiptHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  checkWrap: { alignItems: "center" },
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successText: { color: "#64748b", fontSize: 13 },
  totalText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 6,
  },

  metaRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: { color: "#6b7280", fontSize: 12 },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 6 },

  itemsList: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  itemLeft: { flexDirection: "row", alignItems: "center" },
  qtyBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { color: "#374151", fontWeight: "800" },
  itemTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  itemCategory: { color: "#6b7280", fontSize: 12 },
  itemPrice: { fontWeight: "800", color: "#0f172a" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },

  insights: { paddingVertical: 8 },
  insightCard: {
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eef2f4",
    alignItems: "flex-start",
  },
  insightLeft: {
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  insightBody: { flex: 1, padding: 12 },
  insightTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  insightText: { fontSize: 13, color: "#64748b", lineHeight: 20 },
  insightHighlight: {
    fontWeight: "900",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    borderRadius: 6,
  },

  accentBarBlue: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#2563eb",
  },
  accentBarYellow: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#f59e0b",
  },
  accentBarRed: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#ef4444",
  },

  insightBlue: { backgroundColor: "#eff6ff", borderColor: "#dbeafe" },
  insightYellow: { backgroundColor: "#fffbeb", borderColor: "#fef3c7" },
  insightRed: { backgroundColor: "#fff1f2", borderColor: "#fee2e2" },

  bold: { fontWeight: "800" },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  footerBtnPrimary: {
    width: width - 32,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6f5ec",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  footerBtnText: { marginLeft: 8, color: "#064e3b", fontWeight: "900" },
});
