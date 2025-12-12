// src/screens/InventoryScreen.tsx
import { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { productService } from "../../services/productService";
import { t } from "../../utils/localization";

const { width } = Dimensions.get("window");
const PRIMARY = "#19e680";
const BG = "#f6f8f7";

// UI Product type mapping
type UIProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  qty: number;
  img?: string;
  lowStock?: boolean;
  highlight?: boolean;
};

export default function InventoryScreen({ navigation }: { navigation?: any }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Items");
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from local database
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
        // Determine low stock threshold (e.g. <= 3)
        lowStock: (p.quantity || 0) <= 3,
        // No image support in DB yet
        img: undefined,
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload data when screen focuses
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
    return products.filter((p) => p.lowStock || p.qty <= 3).length;
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      // Filter logic
      if (activeFilter === "Low Stock") return p.lowStock || p.qty <= 3;

      if (activeFilter !== "All Items") {
        // Simple exact match for now, could be improved
        if (activeFilter === "Beverages" && p.category !== "Beverages")
          return false;
        if (activeFilter === "Pantry" && p.category !== "Pantry") return false;
        if (activeFilter === "Snacks" && p.category !== "Snacks") return false;
        // If we want to strictly filter by these categories only when selected:
        if (
          !["Beverages", "Pantry", "Snacks"].includes(activeFilter) &&
          activeFilter !== "All Items"
        ) {
          return p.category === activeFilter;
        }
      }

      // Search logic
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeFilter, products]);

  const renderProduct = ({ item }: { item: UIProduct }) => (
    <TouchableOpacity
      style={[
        styles.itemCard,
        item.lowStock ? styles.itemLow : null,
        item.highlight ? styles.itemHighlight : null,
      ]}
      activeOpacity={0.85}
      onPress={() => {
        /* navigate to product detail - replace with your nav logic */
        console.log("open", item.id);
      }}
    >
      <View style={styles.thumbWrap}>
        {item.img ? (
          <Image source={{ uri: item.img }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <MaterialIcons name="image" size={28} color="#9ca3af" />
          </View>
        )}
      </View>

      <View style={styles.itemContent}>
        <Text numberOfLines={1} style={styles.itemTitle}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.itemCategory}>
          {item.category}
        </Text>
        <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
      </View>

      <View style={styles.itemRight}>
        <View
          style={[
            styles.qtyPill,
            item.lowStock ? styles.qtyPillLow : styles.qtyPillGood,
          ]}
        >
          {item.lowStock ? (
            <MaterialIcons name="warning" size={12} color="#b91c1c" />
          ) : (
            <View style={styles.dot} />
          )}
          <Text
            style={[
              styles.qtyText,
              item.lowStock ? styles.qtyTextLow : styles.qtyTextGood,
            ]}
          >
            {item.qty} {t("quantity")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "dark-content"}
        backgroundColor={BG}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation?.goBack()}
          >
            <MaterialIcons name="arrow-back" size={26} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("inventory")}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="notifications" size={22} color="#111" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color="#9ca3af" />
          <TextInput
            placeholder={t("searchPlaceholder")}
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterBtn}>
            <MaterialIcons name="tune" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersWrap}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(i) => i.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => {
            const active = item.key === activeFilter;
            return (
              <TouchableOpacity
                onPress={() => setActiveFilter(item.key)}
                style={[
                  styles.filterChip,
                  active ? styles.filterChipActive : null,
                ]}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.filterText,
                    active ? styles.filterTextActive : null,
                  ]}
                >
                  {item.label}
                </Text>
                {item.key === "Low Stock" && (
                  <View style={styles.lowCount}>
                    <Text style={styles.lowCountText}>{lowStockCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("noProductsFound")}</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.9}
          onPress={() =>
            navigation?.navigate("SalesScreen", { initialMode: "stock" })
          }
        >
          <MaterialIcons name="add" size={30} color="#000" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: BG,
    borderBottomWidth: 0.25,
    borderBottomColor: "#e6e9e8",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 6,
    color: "#111",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  notificationDot: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: BG,
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrap: { paddingHorizontal: 12, paddingTop: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e6e9e8",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    height: "100%",
    color: "#111",
    fontSize: 15,
  },
  filterBtn: { paddingLeft: 8 },

  filtersWrap: { marginTop: 12, height: 44 },

  filterChip: {
    marginRight: 10,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e9e8",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  filterChipActive: {
    backgroundColor: "#111814",
    borderColor: "#111814",
  },
  filterText: { color: "#111", fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: "#fff" },

  lowCount: {
    marginLeft: 8,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  lowCountText: { color: "#b91c1c", fontSize: 10, fontWeight: "800" },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 16,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    paddingBottom: 140,
  },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6e9e8",
    marginBottom: 12,
  },
  itemLow: {
    borderLeftWidth: 6,
    borderLeftColor: "#ef4444",
  },
  itemHighlight: {
    backgroundColor: "#ecfccb",
    borderColor: "#d9f99d",
  },

  thumbWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  thumb: { width: "100%", height: "100%", resizeMode: "cover" },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },

  itemContent: { flex: 1, justifyContent: "center" },
  itemTitle: { fontSize: 15, fontWeight: "800", color: "#111" },
  itemCategory: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  itemPrice: { marginTop: 6, fontSize: 14, fontWeight: "800", color: PRIMARY },

  itemRight: { alignItems: "flex-end", justifyContent: "center" },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
  },
  qtyPillGood: { backgroundColor: "#ecfdf5" },
  qtyPillLow: { backgroundColor: "#fff1f2" },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#059669" },
  qtyText: { fontSize: 11, fontWeight: "700" },
  qtyTextGood: { color: "#065f46" },
  qtyTextLow: { color: "#7f1d1d" },

  fabWrap: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  fab: {
    width: width - 32,
    height: 56,
    borderRadius: 999,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    flexDirection: "row",
    gap: 12,
  },
});
