import React, { useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type TopBar = {
  name: string;
  value: number;
  highlight?: boolean;
};

type LeaderboardItem = {
  rank: number;
  name: string;
  subtitle: string;
  value: number;
  trend: number;
  image: string;
};

const topBars: TopBar[] = [
  { name: "Gala", value: 40 },
  { name: "Indomie", value: 90, highlight: true },
  { name: "Coke", value: 60 },
  { name: "Peak", value: 35 },
  { name: "Soap", value: 25 },
];

const leaderboard: LeaderboardItem[] = [
  {
    rank: 1,
    name: "Indomie Super Pack",
    subtitle: "High Stock Level",
    value: 142,
    trend: 12,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBHwoABBE1solrnb37eTOT2Qh4-zl7lB_7ts-HH6nXtIEaZvuA18AUSm5o7KL9dM--Ce9ss-HVgumRftmQNfOU_I2okrf2VeWdU_vmZK0dZ1w5mjfo2QF7wuqxiiYXyyVHsVjdhVAVbdqDcqUVk6xGCTUpreU3WQTQpi3crrJrMRSM8syVSE0iN0RMqFl8x-kMdTbX24TX1-4IqQ3rztXbhjoP18KmKyJkjIFszo2wAku9RMrTizHZv1PyOf97WDFBpQe_qXDsSIw0",
  },
  {
    rank: 2,
    name: "Coca-Cola 50cl",
    subtitle: "Low Stock",
    value: 98,
    trend: 5,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgIhNNb8JRR2VtBo3sfblkYnIX7nna63ATECuhEOEqeeUt0WFbDoKaJgeadEqFc0qdEY44r-ZBRnST0urcgSQ7dV-tlkLDvbRJlD4qBLr4n1om46eRu13qbTDb_OLQnXgtmqR4C911FI7bJVpJwHnnfH8MNmqAETFbqtPSNFvyenPUV-_sfboeuflby51S1xcOGnwJmC3bIXT2SWmg9mWHpl3G09aCQhKLWvl-ONeyM95NiMKlsZeufsRJ_HgbH9Wr4AGX1oqVLqU",
  },
  {
    rank: 3,
    name: "Peak Milk Powder",
    subtitle: "In Stock",
    value: 76,
    trend: 2,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLJq4MafhaoOk8Ky1mALbacUHKvszta2UwogQE-mVH16L8-RiO5u38AbLrNBUtjcgd4NXSaMRPlhYVPXw8zyhA40M6YdYzVBzQN_lA6yHWCdWcKtr486-r7M-ruELRckNVjlnfLu9gWvYnYMgAYipxcYPWx5kygyBkAm-OJ4_VnqovF_wd3kEsMN22ap7gX8T12iE0aRP-rw6K6Ccv0TWp6Vh8Y_fgxUQZpqtkpA1YxoaevmRJ6sPuzCijeP2lVRpbjhYoVAHPwe4",
  },
  {
    rank: 4,
    name: "Dangote Sugar",
    subtitle: "In Stock",
    value: 50,
    trend: -1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXqTOs4KH8K9E_c-aqig3APSaFUdTFjbNlspFGt5snvea6iQ93UZU-g7wARiEyD4kG6HVqf06K3hp0n_FUizZYU7Snbq58miL21BqCMXqr0OJN4LYsXG_f7XVD2k6WAMSOXXwHNc9lFTdLa6KH_eEnahByn-uvtV8eZktK0t48pQdh_AUZvtxTQwfmOM-03j2bKpr_4ZZ6VyDzQuhHf0Omya_lnbZ2QYU_9-W-TQ_f7UPCDfirI5MMJt2QBrKPBcAd2lWtRqTdJPg",
  },
];

export default function TopSellers() {
  const [selectedPeriod, setSelectedPeriod] = useState<"Today" | "This Week" | "This Month">("This Week");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialIcons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Sellers</Text>
        <TouchableOpacity>
          <MaterialIcons name="calendar-today" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {["Today", "This Week", "This Month"].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonSelected,
            ]}
            onPress={() => setSelectedPeriod(period as any)}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextSelected,
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bar Chart */}
      <View style={styles.barChartContainer}>
        <Text style={styles.sectionTitle}>Top 5 Items</Text>
        <Text style={styles.sectionSubtitle}>Total volume this week: 450 units</Text>
        <View style={styles.barChart}>
          {topBars.map((bar, idx) => (
            <View key={idx} style={styles.barItem}>
              <View
                style={[
                  styles.bar,
                  { height: `${bar.value}%` },
                  bar.highlight && styles.barHighlight,
                ]}
              >
                {bar.highlight && <Text style={styles.badge}>#1</Text>}
              </View>
              <Text style={styles.barLabel}>{bar.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Leaderboard */}
      <ScrollView style={styles.leaderboard} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.sectionTitle}>Sales Leaderboard</Text>
        {leaderboard.map((item) => (
          <View
            key={item.rank}
            style={[
              styles.card,
              item.rank === 1 && styles.cardHighlight,
            ]}
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.cardValue}>
              <Text style={styles.cardNumber}>{item.value}</Text>
              <View
                style={[
                  styles.trendContainer,
                  item.trend >= 0 ? styles.trendUp : styles.trendDown,
                ]}
              >
                <MaterialIcons
                  name={item.trend >= 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color={item.trend >= 0 ? "#2ab562" : "#ef4444"}
                />
                <Text
                  style={[
                    styles.trendText,
                    item.trend >= 0 ? styles.trendTextUp : styles.trendTextDown,
                  ]}
                >
                  {Math.abs(item.trend)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f8f7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937", flex: 1, textAlign: "center" },
  periodSelector: { flexDirection: "row", justifyContent: "center", padding: 16 },
  periodButton: { flex: 1, marginHorizontal: 4, paddingVertical: 8, borderRadius: 999, backgroundColor: "#e5e7eb", alignItems: "center" },
  periodButtonSelected: { backgroundColor: "#36e27b" },
  periodText: { fontSize: 14, color: "#4b5563", fontWeight: "500" },
  periodTextSelected: { fontWeight: "bold", color: "#112117" },
  barChartContainer: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  barChart: { flexDirection: "row", justifyContent: "space-between", height: 200, alignItems: "flex-end" },
  barItem: { alignItems: "center" },
  bar: { width: 24, backgroundColor: "#36e27b", borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barHighlight: { backgroundColor: "#facc15" },
  badge: { position: "absolute", top: -16, fontSize: 10, fontWeight: "bold", color: "#111827" },
  barLabel: { fontSize: 10, marginTop: 4, color: "#6b7280" },
  leaderboard: { paddingHorizontal: 16, marginTop: 16 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHighlight: { borderWidth: 2, borderColor: "#36e27b" },
  cardImage: { width: 48, height: 48, borderRadius: 999 },
  cardContent: { flex: 1, paddingHorizontal: 12 },
  cardName: { fontSize: 14, fontWeight: "bold", color: "#1f2937" },
  cardSubtitle: { fontSize: 10, color: "#6b7280" },
  cardValue: { alignItems: "flex-end" },
  cardNumber: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  trendContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 4, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  trendUp: { backgroundColor: "#d1fae5" },
  trendDown: { backgroundColor: "#fee2e2" },
  trendText: { fontSize: 10, fontWeight: "bold", marginLeft: 2 },
  trendTextUp: { color: "#2ab562" },
  trendTextDown: { color: "#ef4444" },
});
