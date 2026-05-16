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
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { t } from "../../utils/localization";
import { syncEngine } from "../../services/sync/SyncEngine";
import { paymentService } from "../../services/paymentService";
import { useNotifications } from "../../services/notifications";

const { width } = Dimensions.get("window");
const MAIN_GREEN = "#dd4f05";
const CARD_WIDTH = Math.round(width * 0.62);

type StatCard = {
  id: string;
  title: string;
  value: string;
  icon: string;
  accent?: string;
  hint?: string;
};

export default function RetailHomeScreen({ navigation }: { navigation?: any }) {
  const [shopName, setShopName] = useState("My Shop");
  const [stats, setStats] = useState({
    todaySales: 0,
    lowStock: 0,
    totalItems: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [virtualAccount, setVirtualAccount] = useState<{
    number: string | null;
    name: string | null;
    bank: string | null;
  }>({ number: null, name: null, bank: null });
  const [simulateVisible, setSimulateVisible] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState("1000");
  const [simulateLoading, setSimulateLoading] = useState(false);
  const { showNotification } = useNotifications();
  const ACTIONS = [
    {
      id: "a1",
      title: t("newSale"),
      subtitle: t("recordTransaction"),
      icon: "point-of-sale",
      primary: true,
    },
    {
      id: "a2",
      title: t("inventory"),
      subtitle: t("manageStock"),
      icon: "inventory",
    },

    {
      id: "a3",
      title: t("aiInsights"),
      subtitle: t("smartPredictions"),
      icon: "auto-awesome",
    },

    {
      id: "a4",
      title: t("allSales"),
      subtitle: t("viewSalesHistory"),
      icon: "history",
    },
    {
      id: "a5",
      title: t("aiCreditScore"),
      subtitle: t("loanReadyInsights"),
      icon: "insights",
    },
    {
      id: "a6",
      title: t("taxInsights"),
      subtitle: t("quickTaxReports"),
      icon: "account-balance",
    },
    {
      id: "a7",
      title: t("payments"),
      subtitle: t("viewPayments"),
      icon: "payments",
    },
    // {
    //   id: "a8",
    //   title: "Simulate",
    //   subtitle: "Test transfer",
    //   icon: "science",
    // },
  ];

  const fetchData = useCallback(async () => {
    try {
      await syncEngine.triggerSync();
      const authData = await authStorage.getAuthData();
      if (authData?.user?.shopName) {
        setShopName(authData.user.shopName);
      }
      if (authData?.user?.virtualAccountNumber) {
        setVirtualAccount({
          number: authData.user.virtualAccountNumber,
          name: authData.user.virtualAccountName || authData.user.shopName,
          bank: authData.user.virtualBankName || "Squad Bank",
        });
      }

      // Check for new payments
      const prevPayments = await paymentService.getLocalPayments();
      const newPayments = await paymentService.syncPayments();
      if (newPayments.length > prevPayments.length) {
        const diff = newPayments.slice(
          0,
          newPayments.length - prevPayments.length,
        );
        for (const p of diff) {
          showNotification({
            title: "Payment Received!",
            message: `₦${p.amount.toLocaleString()} received via virtual account`,
            type: "payment",
          });
        }
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
  }, [showNotification]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const statCards: StatCard[] = [
    {
      id: "s1",
      title: t("todaysSales"),
      value: `₦${stats.todaySales.toLocaleString()}`,
      icon: "payments",
      accent: MAIN_GREEN,
    },
    {
      id: "s2",
      title: t("lowStock"),
      value: `${stats.lowStock} ${t("items")}`,
      icon: "warning",
      accent: "#F97316",
    },
    {
      id: "s3",
      title: t("totalItems"),
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
      navigation?.navigate("AllSalesScreen");
    } else if (id == "a5") {
      navigation?.navigate("CreditProfileScreen");
    } else if (id == "a6") {
      navigation?.navigate("TaxInsightsScreen");
    } else if (id == "a7") {
      navigation?.navigate("PaymentsScreen");
    } else if (id == "a8") {
      setSimulateVisible(true);
    }
  };

  const handleSimulate = async () => {
    const amount = parseFloat(simulateAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid positive amount");
      return;
    }
    setSimulateLoading(true);
    try {
      const result = await paymentService.simulatePayment(amount);
      setSimulateVisible(false);
      showNotification({
        title: "Payment Simulated!",
        message: `₦${amount.toLocaleString()} test transfer created`,
        type: "payment",
      });
      // Refresh data to show new payment
      fetchData();
    } catch (err: any) {
      Alert.alert("Simulation failed", err.message || "Something went wrong");
    } finally {
      setSimulateLoading(false);
    }
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
              <Text style={styles.small}>{t("goodMorning")}</Text>
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
            <Text style={styles.sectionSmall}>{t("overview")}</Text>
            <TouchableOpacity onPress={() => console.log("view reports")}>
              <Text style={styles.viewReports}>{t("viewReports")}</Text>
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

          {/* Virtual Account Card */}
          {virtualAccount.number && (
            <View style={styles.vaSection}>
              <View style={styles.vaCard}>
                <View style={styles.vaTop}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <MaterialIcons
                      name="account-balance"
                      size={18}
                      color="#dd4f05"
                    />
                    <Text style={styles.vaLabel}>{t("yourAccountNumber")}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      // Copy to clipboard
                    }}
                  >
                    <MaterialIcons
                      name="content-copy"
                      size={18}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.vaNumber}>{virtualAccount.number}</Text>
                <Text style={styles.vaBank}>{virtualAccount.bank}</Text>
                <Text style={styles.vaName}>{virtualAccount.name}</Text>
              </View>
            </View>
          )}

          {/* Quick actions grid */}
          <View style={styles.actionsHeader}>
            <Text style={styles.bigTitle}>{t("quickActions")}</Text>
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
                    color={"#fff"}
                  />
                  <MaterialIcons
                    name="arrow-forward"
                    size={18}
                    color={"#fff"}
                  />
                </View>
                <View>
                  <Text style={[styles.actionTitle]}>{a.title}</Text>
                  <Text style={styles.actionSubtitle}>{a.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recent Activity */}
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>{t("recentSales")}</Text>
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
                      {r.title || t("sale")}
                      {r.itemCount > 1
                        ? t("plusItems").replace(
                            "{count}",
                            String(r.itemCount - 1),
                          )
                        : ""}
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

        {/* Simulate Payment Modal */}
        <Modal
          visible={simulateVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSimulateVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Simulate Payment</Text>
              <Text style={styles.modalDesc}>
                Enter an amount to simulate a transfer into your virtual
                account.
              </Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={simulateAmount}
                onChangeText={setSimulateAmount}
                placeholder="Amount (NGN)"
                placeholderTextColor="#6B7280"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalBtnSecondary}
                  onPress={() => setSimulateVisible(false)}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalBtnPrimary}
                  onPress={handleSimulate}
                  disabled={simulateLoading}
                >
                  {simulateLoading ? (
                    <ActivityIndicator color="#dd4f05" />
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>Simulate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#121212" },
  container: { flex: 1, maxWidth: 540, alignSelf: "center" },
  header: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 18,
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#121212",
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
    backgroundColor: "#0f0f0f",
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
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#333333",
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
  bigTitle: { fontSize: 20, fontWeight: "900", color: "#dd4f05" },

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
    backgroundColor: "#0f0f0f",
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
  actionTitlePrimary: { color: "#dd4f05" },
  actionSubtitle: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },

  recentSection: { paddingHorizontal: 18, marginTop: 18 },
  recentTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#dd4f05",
    marginBottom: 6,
  },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0f0f0f",
    borderWidth: 1,
    borderColor: "#333333",
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

  vaSection: { paddingHorizontal: 18, marginTop: 18 },
  vaCard: {
    backgroundColor: "#0f0f0f",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333333",
  },
  vaTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  vaLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#dd4f05",
    textTransform: "uppercase",
  },
  vaNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
    marginBottom: 4,
  },
  vaBank: {
    fontSize: 13,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  vaName: {
    fontSize: 12,
    color: "#6B7280",
  },

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
  quickScanText: { color: "#dd4f05", fontWeight: "900", fontSize: 16 },

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
    borderTopColor: "#333333",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tabItem: { alignItems: "center", justifyContent: "center", gap: 6 },
  tabLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#0f0f0f",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#333333",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  modalBtnSecondaryText: {
    color: "#9CA3AF",
    fontWeight: "700",
    fontSize: 15,
  },
  modalBtnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: MAIN_GREEN,
    alignItems: "center",
  },
  modalBtnPrimaryText: {
    color: "#dd4f05",
    fontWeight: "900",
    fontSize: 15,
  },
});
