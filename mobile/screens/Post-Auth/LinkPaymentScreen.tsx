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
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { t } from "../../utils/localization";
import { paymentService } from "../../services/paymentService";

const MAIN_GREEN = "#dd4f05";

export default function LinkPaymentScreen({
  route,
  navigation,
}: {
  route?: any;
  navigation?: any;
}) {
  const payment = route?.params?.payment;
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!payment) return;
    try {
      setLoading(true);
      const matches = await paymentService.getSalesMatch(payment.amount);
      setSales(matches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [payment]);

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches]),
  );

  const handleLink = async (saleId: string) => {
    try {
      setLinking(saleId);
      await paymentService.linkPaymentToSale(payment.id, saleId);
      Alert.alert("Success", "Payment linked to sale successfully");
      navigation?.goBack?.();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to link payment");
    } finally {
      setLinking(null);
    }
  };

  const renderSale = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => handleLink(item.id)}
      disabled={linking === item.id}
      activeOpacity={0.85}
    >
      <View style={styles.saleRow}>
        <View style={styles.saleLeft}>
          <View style={styles.saleIcon}>
            <MaterialIcons name="shopping-bag" size={20} color="#fff" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.saleTitle}>
              {item.items?.[0]?.product?.name || "Quick Sale"}
              {item.items?.length > 1 ? ` +${item.items.length - 1} more` : ""}
            </Text>
            <Text style={styles.saleMeta}>
              {new Date(item.createdAt).toLocaleDateString()} •{" "}
              {item.items?.length || 0} items
            </Text>
          </View>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.saleAmount}>
            ₦{item.totalAmount.toLocaleString()}
          </Text>
          {linking === item.id ? (
            <ActivityIndicator size="small" color={MAIN_GREEN} />
          ) : (
            <View style={styles.linkBtn}>
              <Text style={styles.linkText}>{t("linkToSale")}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>{t("linkToSale")}</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment details */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionLabel}>{t("paymentDetails")}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("amountReceived")}</Text>
            <Text style={styles.detailValue}>
              ₦{payment?.amount?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("transactionRef")}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {payment?.transactionReference}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("sender")}</Text>
            <Text style={styles.detailValue}>
              {payment?.senderName || "Unknown"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("selectSale")}</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={MAIN_GREEN} />
          </View>
        ) : sales.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color="#374151" />
            <Text style={styles.emptyText}>{t("noMatchingSales")}</Text>
          </View>
        ) : (
          <FlatList
            data={sales}
            keyExtractor={(s) => s.id}
            renderItem={renderSale}
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  container: { paddingHorizontal: 16, paddingTop: 12 },
  paymentCard: {
    backgroundColor: "#1c1c1c",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333333",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: MAIN_GREEN,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
  },
  detailLabel: { fontSize: 13, color: "#9CA3AF" },
  detailValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    maxWidth: "60%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
  },
  saleCard: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#333333",
  },
  saleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  saleLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  saleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },
  saleTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  saleMeta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  saleAmount: { fontSize: 15, fontWeight: "900", color: "#fff" },
  linkBtn: {
    marginTop: 6,
    backgroundColor: MAIN_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#000",
    textTransform: "uppercase",
  },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: { fontSize: 16, fontWeight: "800", color: "#fff", marginTop: 16 },
});
