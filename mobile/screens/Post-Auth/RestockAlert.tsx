import React from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type Item = {
  id: number;
  status: "Critical" | "Warning";
  title: string;
  subtitle: string;
  sold: number;
  lastSale: string;
  image: string;
};

const items: Item[] = [
  {
    id: 1,
    status: "Critical",
    title: "Indomie Chicken (Carton)",
    subtitle: "₦ 8,500 / carton",
    sold: 0,
    lastSale: "45d ago",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM-zu4xZRVeQTTPH-NItVEeDkM6xODjab444Ub48AACls6aMrniAiY9ba97nMN4-Fjp1rAqU-Nav1MZYO9rIl28Ek_U7MsGOB0E7BjwezDdSzPER7NV61E8Y8ouLV0iTEibzW9rGZzrEILTXJ3D03uJfvzFJ5LDKCaNAP1SZeDSU-5j1GM3S-1ciub221hX27B_WpNRmG01ls2eVol4XcqCpFws6gmsGWPYCydeyx54KsUqxpkecrTy_38ilzoExA34aamNh68Fnk",
  },
  {
    id: 2,
    status: "Warning",
    title: "Peak Milk Powder (Tin)",
    subtitle: "₦ 4,200 / tin",
    sold: 2,
    lastSale: "32d ago",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBkWqCLPRkc9GqJWOHE0foc0p2AJint6fp-yTeK9t1gV14pRunq-6wqgu0Rvg6xEcizBWoRBaaR5DwU4hafzLcv2QtTY_zidvPdIpW_0wICIJQBDMvBYBl6iNoBYx4Ho8jLqOQrs60Vp8cxMpyXr5PncewhvvYmY-QuYu1Gzoic4_qQPQk1rl22at49jwvGqyTdy8WhxbWYe52HMiYK0dCDtHP6xO4KNGrKdQH8HBZhYZdU35c5nYvCBRwjg-VlO1DjwcYzru_aeL4",
  },
  {
    id: 3,
    status: "Warning",
    title: "Dangote Sugar (50kg)",
    subtitle: "₦ 28,000 / bag",
    sold: 1,
    lastSale: "28d ago",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArUYTom9gUIouLZP2BYUjRWLRNyW9oygQXUpc-c9tjzHYj7sOtF9yrYwF63C4aTkcKSHj0kCFCrCRAF-QyqbGqYBMR0wTFUBXfg0uY5AyewBs1kMptkgrcooP1DgbJ7IAmivOIKPkaZ8jh-533uRLE7q6-5ScCHXSLkH-V-FVhPVNyV3N_4Qyq6bzn9xpuSeh7eKUwjhSk_hRjJsjCTQxUSb73qGOrvVWbFzaQ0mPeUUTzyP7HzQjAUXbJ6rUfpiwejZ1l8KHeczo",
  },
];

export default function SlowMovingProducts() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Items Stuck on Shelf</Text>
          <Text style={styles.headerSubtitle}>Inventory health check</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="filter-list" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Summary Chart */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Slowest Categories</Text>
        <Text style={styles.summaryTitle}>Last 30 Days</Text>

        <View style={styles.chartRow}>
          <Text style={styles.chartLabel}>Canned Goods</Text>
          <View style={styles.chartBarBackground}>
            <View style={[styles.chartBarPrimary, { width: "75%" }]} />
          </View>
        </View>

        <View style={styles.chartRow}>
          <Text style={styles.chartLabel}>Toiletries</Text>
          <View style={styles.chartBarBackground}>
            <View style={[styles.chartBarWarning, { width: "50%" }]} />
          </View>
        </View>

        <View style={styles.chartRow}>
          <Text style={styles.chartLabel}>Snacks</Text>
          <View style={styles.chartBarBackground}>
            <View style={[styles.chartBarPrimaryLight, { width: "30%" }]} />
          </View>
        </View>
      </View>

      {/* Item List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
        <Text style={styles.sectionTitle}>Critical Items</Text>

        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "Critical" ? styles.statusCritical : styles.statusWarning,
                  ]}
                >
                  <MaterialIcons
                    name={item.status === "Critical" ? "error" : "warning"}
                    size={14}
                    color={item.status === "Critical" ? "#b91c1c" : "#f59e0b"}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "Critical" ? styles.statusTextCritical : styles.statusTextWarning,
                    ]}
                  >
                    {item.status} • {item.status === "Critical" ? "Very Slow" : "Slow"}
                  </Text>
                </View>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <Image source={{ uri: item.image }} style={styles.itemImage} />
            </View>

            <View style={styles.divider} />

            <View style={styles.itemStats}>
              <View>
                <Text style={styles.statsLabel}>Sold (30d)</Text>
                <Text style={styles.statsValue}>{item.sold} Units</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.statsLabel}>Last Sale</Text>
                <Text
                  style={[
                    styles.statsValue,
                    item.status === "Critical" ? styles.statsCritical : styles.statsWarning,
                  ]}
                >
                  {item.lastSale}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity style={styles.ctaButton}>
          <MaterialIcons name="lightbulb" size={20} color="#000" />
          <Text style={styles.ctaText}>How to Clear Stock?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    alignItems: "center",
    backgroundColor: "#f6f8f7",
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  headerSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    margin: 16,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryLabel: { fontSize: 12, color: "#6b7280", fontWeight: "500", textTransform: "uppercase", marginBottom: 4 },
  summaryTitle: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  chartRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  chartLabel: { width: 100, fontSize: 12, fontWeight: "bold", color: "#4b5563" },
  chartBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
  },
  chartBarPrimary: { height: "100%", backgroundColor: "#36e27b", borderRadius: 6 },
  chartBarWarning: { height: "100%", backgroundColor: "#facc15", borderRadius: 6 },
  chartBarPrimaryLight: { height: "100%", backgroundColor: "rgba(54, 226, 123, 0.6)", borderRadius: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginVertical: 12 },
  itemCard: {
    borderRadius: 24,
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusCritical: { backgroundColor: "#fee2e2" },
  statusWarning: { backgroundColor: "#fef9c3" },
  statusText: { fontSize: 10, fontWeight: "bold", marginLeft: 4 },
  statusTextCritical: { color: "#b91c1c" },
  statusTextWarning: { color: "#b45309" },
  itemTitle: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  itemSubtitle: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  itemImage: { width: 80, height: 80, borderRadius: 16, marginLeft: 12 },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 },
  itemStats: { flexDirection: "row", justifyContent: "space-between" },
  statsLabel: { fontSize: 10, color: "#9ca3af", fontWeight: "500" },
  statsValue: { fontSize: 14, fontWeight: "bold", color: "#111827" },
  statsCritical: { color: "#b91c1c" },
  statsWarning: { color: "#b45309" },
  bottomCTA: { position: "absolute", bottom: 24, left: 16, right: 16 },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#36e27b",
    height: 56,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: { fontSize: 16, fontWeight: "bold", color: "#000", marginLeft: 8 },
});
