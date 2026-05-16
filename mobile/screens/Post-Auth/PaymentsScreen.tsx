import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { t } from "../../utils/localization";
import { paymentService, type Payment } from "../../services/paymentService";

const MAIN_GREEN = "#dd4f05";

export default function PaymentsScreen({ navigation }: { navigation?: any }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState<"all" | "unlinked">("all");

  const fetchPayments = useCallback(async () => {
    try {
      await paymentService.syncPayments();
      const all = await paymentService.getLocalPayments();
      setPayments(all);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPayments();
    }, [fetchPayments]),
  );

  const filteredPayments =
    filter === "unlinked" ? payments.filter((p) => !p.saleId) : payments;

  const renderPayment = ({ item }: { item: Payment }) => {
    const isPaid =
      item.status === "PAID" ||
      item.status === "AUTO_LINKED" ||
      item.status === "LINKED";
    const isMismatch = item.status === "MISMATCH";
    const isExpired = item.status === "EXPIRED";

    let badgeColor = isPaid
      ? MAIN_GREEN
      : isMismatch
        ? "#F97316"
        : isExpired
          ? "#EF4444"
          : "#9CA3AF";
    let badgeBg = isPaid
      ? "rgba(54,226,123,0.1)"
      : isMismatch
        ? "rgba(249,115,22,0.1)"
        : isExpired
          ? "rgba(239,68,68,0.1)"
          : "rgba(156,163,175,0.1)";

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentRow}>
          <View style={styles.paymentLeft}>
            <View style={[styles.paymentIcon, { backgroundColor: badgeBg }]}>
              <MaterialIcons
                name={
                  isPaid
                    ? "check-circle"
                    : isMismatch
                      ? "warning"
                      : isExpired
                        ? "error"
                        : "payments"
                }
                size={20}
                color={badgeColor}
              />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.paymentTitle}>
                ₦{item.amount.toLocaleString()}
              </Text>
              <Text style={styles.paymentMeta} numberOfLines={1}>
                {item.transactionReference?.slice(0, 20)}... •{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View style={[styles.statusPill, { backgroundColor: badgeBg }]}>
              <Text style={[styles.statusText, { color: badgeColor }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>
        {item.remarks && (
          <Text style={styles.remarks} numberOfLines={1}>
            {item.remarks}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation?.goBack?.()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("payments")}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === "all" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.filterTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === "unlinked" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("unlinked")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "unlinked" && styles.filterTextActive,
              ]}
            >
              Unlinked
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {filteredPayments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="payments" size={48} color="#374151" />
            <Text style={styles.emptyText}>No payments yet</Text>
            <Text style={styles.emptySub}>
              Dynamic virtual account payments will appear here automatically
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPayments}
            keyExtractor={(p) => p.id}
            renderItem={renderPayment}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            scrollEnabled={false}
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: StatusBar.currentHeight,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#121212",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "#333333",
  },
  filterBtnActive: {
    backgroundColor: MAIN_GREEN,
    borderColor: MAIN_GREEN,
  },
  filterText: { color: "#9CA3AF", fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: "#000" },
  container: { paddingHorizontal: 16, paddingTop: 12 },
  paymentCard: {
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#333333",
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  paymentMeta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  remarks: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, fontWeight: "800", color: "#fff", marginTop: 16 },
  emptySub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
  },
});
