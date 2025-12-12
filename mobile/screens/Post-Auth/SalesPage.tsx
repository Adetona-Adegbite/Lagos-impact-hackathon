// src/screens/ScanSellScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
const { width, height } = Dimensions.get("window");
const MAIN_GREEN = "#36e27b";
/* ----- Types ----- */
type CartItem = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
  image?: string | null;
  highlight?: boolean;
};
type StockItem = {
  id: string;
  title: string;
  price: number;
  qty: number;
  img?: string | null;
  lowStock?: boolean;
};
/* ----- Demo data & helpers ----- */
function resolveProductFromCode(
  code: string
): { id: string; title: string; price: number } | null {
  if (code.includes("IND"))
    return { id: "p1", title: "Indomie Chicken", price: 150 };
  if (code.includes("SUG"))
    return { id: "p2", title: "Dangote Sugar 1kg", price: 1200 };
  if (code.includes("COC"))
    return { id: "p3", title: "Coca Cola 50cl", price: 250 };
  return { id: `x-${code}`, title: `Scanned: ${code}`, price: 200 };
}
/* ----- Component ----- */
export default function ScanSellScreen({ navigation }: { navigation?: any }) {
  /* camera permissions & refs */
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torch, setTorch] = useState(false);
  /* mode: "sell" | "stock" */
  const [mode, setMode] = useState<"sell" | "stock">("sell");
  /* cart & stock */
  const [cart, setCart] = useState<CartItem[]>([
    { id: "p1", title: "Indomie Chicken", unitPrice: 150, qty: 1, image: null },
    {
      id: "p2",
      title: "Dangote Sugar 1kg",
      unitPrice: 1200,
      qty: 2,
      image: null,
    },
  ]);
  const [stock, setStock] = useState<StockItem[]>([
    { id: "p1", title: "Indomie Chicken", price: 150, qty: 120, img: null },
    {
      id: "p2",
      title: "Dangote Sugar 1kg",
      price: 1200,
      qty: 3,
      img: null,
      lowStock: true,
    },
    { id: "p3", title: "Coca Cola 50cl", price: 250, qty: 45, img: null },
  ]);
  /* scan animation */
  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = Math.min(width * 0.62, 320);
  /* scan cooldown to avoid duplicates */
  const lastScanTs = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 900;
  /* enter-code modal */
  const [enterModalVisible, setEnterModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  /* product modal */
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<{
    id: string;
    title: string;
    price: number;
    qty: number;
  } | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState(0);
  /* bottom sheet height (keeps camera visible) */
  const BOTTOM_SHEET_MAX_HEIGHT = Math.min(height * 0.3, 520);
  useEffect(() => {
    if (permission === null) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);
  useEffect(() => {
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
  useEffect(() => {
    if (productModalVisible && currentProduct) {
      setEditTitle(currentProduct.title);
      setEditPrice(currentProduct.price.toString());
      setEditQty(currentProduct.qty);
    }
  }, [productModalVisible, currentProduct]);
  const totalAmount = useMemo(
    () => cart.reduce((s, it) => s + it.qty * it.unitPrice, 0),
    [cart]
  );
  /* ----- Actions ----- */
  const changeCartQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((it) =>
          it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it
        )
        .filter((it) => it.qty > 0)
    );
  const changeStockQty = (id: string, delta: number) =>
    setStock((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it
      )
    );
  const clearAllCart = () =>
    Alert.alert("Clear cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setCart([]) },
    ]);
  const onCheckout = () =>
    Alert.alert("Checkout", `Total: ₦${totalAmount.toLocaleString()}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Pay", onPress: () => console.log("pay!") },
    ]);
  const toggleTorch = () => setTorch((prev) => !prev);
  const toggleCameraType = () =>
    setFacing((t) => (t === "back" ? "front" : "back"));
  const handleEnterCodeConfirm = () => {
    if (!enteredCode.trim()) {
      Alert.alert("Enter code", "Please enter a code.");
      return;
    }
    handleScannedCode(enteredCode.trim());
    setEnteredCode("");
    setEnterModalVisible(false);
  };
  const handleScannedCode = (data: string) => {
    const now = Date.now();
    if (now - lastScanTs.current < SCAN_COOLDOWN_MS) return;
    lastScanTs.current = now;
    const resolved = resolveProductFromCode(data);
    if (!resolved) return; // Though in current impl, always returns
    const productId = resolved.id;
    let product;
    if (mode === "stock") {
      const existing = stock.find((p) => p.id === productId);
      if (existing) {
        product = {
          id: existing.id,
          title: existing.title,
          price: existing.price,
          qty: existing.qty,
        };
        setIsNewProduct(false);
      } else {
        product = {
          id: productId,
          title: resolved.title,
          price: resolved.price,
          qty: 1,
        };
        setIsNewProduct(true);
      }
      setCurrentProduct(product);
      setProductModalVisible(true);
    } else {
      // sell
      const existing = stock.find((p) => p.id === productId);
      if (existing) {
        setCart((prev) => {
          const found = prev.find((p) => p.id === productId);
          if (found)
            return prev.map((p) =>
              p.id === productId ? { ...p, qty: p.qty + 1 } : p
            );
          return [
            {
              id: productId,
              title: existing.title,
              unitPrice: existing.price,
              qty: 1,
            },
            ...prev,
          ];
        });
      } else {
        product = {
          id: productId,
          title: resolved.title,
          price: resolved.price,
          qty: 1,
        };
        setCurrentProduct(product);
        setIsNewProduct(true);
        setProductModalVisible(true);
      }
    }
  };
  const handleProductConfirm = () => {
    if (!currentProduct) return;
    const updatedProduct = {
      id: currentProduct.id,
      title: editTitle.trim(),
      price: parseFloat(editPrice) || 0,
      qty: editQty,
    };
    if (
      updatedProduct.title === "" ||
      updatedProduct.price <= 0 ||
      updatedProduct.qty < 0
    ) {
      Alert.alert("Invalid input", "Please fill all fields correctly.");
      return;
    }
    if (mode === "stock") {
      setStock((prev) => {
        const lowStock = updatedProduct.qty < 5;
        if (prev.find((p) => p.id === updatedProduct.id)) {
          return prev.map((p) =>
            p.id === updatedProduct.id
              ? {
                  ...p,
                  title: updatedProduct.title,
                  price: updatedProduct.price,
                  qty: updatedProduct.qty,
                  lowStock,
                }
              : p
          );
        } else {
          return [
            {
              id: updatedProduct.id,
              title: updatedProduct.title,
              price: updatedProduct.price,
              qty: updatedProduct.qty,
              img: null,
              lowStock,
            },
            ...prev,
          ];
        }
      });
    } else {
      // sell, new product
      const lowStock = updatedProduct.qty < 5;
      setStock((prev) => [
        {
          id: updatedProduct.id,
          title: updatedProduct.title,
          price: updatedProduct.price,
          qty: updatedProduct.qty,
          img: null,
          lowStock,
        },
        ...prev,
      ]);
      setCart((prev) => {
        const found = prev.find((p) => p.id === updatedProduct.id);
        if (found) {
          return prev.map((p) =>
            p.id === updatedProduct.id ? { ...p, qty: p.qty + 1 } : p
          );
        }
        return [
          {
            id: updatedProduct.id,
            title: updatedProduct.title,
            unitPrice: updatedProduct.price,
            qty: 1,
            image: null,
          },
          ...prev,
        ];
      });
    }
    setProductModalVisible(false);
    setCurrentProduct(null);
  };
  const onBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!data) return;
    console.log(`Scanned barcode: ${data}`);
    handleScannedCode(data);
  };
  if (permission === null) {
    return <View />;
  }
  if (!permission.granted) {
    return (
      <SafeAreaView
        style={[
          styles.safe,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text>No access to camera. Please allow camera permissions.</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  /* Renderers (cart/stock rows) */
  const renderCartRow = ({ item }: { item: CartItem }) => (
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
          onPress={() => changeCartQty(item.id, -1)}
        >
          <MaterialIcons name="remove" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnAdd]}
          onPress={() => changeCartQty(item.id, +1)}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
  const renderStockRow = ({ item }: { item: StockItem }) => (
    <View style={[styles.cartRow, item.lowStock ? styles.highlightRow : null]}>
      <View style={styles.itemLeft}>
        <View style={styles.itemThumb}>
          {item.img ? (
            <Image source={{ uri: item.img }} style={styles.itemImage} />
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
          <Text style={styles.itemPrice}>₦{item.price.toLocaleString()}</Text>
        </View>
      </View>
      <View style={styles.qtyWrap}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => changeStockQty(item.id, -1)}
        >
          <MaterialIcons name="remove" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnAdd]}
          onPress={() => changeStockQty(item.id, +1)}
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
      <View style={styles.container}>
        {/* Camera */}
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            enableTorch={torch}
            onBarcodeScanned={onBarcodeScanned}
          />
          {/* Top controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation?.goBack?.()}
            >
              <MaterialIcons name="close" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modePill,
                  mode === "sell" ? styles.modeActive : undefined,
                ]}
                onPress={() => setMode("sell")}
              >
                <Text
                  style={
                    mode === "sell" ? styles.modeActiveText : styles.modeText
                  }
                >
                  Sell
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modePill,
                  mode === "stock" ? styles.modeActive : undefined,
                ]}
                onPress={() => setMode("stock")}
              >
                <Text
                  style={
                    mode === "stock" ? styles.modeActiveText : styles.modeText
                  }
                >
                  Stock
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.rightTopActions}>
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => toggleCameraType()}
              >
                <MaterialIcons name="flip-camera-ios" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {/* Camera shortcuts + scan box */}
          <View style={styles.cameraShortcuts}>
            <View style={styles.shortcut}>
              <TouchableOpacity
                onPress={toggleTorch}
                style={styles.circleBtnSmall}
              >
                <MaterialIcons
                  name={torch ? "flash-on" : "flash-off"}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text style={styles.shortcutText}>Flash</Text>
            </View>
            <View style={styles.shortcut}>
              <TouchableOpacity
                onPress={() => setEnterModalVisible(true)}
                style={styles.circleBtnSmall}
              >
                <MaterialIcons name="keyboard" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.shortcutText}>Enter Code</Text>
            </View>
          </View>
          {/* Scan box */}
          <View style={styles.centerArea}>
            <View
              style={[
                styles.scanBox,
                { width: scanBoxSize, height: scanBoxSize },
              ]}
            >
              <View style={[styles.corner, styles.tl]} />
              <View style={[styles.corner, styles.tr]} />
              <View style={[styles.corner, styles.bl]} />
              <View style={[styles.corner, styles.br]} />
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
        </View>
        {/* Bottom sheet */}
        <View
          style={[styles.bottomSheet, { maxHeight: BOTTOM_SHEET_MAX_HEIGHT }]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>
                {mode === "sell" ? "Current Cart" : "Stock Inventory"}
              </Text>
              <Text style={styles.sheetSub}>
                {mode === "sell"
                  ? `${cart.length} items scanned`
                  : `${stock.length} items in stock`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                mode === "sell"
                  ? clearAllCart()
                  : Alert.alert("Stock actions", "Use +/- to update stock.")
              }
            >
              <Text style={styles.clearText}>
                {mode === "sell" ? "Clear All" : "Manage"}
              </Text>
            </TouchableOpacity>
          </View>
          {mode === "sell" ? (
            <FlatList
              data={cart}
              keyExtractor={(i) => i.id}
              renderItem={renderCartRow}
              style={styles.cartList}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    No items in cart yet — scan to add.
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={stock}
              keyExtractor={(i) => i.id}
              renderItem={renderStockRow}
              style={styles.cartList}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    No stock items — scan to add.
                  </Text>
                </View>
              }
            />
          )}
        </View>
        {/* Checkout / Save */}
        {mode === "sell" ? (
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
        ) : (
          <View style={styles.checkoutWrap}>
            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: "#0b2b20" }]}
              onPress={() =>
                Alert.alert(
                  "Stock saved",
                  "Stock changes saved locally (demo)."
                )
              }
            >
              <View>
                <Text style={[styles.totalLabel, { color: "#fff" }]}>
                  Stock Summary
                </Text>
                <Text style={[styles.totalValue, { color: "#fff" }]}>
                  {stock.length} items
                </Text>
              </View>
              <View
                style={[
                  styles.checkoutRight,
                  { backgroundColor: "rgba(255,255,255,0.08)" },
                ]}
              >
                <Text style={[styles.checkoutText, { color: "#fff" }]}>
                  Save
                </Text>
                <MaterialIcons name="check" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        )}
        {/* Enter code modal */}
        <Modal
          visible={enterModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEnterModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={modalStyles.modalWrapper}
          >
            <View style={modalStyles.modal}>
              <Text style={modalStyles.modalTitle}>Enter Product Code</Text>
              <TextInput
                value={enteredCode}
                onChangeText={setEnteredCode}
                placeholder="e.g. IND-001 or barcode value"
                placeholderTextColor="#999"
                style={modalStyles.modalInput}
                autoFocus
              />
              <View style={modalStyles.modalRow}>
                <TouchableOpacity
                  style={modalStyles.modalBtnAlt}
                  onPress={() => {
                    setEnteredCode("");
                    setEnterModalVisible(false);
                  }}
                >
                  <Text style={modalStyles.modalBtnTextAlt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={modalStyles.modalBtn}
                  onPress={handleEnterCodeConfirm}
                >
                  <Text style={modalStyles.modalBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        {/* Product details modal */}
        <Modal
          visible={productModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setProductModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={productModalStyles.modalWrapper}
          >
            <View style={productModalStyles.modal}>
              <Text style={productModalStyles.modalTitle}>
                {isNewProduct ? "Add New Product" : "Edit Product"}
              </Text>
              <View style={productModalStyles.field}>
                <Text style={productModalStyles.label}>Product Name</Text>
                <View style={productModalStyles.inputWrap}>
                  <TextInput
                    style={productModalStyles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Enter product name"
                    placeholderTextColor="#999"
                  />
                  <MaterialIcons
                    name="edit"
                    size={24}
                    color={MAIN_GREEN}
                    style={productModalStyles.icon}
                  />
                </View>
              </View>
              <View style={productModalStyles.field}>
                <Text style={productModalStyles.label}>Price</Text>
                <View style={productModalStyles.inputWrap}>
                  <Text style={productModalStyles.prefix}>₦</Text>
                  <TextInput
                    style={[
                      productModalStyles.input,
                      productModalStyles.inputWithPrefix,
                    ]}
                    value={editPrice}
                    onChangeText={(text) =>
                      setEditPrice(text.replace(/[^0-9.]/g, ""))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              <View style={productModalStyles.field}>
                <Text style={productModalStyles.label}>Quantity</Text>
                <View style={productModalStyles.qtyWrap}>
                  <TouchableOpacity
                    style={productModalStyles.qtyBtn}
                    onPress={() => setEditQty(Math.max(0, editQty - 1))}
                  >
                    <MaterialIcons name="remove" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={productModalStyles.qtyDisplay}>
                    <Text style={productModalStyles.qtyText}>{editQty}</Text>
                    <Text style={productModalStyles.qtyUnit}>Units</Text>
                  </View>
                  <TouchableOpacity
                    style={productModalStyles.qtyBtnAdd}
                    onPress={() => setEditQty(editQty + 1)}
                  >
                    <MaterialIcons name="add" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={productModalStyles.modalRow}>
                <TouchableOpacity
                  style={productModalStyles.modalBtnAlt}
                  onPress={() => setProductModalVisible(false)}
                >
                  <Text style={productModalStyles.modalBtnTextAlt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={productModalStyles.modalBtn}
                  onPress={handleProductConfirm}
                >
                  <Text style={productModalStyles.modalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
/* ----- Styles ----- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  topControls: {
    position: "absolute",
    top: Platform.OS === "android" ? StatusBar.currentHeight ?? 12 : 12,
    left: 12,
    right: 12,
    zIndex: 30,
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
  rightTopActions: { flexDirection: "row", gap: 8 },
  cameraShortcuts: {
    position: "absolute",
    top: (StatusBar.currentHeight ?? 24) + 48,
    left: 12,
    right: 12,
    zIndex: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  shortcut: { alignItems: "center" },
  circleBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  shortcutText: { color: "rgba(255,255,255,0.8)", fontSize: 11 },
  centerArea: {
    position: "absolute",
    top: (StatusBar.currentHeight ?? 24) + 42,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
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
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 90,
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
  cartList: { marginTop: 6, maxHeight: 1000 },
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
  checkoutWrap: { position: "absolute", left: 12, right: 12, bottom: 12 },
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
/* ----- Modal styles ----- */
const modalStyles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#111",
  },
  modalInput: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6e9e8",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  modalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  modalBtn: {
    backgroundColor: MAIN_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalBtnText: { color: "#062", fontWeight: "800" },
  modalBtnAlt: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  modalBtnTextAlt: { color: "#111", fontWeight: "700" },
});
/* ----- Product Modal styles ----- */
const productModalStyles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    width: "90%",
    backgroundColor: "#1a2c23",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#fff",
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: "#999",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
    marginLeft: 4,
  },
  inputWrap: {
    position: "relative",
  },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "#23362b",
    paddingHorizontal: 12,
    color: "#fff",
    fontSize: 16,
  },
  icon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  prefix: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    color: MAIN_GREEN,
    fontSize: 18,
  },
  inputWithPrefix: {
    paddingLeft: 32,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#23362b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 8,
  },
  qtyBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 8,
  },
  qtyBtnAdd: {
    backgroundColor: MAIN_GREEN,
  },
  qtyDisplay: {
    alignItems: "center",
  },
  qtyText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  qtyUnit: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  modalBtn: {
    backgroundColor: MAIN_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalBtnText: { color: "#000", fontWeight: "800" },
  modalBtnAlt: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  modalBtnTextAlt: { color: "#fff", fontWeight: "700" },
});
