// src/screens/RetailHomeScreen.tsx
import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { productService } from "../../services/productService";
import { authStorage } from "../../services/authStorage";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const MAIN_GREEN = "#36e27b";
const CARD_WIDTH = Math.round(width * 0.62);

type StatCard = {
  id: string;
  title: string;
  value: string;
  icon: string;
  accent?: string;
  hint?: string;
};

const ACTIONS = [
  {
    id: "a1",
    title: "New Sale",
    subtitle: "Record transaction",
    icon: "point-of-sale",
    primary: true,
  },
  { id: "a2", title: "Inventory", subtitle: "Manage stock", icon: "inventory" },

  {
    id: "a3",
    title: "AI Insights",
    subtitle: "Smart predictions",
    icon: "auto-awesome",
  },

  {
    id: "a4",
    title: "App Settings",
    subtitle: "View app settings",
    icon: "history",
  },
];

export default function RetailHomeScreen({ navigation }: { navigation?: any }) {
  const [shopName, setShopName] = useState("My Shop");
  const [stats, setStats] = useState({
    todaySales: 0,
    lowStock: 0,
    totalItems: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const authData = await authStorage.getAuthData();
      if (authData?.user?.shopName) {
        setShopName(authData.user.shopName);
      }

      const dashboardStats = await productService.getDashboardStats();
      setStats({
        todaySales: dashboardStats.todaySales,
        lowStock: dashboardStats.lowStockCount,
        totalItems: dashboardStats.totalItemsCount,
      });

      const recent = await productService.getRecentSales();
      setRecentSales(recent);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const statCards: StatCard[] = [
    {
      id: "s1",
      title: "Today's Sales",
      value: `₦${stats.todaySales.toLocaleString()}`,
      icon: "payments",
      accent: MAIN_GREEN,
    },
    {
      id: "s2",
      title: "Low Stock",
      value: `${stats.lowStock} Items`,
      icon: "warning",
      accent: "#F97316",
    },
    {
      id: "s3",
      title: "Total Items",
      value: `${stats.totalItems}`,
      icon: "inventory",
      accent: "#60A5FA",
    },
  ];

  const onActionPress = (id: string) => {
    // console.log("action", id);
    if (id == "a1") {
      navigation?.navigate("SalesScreen");
    } else if (id == "a2") {
      navigation?.navigate("InventoryScreen");
    } else if (id == "a3") {
      navigation?.navigate("AIInsightsScreen");
    } else if (id == "a4") {
      navigation?.navigate("SettingsScreen");
    }
    // navigation?.navigate(...) etc.
  };

  const renderStat = ({ item }: { item: StatCard }) => (
    <View
      style={[
        styles.statCard,
        item.accent ? { borderColor: item.accent } : undefined,
      ]}
    >
      <View style={styles.statTop}>
        <View
          style={[
            styles.statIconWrap,
            { backgroundColor: item.accent ? `${item.accent}22` : "#fff" },
          ]}
        >
          <MaterialIcons
            name={item.icon as any}
            size={22}
            color={item.accent ?? "#fff"}
          />
        </View>
        {item.hint ? (
          <View style={styles.hintPill}>
            <MaterialIcons
              name="trending-up"
              size={12}
              color={item.accent ?? MAIN_GREEN}
            />
            <Text
              style={[styles.hintText, { color: item.accent ?? MAIN_GREEN }]}
            >
              {item.hint}
            </Text>
          </View>
        ) : null}
      </View>

      <View>
        <Text style={styles.statLabel}>{item.title}</Text>
        <Text style={styles.statValue}>{item.value}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzwsRVGB3rjAn25g6b8ryrRBsEcj0ItVKYAF9o6H9bEspO_Rg3cDHDyo5zsY1wf-73mAjivKyLRWO94RGKZ1RzLKFc6i15ez5rU3C4KDS_AJ4uCmvKRW4StDnxm6V5-6w6tjBJDJrbpILDmXK_G5HTWo035_NSdLhgqFuEn2GvmE3QadfJX8BM2oGs0Tns-4TatYrMiQk9eUACHXJNmz5Zgdn7-MLM1O05ryGZZFLWqLSQnxkDIpgWkrg5Pik9VSXKYxEy-wwXpTo",
                }}
                style={styles.avatar}
              />
              <View style={styles.avatarDot} />
            </View>
            <View>
              <Text style={styles.small}>Good Morning,</Text>
              <Text style={styles.shopName}>{shopName}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => console.log("notifications")}
          >
            <MaterialIcons name="notifications" size={22} color="#fff" />
            <View style={styles.notifBadge} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats scroller */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSmall}>Overview</Text>
            <TouchableOpacity onPress={() => console.log("view reports")}>
              <Text style={styles.viewReports}>View Reports</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={statCards}
            keyExtractor={(i) => i.id}
            renderItem={renderStat}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsList}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />

          {/* Quick actions grid */}
          <View style={styles.actionsHeader}>
            <Text style={styles.bigTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsGrid}>
            {ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[
                  styles.actionCard,
                  a.primary ? styles.actionPrimary : null,
                ]}
                onPress={() => onActionPress(a.id)}
                activeOpacity={0.85}
              >
                <View style={styles.actionTop}>
                  <MaterialIcons
                    name={a.icon as any}
                    size={30}
                    color={a.primary ? "#012" : "#fff"}
                  />
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color={a.primary ? "#012" : "#fff"}
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.actionTitle,
                      a.primary ? styles.actionTitlePrimary : undefined,
                    ]}
                  >
                    {a.title}
                  </Text>
                  <Text
                    style={
                      a.primary
                        ? { fontSize: 12, color: "#000", marginTop: 6 }
                        : styles.actionSubtitle
                    }
                  >
                    {a.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Sales</Text>
            <View style={{ height: 10 }} />
            {recentSales.map((r) => (
              <View key={r.id} style={styles.recentItem}>
                <View style={styles.recentLeft}>
                  <View style={styles.recentIcon}>
                    <MaterialIcons
                      name="shopping-bag"
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                  <View>
                    <Text style={styles.recentName}>
                      {r.title || "Sale"}
                      {r.itemCount > 1 ? ` + ${r.itemCount - 1} items` : ""}
                    </Text>
                    <Text style={styles.recentTime}>
                      {new Date(r.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <Text
                  style={styles.recentAmount}
                >{`+ ₦${r.totalAmount.toLocaleString()}`}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Floating Quick Scan Button */}
        <View style={styles.floatingWrap}>
          <TouchableOpacity
            style={styles.quickScanBtn}
            activeOpacity={0.9}
            onPress={() => console.log("Quick Scan")}
          >
            <MaterialIcons
              // @ts-ignore
              name="qr-code-scanner"
              size={20}
              color="#062"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.quickScanText}>Quick Scan Product</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#122117" },
  container: { flex: 1, maxWidth: 540, alignSelf: "center" },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 18,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#122117",
    // borderBottomWidth: 0.25,
    // borderBottomColor: "#E6E9E8",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 6,
  },
  avatar: { width: "100%", height: "100%" },
  avatarDot: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: MAIN_GREEN,
    borderWidth: 2,
    borderColor: "#f6f8f7",
  },
  small: { fontSize: 13, color: "#6B7280" },
  shopName: { fontSize: 18, fontWeight: "800", color: "#fff" },

  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#0b281f",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 6,
    backgroundColor: "#FE5252",
  },

  scroll: { paddingBottom: 40 },

  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    marginTop: 12,
  },
  sectionSmall: { fontSize: 12, fontWeight: "700", color: "#6B7280" },
  viewReports: { fontSize: 12, color: MAIN_GREEN },

  statsList: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
  statCard: {
    width: CARD_WIDTH,
    minHeight: 108,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#0f211a",
    borderWidth: 1,
    borderColor: "#243a2e",
    marginRight: 8,
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(54,226,123,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  hintText: { fontSize: 12, fontWeight: "700" },
  statLabel: { fontSize: 13, color: "#9CA3AF", marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "900", color: "#fff" },

  actionsHeader: { paddingHorizontal: 18, marginTop: 18 },
  bigTitle: { fontSize: 20, fontWeight: "900", color: "#071" },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    width: (width - 18 * 2 - 12) / 2 - 6,
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#0f211a",
    padding: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#fff",
  },
  actionPrimary: {
    backgroundColor: MAIN_GREEN,
    elevation: 6,
    borderColor: MAIN_GREEN,
  },
  actionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  actionTitlePrimary: { color: "#012" },
  actionSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },

  recentSection: { paddingHorizontal: 18, marginTop: 18 },
  recentTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#071",
    marginBottom: 6,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0f211a",
    borderWidth: 1,
    borderColor: "#243a2e",
    marginBottom: 8,
  },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  recentName: { fontSize: 14, fontWeight: "800", color: "#fff" },
  recentTime: { fontSize: 12, color: "#9CA3AF" },
  recentAmount: { fontSize: 14, fontWeight: "900", color: MAIN_GREEN },

  floatingWrap: {
    position: "absolute",
    bottom: 30,
    left: 18,
    right: 18,
    alignItems: "center",
  },
  quickScanBtn: {
    width: "100%",
    height: 56,
    borderRadius: 999,
    backgroundColor: MAIN_GREEN,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    elevation: 8,
  },
  quickScanText: { color: "#022", fontWeight: "900", fontSize: 16 },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingBottom: 18,
    paddingTop: 10,
    backgroundColor: "rgba(17,33,23,0.95)",
    borderTopWidth: 0.25,
    borderTopColor: "#243a2e",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabItem: { alignItems: "center", justifyContent: "center", gap: 6 },
  tabLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "700" },
});
