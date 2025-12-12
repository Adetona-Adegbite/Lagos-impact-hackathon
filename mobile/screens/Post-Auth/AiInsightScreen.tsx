import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function AIInsightsScreen({ navigation }: { navigation: any }) {
  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>Oga Emmanuel</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.scanButton}>
          <MaterialIcons name="qr-code-scanner" size={20} color="#fff" />
          <Text style={styles.scanText}>Scan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Page Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>AI Insights Overview</Text>
          <Text style={styles.pageSubtitle}>
            Here's what's happening in your shop right now.
          </Text>
        </View>

        {/* Top Movers Card */}
        <TouchableOpacity
          onPress={() => {
            navigation?.navigate("TopSellers");
          }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.iconCircle}>
                <MaterialIcons
                  name="local-fire-department"
                  size={16}
                  color="#F97316"
                />
              </View>
              <Text style={styles.cardTitle}>Top Movers</Text>
            </View>
            <View style={styles.cardHeaderRight}>
              <MaterialIcons name="trending-up" size={16} color="#36e27b" />
              <Text style={styles.cardTrend}>+12%</Text>
            </View>
          </View>
          <Text style={styles.topSold}>
            +45 <Text style={styles.topSoldSubtitle}>Sold Today</Text>
          </Text>

          {/* Bar Chart */}
          <View style={styles.barChart}>
            {[
              { name: "Gala Sausage", percent: 85, sold: 28 },
              { name: "Coke 50cl", percent: 60, sold: 12 },
              { name: "Super Loaf", percent: 35, sold: 5 },
            ].map((item, idx) => (
              <View key={idx} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.name}</Text>
                <View style={styles.barContainer}>
                  <View
                    style={[styles.barFill, { width: `${item.percent}%` }]}
                  />
                  <Text style={styles.barValue}>{item.sold}</Text>
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Smart Restock Alert */}
        <View style={[styles.card, styles.restockCard]}>
          <View style={styles.restockHeader}>
            <View style={styles.restockIcon}>
              <MaterialIcons name="warning" size={24} color="#CA8A04" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Smart Restock Alert</Text>
              <Text style={styles.restockText}>
                <Text style={{ fontWeight: "bold" }}>
                  Indomie Chicken (70g)
                </Text>{" "}
                is predicted to run out by{" "}
                <Text style={{ fontWeight: "bold", color: "#CA8A04" }}>
                  Friday evening
                </Text>
                .
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.restockButton}>
            <MaterialIcons name="add-shopping-cart" size={18} color="#CA8A04" />
            <Text style={styles.restockButtonText}>Add to Restock List</Text>
          </TouchableOpacity>
        </View>

        {/* Slow Moving Stock */}
        <TouchableOpacity
          onPress={() => {
            navigation?.navigate("SlowMovingProducts");
          }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleBlue}>
              <MaterialIcons name="hourglass-empty" size={16} color="#60A5FA" />
            </View>
            <Text style={styles.cardTitle}>Slow Moving Stock</Text>
          </View>
          <View style={styles.slowStock}>
            {[
              { name: "Dangote Sugar 1kg", lastSold: "12 days ago", stock: 15 },
              { name: "Milo Refill 20g", lastSold: "8 days ago", stock: 42 },
            ].map((item, idx) => (
              <View key={idx} style={styles.slowStockRow}>
                <View>
                  <Text style={styles.stockName}>{item.name}</Text>
                  <Text style={styles.stockInfo}>
                    Last sold: {item.lastSold}
                  </Text>
                </View>
                <Text style={styles.stockCount}>{item.stock} in stock</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all inactive items</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Weekly Trend */}
        <View style={styles.card}>
          <View style={styles.weeklyHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="insights" size={20} color="#36e27b" />
              <Text style={styles.cardTitle}>Weekly Trend</Text>
            </View>
            <Text style={styles.weeklyValue}>₦ 154,200</Text>
          </View>
          {/* Placeholder for Bar Graph */}
          <View style={styles.weeklyGraph}>
            {[40, 60, 30, 75, 90, 50, 20].map((height, idx) => (
              <View
                key={idx}
                style={[
                  styles.weeklyBar,
                  {
                    height: `${height}%`,
                    backgroundColor: idx === 4 ? "#36e27b" : "#E5E7EB",
                  },
                ]}
              />
            ))}
          </View>
          <Text style={styles.weeklyTip}>
            "Sales usually peak on Saturdays. Stock up on soft drinks tomorrow."
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <MaterialCommunityIcons name="robot" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },
  scroll: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeText: { fontSize: 12, color: "#9EB7A8" },
  userName: { fontSize: 16, fontWeight: "bold", color: "#111" },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#36e27b",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  scanText: { color: "#fff", fontWeight: "bold", marginLeft: 4 },
  titleContainer: { marginVertical: 16 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#111",
  },
  pageSubtitle: { fontSize: 14, color: "#9EB7A8" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFE4D8",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleBlue: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontWeight: "bold", fontSize: 16, color: "#111" },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardTrend: { fontSize: 12, color: "#36e27b" },
  topSold: { fontSize: 28, fontWeight: "bold", marginTop: 8, color: "#111" },
  topSoldSubtitle: { fontSize: 12, fontWeight: "500", color: "#9EB7A8" },
  barChart: { marginTop: 16 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  barLabel: {
    width: 100,
    fontSize: 12,
    color: "#9EB7A8",
    textAlign: "right",
    marginRight: 8,
  },
  barContainer: {
    flex: 1,
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  barFill: { height: "100%", backgroundColor: "#36e27b", borderRadius: 8 },
  barValue: { marginLeft: 4, fontSize: 12, fontWeight: "bold", color: "#111" },
  restockCard: { backgroundColor: "#FEF3C7" },
  restockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  restockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FDE68A",
    alignItems: "center",
    justifyContent: "center",
  },
  restockText: { fontSize: 12, color: "#555" },
  restockButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  restockButtonText: { fontWeight: "bold", color: "#CA8A04", marginLeft: 4 },
  slowStock: { borderTopWidth: 1, borderColor: "#E5E7EB", marginTop: 8 },
  slowStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  stockName: { fontSize: 14, fontWeight: "500", color: "#111" },
  stockInfo: { fontSize: 12, color: "#9EB7A8" },
  stockCount: { fontSize: 12, fontWeight: "bold", color: "#9EB7A8" },
  viewAll: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#36e27b",
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  weeklyValue: { fontSize: 14, fontWeight: "bold", color: "#111" },
  weeklyGraph: {
    flexDirection: "row",
    height: 120,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  weeklyBar: { flex: 1, marginHorizontal: 2, borderRadius: 4 },
  weeklyTip: {
    marginTop: 8,
    fontSize: 12,
    color: "#9EB7A8",
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#36e27b",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  navItem: { alignItems: "center" },
  navLabel: { fontSize: 10, color: "#9CA3AF" },
});
