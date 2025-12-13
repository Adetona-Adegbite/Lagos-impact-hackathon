// src/screens/SalesScreen.tsx
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { t } from "../../utils/localization";

const { width } = Dimensions.get("window");
const MAIN_GREEN = "#36e27b";

type Sale = {
  id: string;
  title: string;
  time: string;
  method: "Cash" | "POS" | "Transfer";
  amount: number;
  status: "Paid" | "Pending";
  color?: string;
  accent?: string;
};

const SAMPLE_SALES_TODAY: Sale[] = [
  {
    id: "s1",
    title: "Milo Refill x2, Sugar...",
    time: "10:42 AM",
    method: "Cash",
    amount: 3200,
    status: "Paid",
    color: "#F59E0B",
    accent: "#F97316",
  },
  {
    id: "s2",
    title: "Peak Milk, Bread, Eggs...",
    time: "09:15 AM",
    method: "POS",
    amount: 8500,
    status: "Paid",
    color: "#60A5FA",
    accent: "#3B82F6",
  },
  {
    id: "s3",
    title: "Indomie Carton (Chicken)",
    time: "08:55 AM",
    method: "Transfer",
    amount: 12400,
    status: "Pending",
    color: "#C084FC",
    accent: "#8B5CF6",
  },
  {
    id: "s4",
    title: "Ankara Fabric 6 yards",
    time: "08:30 AM",
    method: "Cash",
    amount: 6000,
    status: "Paid",
    color: "#2DD4BF",
    accent: "#14B8A6",
  },
];

const SAMPLE_SALES_YESTERDAY: Sale[] = [
  {
    id: "y1",
    title: "Detergent, Soap bar...",
    time: "19:45 PM",
    method: "Cash",
    amount: 1850,
    status: "Paid",
    color: "#9CA3AF",
  },
];

export default function SalesScreen({ navigation }: { navigation?: any }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(t("today"));
  const [selectedRange, setSelectedRange] = useState(t("today"));

  const filters = [t("today"), t("paymentMethod"), t("status")];

  const todaySales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_SALES_TODAY.filter(
      (s) => !q || s.title.toLowerCase().includes(q),
    );
  }, [query]);

  const yesterdaySales = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_SALES_YESTERDAY.filter(
      (s) => !q || s.title.toLowerCase().includes(q),
    );
  }, [query]);

  const totalToday = useMemo(
    () => SAMPLE_SALES_TODAY.reduce((sum, s) => sum + s.amount, 0),
    [],
  );

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      activeOpacity={0.86}
      style={styles.saleCard}
      onPress={() => console.log("open sale", item.id)}
    >
      <View style={styles.saleRow}>
        <View style={styles.saleLeft}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: item.color ?? "#F3F4F6" },
            ]}
          >
            <MaterialIcons
              name={
                item.method === "Cash"
                  ? "payments"
                  : item.method === "POS"
                    ? "point-of-sale"
                    : "account-balance"
              }
              size={20}
              color="#fff"
            />
          </View>

          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text numberOfLines={1} style={styles.saleTitle}>
              {item.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.time}</Text>
              <View style={styles.dot} />
              <View style={styles.metaRowInner}>
                <MaterialIcons
                  name={
                    item.method === "Cash"
                      ? "payments"
                      : item.method === "POS"
                        ? "point-of-sale"
                        : "account-balance"
                  }
                  size={14}
                  color="#9CA3AF"
                />
                <Text style={styles.metaTextSmall}>
                  {
                    { Cash: t("cash"), POS: t("pos"), Transfer: t("transfer") }[
                      item.method
                    ]
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.amountText}>
            ₦ {item.amount.toLocaleString()}
          </Text>
          <View
            style={[
              styles.statusPill,
              item.status === "Paid" ? styles.paidPill : styles.pendingPill,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === "Paid" ? styles.paidText : styles.pendingText,
              ]}
            >
              {{ Paid: t("paid"), Pending: t("pending") }[item.status]}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation?.goBack?.()}
              style={styles.backBtn}
            >
              <MaterialIcons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("dailySales")}</Text>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => console.log("profile")}
            >
              <MaterialIcons name="account-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Business assistant card */}
          <TouchableOpacity activeOpacity={0.9} style={styles.assistantCard}>
            <View style={styles.assistantTop}>
              <MaterialIcons name="auto-awesome" size={18} color="#8b5cf6" />
              <Text style={styles.assistantLabel}>
                {t("businessAssistant")}
              </Text>
            </View>
            <Text style={styles.assistantText}>{t("assistantMessage")}</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.assistantChipsRow}
            >
              <View style={styles.chip}>
                <Text style={styles.chipTitle}>{t("taxRisk")}</Text>
                <View style={styles.chipRow}>
                  <View
                    style={[styles.statusDot, { backgroundColor: "#F97316" }]}
                  />
                  <Text style={styles.chipValue}>{t("medium")}</Text>
                </View>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipTitle}>
                  {t("estimatedTaxableRevenue")}
                </Text>
                <Text style={styles.chipValue}>₦ 850k</Text>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipTitle}>{t("vatCollected")}</Text>
                <Text style={styles.chipValue}>₦ 12,500</Text>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipTitleDanger}>{t("potentialLoss")}</Text>
                <View style={styles.chipRow}>
                  <MaterialIcons
                    name="trending-down"
                    size={14}
                    color="#ef4444"
                  />
                  <Text style={styles.chipValue}>{t("lowStock")}</Text>
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>

          {/* Revenue and search */}
          <View style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>{t("totalRevenueToday")}</Text>
            <Text style={styles.revenueValue}>
              ₦ {totalToday.toLocaleString()}
            </Text>
          </View>

          <View style={styles.searchWrap}>
            <MaterialIcons
              name="search"
              size={20}
              color="#9CA3AF"
              style={{ marginLeft: 12 }}
            />
            <TextInput
              placeholder={t("searchReceiptPlaceholder")}
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <View style={styles.filterRow}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f}
                activeOpacity={0.85}
                style={[
                  styles.filterBtn,
                  f === activeFilter ? styles.filterBtnActive : undefined,
                ]}
                onPress={() => setActiveFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    f === activeFilter ? styles.filterTextActive : undefined,
                  ]}
                >
                  {f}
                </Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={16}
                  color={f === activeFilter ? MAIN_GREEN : "#9CA3AF"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Main list */}
        <View style={styles.listSection}>
          <FlatList
            data={todaySales}
            keyExtractor={(s) => s.id}
            renderItem={renderSaleItem}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            scrollEnabled={false}
            ListHeaderComponent={() => null}
          />

          <View style={{ marginTop: 16, marginBottom: 8 }}>
            <Text style={styles.sectionHeader}>{t("yesterday")}</Text>
          </View>

          <FlatList
            data={yesterdaySales}
            keyExtractor={(s) => s.id}
            renderItem={renderSaleItem}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            scrollEnabled={false}
          />

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Floating add button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => console.log("add sale")}
      >
        <MaterialIcons name="add" size={36} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#122117",
    paddingTop: StatusBar.currentHeight,
  },
  container: { paddingBottom: 36 },

  header: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  assistantCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECEFF3",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    elevation: 2,
  },
  assistantTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  assistantLabel: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  assistantText: {
    color: "#334155",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },

  assistantChipsRow: { marginTop: 6 },
  chip: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    marginRight: 8,
    minWidth: 100,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  chipTitle: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  chipValue: { fontSize: 12, fontWeight: "800", color: "#111" },
  chipTitleDanger: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statusDot: { width: 8, height: 8, borderRadius: 6 },

  revenueRow: { paddingVertical: 12 },
  revenueLabel: { fontSize: 13, color: "#7f9587", marginBottom: 6 },
  revenueValue: { fontSize: 36, fontWeight: "900", color: "#fff" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c2e24",
    borderRadius: 999,
    height: 48,
    marginBottom: 12,
    // borderWidth: 1,
    // borderColor: "#ECEFF3",
    marginHorizontal: 0,
    marginTop: 2,
    overflow: "hidden",
  },
  searchInput: { flex: 1, paddingHorizontal: 12, color: "#fff", fontSize: 15 },

  filterRow: {
    flexDirection: "row',",
    gap: 8,
    marginVertical: 8,
    paddingBottom: 4,
    flexWrap: "nowrap",
  } as any,
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECEFF3",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "#111", borderColor: "#111" },
  filterText: { color: "#374151", fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: "#fff" },

  listSection: { paddingHorizontal: 16, paddingTop: 6 },
  saleCard: {
    borderRadius: 12,
    backgroundColor: "#1c2e24",
    padding: 12,
    borderWidth: 1,
    borderColor: "#000",
  },
  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saleLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saleTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  metaText: { color: "#6B7280", fontSize: 12 },
  metaRowInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaTextSmall: { color: "#6B7280", fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 6, backgroundColor: "#E6E6E6" },

  amountText: { fontSize: 16, fontWeight: "900", color: "#fff" },
  statusPill: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paidPill: { backgroundColor: "#DCFCE7" },
  pendingPill: { backgroundColor: "#FEF3C7" },
  statusText: { fontSize: 10, fontWeight: "900", textTransform: "uppercase" },
  paidText: { color: "#059669" },
  pendingText: { color: "#92400E" },

  sectionHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7280",
    textTransform: "uppercase",
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: MAIN_GREEN,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: MAIN_GREEN,
    shadowOpacity: 0.25,
  },
});
