import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  TextInput,
  Image,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Bell,
  Package,
  AlertTriangle,
  Plus,
  ChevronRight,
  ImageIcon,
} from "lucide-react-native";
import { productService } from "../../services/productService";
import { t } from "../../utils/localization";
import { Text } from "../../components/ui/text";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils";

const { width } = Dimensions.get("window");

type UIProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  qty: number;
  img?: string;
  lowStock?: boolean;
};

export default function InventoryScreen({ navigation }: { navigation?: any }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Items");
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const dbProducts = await productService.getAllProducts();

      const mappedProducts: UIProduct[] = dbProducts.map((p) => ({
        id: p.id,
        title: p.name,
        category: p.category,
        price: p.sellingPrice,
        qty: p.quantity || 0,
        lowStock: (p.quantity || 0) <= 3,
        img: undefined,
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts]),
  );

  const filters = useMemo(
    () => [
      { key: "All Items", label: t("allItems") },
      { key: "Low Stock", label: t("lowStock") },
      { key: "Beverages", label: t("beverages") },
      { key: "Pantry", label: t("pantry") },
      { key: "Snacks", label: t("snacks") },
    ],
    [],
  );

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.lowStock).length;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeFilter === "Low Stock") return p.lowStock;
      if (activeFilter !== "All Items") {
        if (p.category !== activeFilter) return false;
      }
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeFilter, products]);

  const renderProduct = ({ item }: { item: UIProduct }) => (
    <Card className="flex-row items-center p-3 mb-3 bg-secondary/50 border-border/50">
      <View className="w-16 h-16 rounded-xl overflow-hidden bg-background items-center justify-center">
        {item.img ? (
          <Image
            source={{ uri: item.img }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <ImageIcon size={24} className="text-muted-foreground/30" />
        )}
      </View>

      <View className="flex-1 ml-4 justify-center">
        <Text className="text-sm font-black text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
          {item.category}
        </Text>
        <Text className="text-primary font-black mt-1">
          ₦{item.price.toLocaleString()}
        </Text>
      </View>

      <View className="items-end">
        <View
          className={cn(
            "flex-row items-center gap-1.5 px-3 py-1.5 rounded-full",
            item.lowStock ? "bg-destructive/10" : "bg-primary/10",
          )}
        >
          {item.lowStock ? (
            <AlertTriangle size={12} className="text-destructive" />
          ) : (
            <View className="w-2 h-2 rounded-full bg-primary" />
          )}
          <Text
            className={cn(
              "text-[10px] font-black uppercase",
              item.lowStock ? "text-destructive" : "text-primary",
            )}
          >
            {item.qty} {t("quantity")}
          </Text>
        </View>
        <Pressable
          className="mt-2"
          onPress={() => console.log("edit", item.id)}
        >
          <ChevronRight size={18} className="text-muted-foreground/50" />
        </Pressable>
      </View>
    </Card>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-border/10">
        <View className="flex-row items-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="w-10 h-10 rounded-full bg-secondary"
            onPress={() => navigation?.goBack()}
          >
            <ArrowLeft size={22} color="white" />
          </Button>
          <Text variant="h3" className="font-black text-foreground">
            {t("inventory")}
          </Text>
        </View>

        <Button
          variant="secondary"
          size="icon"
          className="w-10 h-10 rounded-full bg-secondary"
        >
          <Bell size={20} color="white" />
          <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>
      </View>

      {/* Search & Filter */}
      <View className="px-5 pt-4 gap-4">
        <View className="flex-row items-center h-12 rounded-2xl bg-secondary border border-border px-4">
          <Search size={18} className="text-muted-foreground" />
          <TextInput
            placeholder={t("searchPlaceholder")}
            placeholderTextColor="#6b7280"
            className="flex-1 ml-3 h-full text-foreground font-bold"
            value={query}
            onChangeText={setQuery}
          />
          <Pressable>
            <SlidersHorizontal size={18} className="text-muted-foreground" />
          </Pressable>
        </View>

        {/* Filter Chips */}
        <View className="h-10">
          <FlatList
            horizontal
            data={filters}
            keyExtractor={(i) => i.key}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = item.key === activeFilter;
              return (
                <Pressable
                  onPress={() => setActiveFilter(item.key)}
                  className={cn(
                    "flex-row items-center px-4 h-9 rounded-full mr-2 border",
                    active
                      ? "bg-primary border-primary"
                      : "bg-secondary/50 border-border",
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs font-black",
                      active
                        ? "text-primary-foreground uppercase"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Text>
                  {item.key === "Low Stock" && (
                    <View
                      className={cn(
                        "ml-2 px-1.5 py-0.5 rounded-full",
                        active
                          ? "bg-primary-foreground/20"
                          : "bg-destructive/20",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-[10px] font-black",
                          active
                            ? "text-primary-foreground"
                            : "text-destructive",
                        )}
                      >
                        {lowStockCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>

      {/* List */}
      <View className="flex-1 px-5 pt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#36e27b" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            renderItem={renderProduct}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center py-20 bg-secondary/20 rounded-3xl border border-dashed border-border mt-4">
                <Package size={48} className="text-muted-foreground/20 mb-3" />
                <Text
                  variant="p"
                  className="text-muted-foreground font-bold text-center"
                >
                  {t("noProductsFound")}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <View className="absolute bottom-10 left-5 right-5 shadow-2xl shadow-primary/40">
        <Button
          onPress={() =>
            navigation?.navigate("SalesScreen", { initialMode: "stock" })
          }
          className="h-16 rounded-full bg-primary flex-row gap-2"
        >
          <Plus size={24} color="#000" strokeWidth={3} />
          <Text className="text-primary-foreground font-black text-lg uppercase tracking-tight">
            {t("addItem")}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
