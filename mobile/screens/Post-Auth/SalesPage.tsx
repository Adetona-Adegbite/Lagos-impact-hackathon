import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");
const MAIN_GREEN = "#36e27b";

type CartItem = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
  image?: string;
  highlight?: boolean;
};

const SAMPLE_BG =
  "https://images.unsplash.com/photo-1604719312566-b7e605b6b433?q=80&w=2787&auto=format&fit=crop";
const SAMPLE_ITEMS: CartItem[] = [
  {
    id: "i1",
    title: "Indomie Chicken",
    unitPrice: 150,
    qty: 1,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiTw5P4mduVUKUk9F3BsfYGWTUFAo-7AuON8hkyWrKk6pbfDzl20-urDWS0cq50yt8rQ9hnJjoRhZwfymCUyty1hIwZ6x15vN5NhTcQFvkcVZB8gzw1_4LO1A31SJ38DBLSgaK8f-ld3JOD6zfLLB6LL5bYGMDFOKzN2hqj7QZiLqCzt0-K22TMEGFez4zEr7LepONe_7mHIhFLEhoaSOUlLlzhypn3dX6lYm004VNCpWyw-NTnTmkxZYV5E_6lzuU9WofiPwMUvQ",
  },
  {
    id: "i2",
    title: "Dangote Sugar 1kg",
    unitPrice: 1200,
    qty: 2,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAjbOW4Z9vMJzulhUrxozhmLYPFvXOVIhwyQeKE6A46vhFy9vjc1Y5SbHOn8SmDwYoAhVFEwg1jyIKwPHOo5Ei_KbMySIdtPhRCdssBrBPlFVnMR50i_zX6cqP28g_qafPD_2u6XK9lE9AQEeuh5COmNJcmNYVP2noNlb-nwHlWJnGA_POlnWaq2gzUI54yUgXkvpPYeV4ggTa4o64zyp77Jrphgmm15drFBDKkK2HZYY_2UYVSZWUlBr_ICIjAt0v7S-JvE0NfyKU",
  },
  {
    id: "i3",
    title: "Coca Cola 50cl",
    unitPrice: 250,
    qty: 1,
    highlight: true,
  },
];

export default function ScanSellScreen({ navigation }: { navigation?: any }) {
  const [items, setItems] = useState<CartItem[]>(SAMPLE_ITEMS);
  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = Math.min(width * 0.62, 320);

  useEffect(() => {
    // looped scan-line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: -scanBoxSize / 2 + 6,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: scanBoxSize / 2 - 6,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanY, scanBoxSize]);

  const totalAmount = useMemo(
    () => items.reduce((s, it) => s + it.qty * it.unitPrice, 0),
    [items]
  );

  const changeQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) =>
          it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it
        )
        .filter((it) => it.qty > 0)
    );
  };

  const clearAll = () => {
    Alert.alert("Clear cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => setItems([]),
      },
    ]);
  };

  const onCheckout = () => {
    // wire your checkout logic
    Alert.alert("Checkout", `Total: ₦${totalAmount.toLocaleString()}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Pay", onPress: () => console.log("pay!") },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartRow, item.highlight ? styles.highlightRow : null]}>
      <View style={styles.itemLeft}>
        <View style={styles.itemThumb}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemPlaceholder}>
              <MaterialIcons
                name="image"
                size={26}
                color="rgba(255,255,255,0.5)"
              />
            </View>
          )}
        </View>
        <View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemPrice}>
            ₦{item.unitPrice.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.qtyWrap}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => changeQty(item.id, -1)}
        >
          <MaterialIcons name="remove" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnAdd]}
          onPress={() => changeQty(item.id, +1)}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      {/* Camera background */}
      <ImageBackground
        source={{ uri: SAMPLE_BG }}
        style={styles.cameraBg}
        imageStyle={{ opacity: 0.7 }}
      >
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => navigation?.goBack?.()}
          >
            <MaterialIcons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.modeToggle}>
            <TouchableOpacity style={[styles.modePill, styles.modeActive]}>
              <Text style={styles.modeActiveText}>Sell</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modePill}>
              <Text style={styles.modeText}>Stock</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.circleBtn}>
            <MaterialIcons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* camera control shortcuts */}
        <View style={styles.cameraShortcuts}>
          <View style={styles.shortcut}>
            <View style={styles.circleBtnSmall}>
              <MaterialIcons name="flash-on" size={18} color="#fff" />
            </View>
            <Text style={styles.shortcutText}>Flash</Text>
          </View>
          <View style={styles.shortcut}>
            <View style={styles.circleBtnSmall}>
              <MaterialIcons name="keyboard" size={18} color="#fff" />
            </View>
            <Text style={styles.shortcutText}>Enter Code</Text>
          </View>
        </View>

        {/* center scan box */}
        <View style={styles.centerArea}>
          <View
            style={[
              styles.scanBox,
              { width: scanBoxSize, height: scanBoxSize },
            ]}
          >
            {/* corners */}
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />

            {/* animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  transform: [{ translateY: scanY }],
                  width: scanBoxSize - 16,
                },
              ]}
            />
          </View>

          <View style={styles.alignHint}>
            <MaterialIcons
              name="center-focus-strong"
              size={18}
              color={MAIN_GREEN}
            />
            <Text style={styles.alignText}>Align barcode within frame</Text>
          </View>
        </View>

        {/* bottom sheet: cart */}
        <View style={styles.bottomSheet}>
          {/* handle + header */}
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Current Cart</Text>
              <Text style={styles.sheetSub}>{items.length} items scanned</Text>
            </View>
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            style={styles.cartList}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  No items in cart yet — scan to add.
                </Text>
              </View>
            }
          />
        </View>

        {/* checkout bar */}
        <View style={styles.checkoutWrap}>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={onCheckout}
            activeOpacity={0.9}
          >
            <View>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                ₦{totalAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.checkoutRight}>
              <Text style={styles.checkoutText}>Checkout</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#062" />
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  cameraBg: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
  },

  topControls: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 38,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.42)",
    padding: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modePill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  modeActive: { backgroundColor: MAIN_GREEN },
  modeText: { color: "rgba(255,255,255,0.85)", fontWeight: "700" },
  modeActiveText: { color: "#062", fontWeight: "900" },

  cameraShortcuts: {
    position: "absolute",
    top: (StatusBar.currentHeight ?? 24) + 110,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  shortcut: { alignItems: "center" },
  circleBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shortcutText: { color: "rgba(255,255,255,0.8)", fontSize: 11 },

  centerArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  scanBox: {
    borderWidth: 2,
    borderColor: "rgba(54,226,123,0.45)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: MAIN_GREEN,
    shadowOpacity: 0.18,
    elevation: 8,
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: MAIN_GREEN,
    borderRadius: 6,
  },
  tl: { left: -2, top: -2, transform: [{ rotate: "0deg" }] },
  tr: { right: -2, top: -2, transform: [{ rotate: "90deg" }] },
  bl: { left: -2, bottom: -2, transform: [{ rotate: "-90deg" }] },
  br: { right: -2, bottom: -2, transform: [{ rotate: "180deg" }] },

  scanLine: {
    position: "absolute",
    height: 3,
    backgroundColor: MAIN_GREEN,
    opacity: 0.95,
    shadowColor: MAIN_GREEN,
    shadowRadius: 8,
    shadowOpacity: 0.9,
  },

  alignHint: {
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alignText: { color: MAIN_GREEN, marginLeft: 8, fontWeight: "700" },

  /* Bottom sheet */
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 90,
    maxHeight: height * 0.45,
    backgroundColor: "#0f211a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    elevation: 20,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 8,
  },
  sheetTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  sheetSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  clearText: { color: MAIN_GREEN, fontWeight: "800" },

  cartList: { marginTop: 6 },

  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    marginBottom: 8,
  },
  highlightRow: {
    backgroundColor: "rgba(54,226,123,0.06)",
    borderColor: "rgba(54,226,123,0.16)",
  },

  itemLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  itemImage: { width: "100%", height: "100%", resizeMode: "cover" },
  itemPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  itemPrice: { color: MAIN_GREEN, fontWeight: "800", marginTop: 4 },

  qtyWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnAdd: { backgroundColor: "rgba(255,255,255,0.12)" },
  qtyText: {
    color: "#fff",
    minWidth: 24,
    textAlign: "center",
    fontWeight: "800",
  },

  emptyRow: { paddingVertical: 24, alignItems: "center" },
  emptyText: { color: "rgba(255,255,255,0.6)" },

  checkoutWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 18,
  },
  checkoutBtn: {
    height: 64,
    borderRadius: 999,
    backgroundColor: MAIN_GREEN,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 12,
  },
  totalLabel: {
    color: "rgba(0,0,0,0.65)",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  totalValue: { color: "#062", fontSize: 18, fontWeight: "900" },
  checkoutRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.08)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 18,
  },
  checkoutText: { fontWeight: "800", color: "#062" },
});
