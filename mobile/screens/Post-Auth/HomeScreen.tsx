import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Image,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Package,
  ShoppingCart,
  History,
  Sparkles,
  ArrowRight,
  Landmark,
  BadgePercent,
  ChevronRight,
} from "lucide-react-native";
import { productService } from "../../services/productService";
import { authStorage } from "../../services/authStorage";
import { syncEngine } from "../../services/sync/SyncEngine";
import { t } from "../../utils/localization";
import { Text } from "../../components/ui/text";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.round(width * 0.62);

type StatCard = {
  id: string;
  title: string;
  value: string;
  icon: any;
  color: string;
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

  const ACTIONS = [
    {
      id: "a1",
      title: t("newSale"),
      subtitle: t("recordTransaction"),
      icon: ShoppingCart,
      primary: true,
    },
    {
      id: "a2",
      title: t("inventory"),
      subtitle: t("manageStock"),
      icon: Package,
    },
    {
      id: "a3",
      title: t("aiInsights"),
      subtitle: t("smartPredictions"),
      icon: Sparkles,
    },
    {
      id: "a4",
      title: t("allSales"),
      subtitle: t("viewSalesHistory"),
      icon: History,
    },
    {
      id: "a5",
      title: t("aiCreditScore"),
      subtitle: t("loanReadyInsights"),
      icon: CreditCard,
    },
    {
      id: "a6",
      title: t("taxInsights"),
      subtitle: t("quickTaxReports"),
      icon: Landmark,
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      await syncEngine.triggerSync();
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
      title: t("todaysSales"),
      value: `₦${stats.todaySales.toLocaleString()}`,
      icon: CreditCard,
      color: "text-primary",
      hint: "+12%",
    },
    {
      id: "s2",
      title: t("lowStock"),
      value: `${stats.lowStock} ${t("items")}`,
      icon: AlertTriangle,
      color: "text-orange-500",
    },
    {
      id: "s3",
      title: t("totalItems"),
      value: `${stats.totalItems}`,
      icon: Package,
      color: "text-blue-400",
    },
  ];

  const onActionPress = (id: string) => {
    const routes: Record<string, string> = {
      a1: "SalesScreen",
      a2: "InventoryScreen",
      a3: "AIInsightsScreen",
      a4: "AllSalesScreen",
      a5: "CreditProfileScreen",
      a6: "TaxInsightsScreen",
    };
    if (routes[id]) {
      navigation?.navigate(routes[id]);
    }
  };

  const renderStat = ({ item }: { item: StatCard }) => (
    <Card
      style={{ width: CARD_WIDTH }}
      className="p-4 bg-secondary border-border mr-3"
    >
      <View className="flex-row justify-between items-center mb-4">
        <View
          className={cn(
            "w-11 h-11 rounded-xl items-center justify-center bg-background/50",
          )}
        >
          <item.icon size={22} className={item.color} />
        </View>
        {item.hint && (
          <View className="flex-row items-center gap-1 bg-primary/10 px-2 py-1 rounded-full">
            <TrendingUp size={12} className="text-primary" />
            <Text className="text-[10px] font-bold text-primary">
              {item.hint}
            </Text>
          </View>
        )}
      </View>

      <View>
        <Text
          variant="muted"
          className="text-xs mb-1 uppercase font-bold tracking-wider"
        >
          {item.title}
        </Text>
        <Text className="text-2xl font-black text-foreground">
          {item.value}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center gap-3">
          <View className="relative">
            <View className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-primary/20">
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzwsRVGB3rjAn25g6b8ryrRBsEcj0ItVKYAF9o6H9bEspO_Rg3cDHDyo5zsY1wf-73mAjivKyLRWO94RGKZ1RzLKFc6i15ez5rU3C4KDS_AJ4uCmvKRW4StDnxm6V5-6w6tjBJDJrbpILDmXK_G5HTWo035_NSdLhgqFuEn2GvmE3QadfJX8BM2oGs0Tns-4TatYrMiQk9eUACHXJNmz5Zgdn7-MLM1O05ryGZZFLWqLSQnxkDIpgWkrg5Pik9VSXKYxEy-wwXpTo",
                }}
                className="w-full h-full"
              />
            </View>
            <View className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
          </View>
          <View>
            <Text variant="muted" className="text-xs font-bold">
              {t("goodMorning")}
            </Text>
            <Text className="text-lg font-black text-foreground">
              {shopName}
            </Text>
          </View>
        </View>

        <Button
          variant="secondary"
          size="icon"
          className="rounded-2xl w-11 h-11 bg-secondary relative"
        >
          <Bell size={20} color="white" />
          <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View className="px-5 mt-4 mb-2 flex-row justify-between items-end">
          <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {t("overview")}
          </Text>
          <Pressable>
            <Text className="text-primary text-xs font-bold">
              {t("viewReports")}
            </Text>
          </Pressable>
        </View>

        <FlatList
          horizontal
          data={statCards}
          keyExtractor={(i) => i.id}
          renderItem={renderStat}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        />

        {/* Quick Actions Grid */}
        <View className="px-5 mt-6 mb-4">
          <Text variant="h2" className="text-primary font-black">
            {t("quickActions")}
          </Text>
        </View>

        <View className="flex-row flex-wrap px-5 gap-3">
          {ACTIONS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => onActionPress(a.id)}
              className={cn(
                "w-[48%] aspect-square rounded-[24px] p-4 justify-between border",
                a.primary
                  ? "bg-primary border-primary shadow-lg shadow-primary/30"
                  : "bg-secondary border-border",
              )}
            >
              <View className="flex-row justify-between items-start">
                <View
                  className={cn(
                    "w-12 h-12 rounded-2xl items-center justify-center",
                    a.primary ? "bg-white/20" : "bg-background/40",
                  )}
                >
                  <a.icon
                    size={28}
                    color={a.primary ? "#000" : "#fff"}
                    strokeWidth={a.primary ? 2.5 : 2}
                  />
                </View>
                <ArrowRight
                  size={18}
                  color={a.primary ? "#000" : "#666"}
                  strokeWidth={3}
                />
              </View>
              <View>
                <Text
                  className={cn(
                    "text-lg font-black",
                    a.primary ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {a.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className={cn(
                    "text-[11px] font-bold mt-1",
                    a.primary
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {a.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Recent Activity */}
        <View className="px-5 mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text variant="h3" className="text-foreground font-black">
              {t("recentSales")}
            </Text>
            <Pressable>
              <ChevronRight size={20} color="#666" />
            </Pressable>
          </View>

          {recentSales.map((r) => (
            <View
              key={r.id}
              className="flex-row items-center justify-between p-4 mb-3 bg-secondary/50 rounded-2xl border border-border/50"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 rounded-xl bg-background items-center justify-center">
                  <ShoppingCart size={20} className="text-muted-foreground" />
                </View>
                <View>
                  <Text className="text-sm font-black text-foreground">
                    {r.title || t("sale")}
                    {r.itemCount > 1 && ` +${r.itemCount - 1} ${t("items")}`}
                  </Text>
                  <Text variant="muted" className="text-xs font-bold">
                    {new Date(r.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
              <Text className="text-base font-black text-primary">
                +₦{r.totalAmount.toLocaleString()}
              </Text>
            </View>
          ))}

          {recentSales.length === 0 && (
            <View className="items-center py-10 bg-secondary/30 rounded-3xl border border-dashed border-border">
              <History size={40} className="text-muted-foreground/30 mb-2" />
              <Text variant="muted" className="font-bold">
                No recent sales
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (Alternative New Sale) */}
      <View className="absolute bottom-8 left-5 right-5 shadow-2xl shadow-primary/40">
        <Button
          onPress={() => onActionPress("a1")}
          className="h-16 rounded-full bg-primary flex-row gap-3"
        >
          <ShoppingCart size={24} color="#000" strokeWidth={3} />
          <Text className="text-primary-foreground font-black text-lg uppercase tracking-tight">
            {t("newSale")}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
