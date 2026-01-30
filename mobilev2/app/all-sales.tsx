import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Search,
  Sparkles,
  TrendingUp,
  ShoppingCart,
  Plus,
  Calendar,
} from "lucide-react-native";
import { productService } from "@/services/productService";
import { t } from "@/utils/localization";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const { width } = Dimensions.get("window");

export default function AllSalesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sales, setSales] = useState<any[]>([]);
  const [insights] = useState({
    message:
      "Your sales are up 12% compared to last week. Most sales are coming from Beverages.",
    chips: [
      { label: "Top Seller", value: "Coke 50cl", color: "text-primary" },
      { label: "Low Margin", value: "Bread", color: "text-destructive" },
    ],
  });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const allSales = await productService.getAllSales();
        setSales(allSales);
      } catch (error) {
        console.error("Failed to fetch sales", error);
      }
    };
    fetchSales();
  }, []);

  const filters = ["All", "Cash", "POS", "Transfer"];

  const filteredSales = useMemo(() => {
    const q = query.toLowerCase();
    return sales.filter((s) => {
      const matchesSearch = (s.title || "Sale").toLowerCase().includes(q);
      const matchesFilter =
        activeFilter === "All" || s.paymentMethod === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [query, activeFilter, sales]);

  const todayStr = new Date().toDateString();
  const todaySales = filteredSales.filter(
    (s) => new Date(s.createdAt).toDateString() === todayStr,
  );
  const previousSales = filteredSales.filter(
    (s) => new Date(s.createdAt).toDateString() !== todayStr,
  );

  const totalToday = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Simple weekly data mock for graph
  const weeklyData = [40, 70, 45, 90, 65, 80, 50];

  const renderSaleItem = ({ item }: { item: any }) => (
    <Card className="flex-row items-center p-4 mb-3 bg-secondary/50 border-border/50">
      <View className="w-12 h-12 rounded-2xl bg-background items-center justify-center">
        <ShoppingCart size={20} className="text-muted-foreground" />
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-sm font-black text-foreground">
          {item.title || t("sale")}
          {item.itemCount > 1 && ` +${item.itemCount - 1} ${t("items")}`}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          <Text variant="muted" className="text-[10px] font-bold">
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View className="w-1 h-1 rounded-full bg-muted-foreground/30" />
          <Text
            variant="muted"
            className="text-[10px] font-bold uppercase tracking-tight"
          >
            {item.paymentMethod || "Cash"}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-base font-black text-primary">
          ₦{item.totalAmount.toLocaleString()}
        </Text>
        <View className="bg-primary/10 px-2 py-0.5 rounded-md mt-1">
          <Text className="text-[9px] font-black text-primary uppercase">
            Paid
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 rounded-full bg-secondary"
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color="white" />
          </Button>
          <Text variant="h3" className="font-black text-foreground">
            {t("allSales")}
          </Text>
        </View>
        <Button
          variant="secondary"
          size="icon"
          className="w-10 h-10 rounded-full bg-secondary"
        >
          <Calendar size={20} color="white" />
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Assistant Card */}
        <View className="px-5 mt-2">
          <Card className="bg-primary/10 border-primary/20 p-5 rounded-[32px]">
            <View className="flex-row items-center gap-2 mb-3">
              <Sparkles size={18} className="text-primary" />
              <Text className="text-[10px] font-black text-primary uppercase tracking-widest">
                AI Sales Assistant
              </Text>
            </View>
            <Text className="text-foreground text-sm font-bold leading-5 mb-4">
              {insights.message}
            </Text>
            <View className="flex-row gap-3">
              {insights.chips.map((chip, idx) => (
                <View
                  key={idx}
                  className="bg-background/50 px-3 py-2 rounded-2xl border border-white/5 flex-1"
                >
                  <Text className="text-[9px] font-black text-muted-foreground uppercase mb-1">
                    {chip.label}
                  </Text>
                  <Text className={cn("text-xs font-black", chip.color)}>
                    {chip.value}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Weekly Overview */}
        <View className="px-5 mt-6">
          <Card className="bg-secondary p-5 rounded-[32px] border-border/50">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  Today's Total
                </Text>
                <Text className="text-3xl font-black text-foreground">
                  ₦{totalToday.toLocaleString()}
                </Text>
              </View>
              <View className="w-12 h-12 rounded-2xl bg-primary/20 items-center justify-center">
                <TrendingUp size={24} className="text-primary" />
              </View>
            </View>

            <View className="flex-row items-end h-24 gap-3 px-1">
              {weeklyData.map((val, i) => (
                <View key={i} className="flex-1 items-center">
                  <View
                    style={{ height: `${val}%` }}
                    className={cn(
                      "w-full rounded-t-lg",
                      i === 6
                        ? "bg-primary shadow-lg shadow-primary/30"
                        : "bg-primary/20",
                    )}
                  />
                  <Text className="text-[8px] font-black text-muted-foreground mt-2">
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Search & Filter */}
        <View className="px-5 mt-8">
          <View className="flex-row items-center h-12 rounded-2xl bg-secondary border border-border px-4 mb-4">
            <Search size={18} className="text-muted-foreground" />
            <Input
              placeholder="Search sales..."
              className="flex-1 bg-transparent border-0 h-full text-sm font-bold ml-2"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-2"
          >
            {filters.map((f) => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                className={cn(
                  "px-5 h-9 rounded-full mr-2 border justify-center",
                  activeFilter === f
                    ? "bg-primary border-primary"
                    : "bg-secondary border-border",
                )}
              >
                <Text
                  className={cn(
                    "text-[11px] font-black uppercase",
                    activeFilter === f
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Sales List */}
        <View className="px-5 mt-4">
          {todaySales.length > 0 && (
            <View className="mb-6">
              <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">
                Today
              </Text>
              {todaySales.map((sale) => (
                <View key={sale.id}>{renderSaleItem({ item: sale })}</View>
              ))}
            </View>
          )}

          {previousSales.length > 0 && (
            <View>
              <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-1">
                Earlier
              </Text>
              {previousSales.map((sale) => (
                <View key={sale.id}>{renderSaleItem({ item: sale })}</View>
              ))}
            </View>
          )}

          {filteredSales.length === 0 && (
            <View className="items-center py-20 bg-secondary/30 rounded-[32px] border border-dashed border-border">
              <ShoppingCart
                size={48}
                className="text-muted-foreground/20 mb-3"
              />
              <Text
                variant="p"
                className="text-muted-foreground font-bold text-center"
              >
                No matching sales found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <View className="absolute bottom-10 right-6 shadow-2xl shadow-primary/40">
        <Button
          size="icon"
          className="w-16 h-16 rounded-full bg-primary"
          onPress={() => router.push("/sales")}
        >
          <Plus size={32} color="#000" strokeWidth={3} />
        </Button>
      </View>
    </SafeAreaView>
  );
}
