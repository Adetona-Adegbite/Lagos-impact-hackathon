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
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { productService } from "../../services/productService";

const { width, height } = Dimensions.get("window");
const MAIN_GREEN = "#19e680";

type CartItem = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
  image?: string | null;
  productId: string; // link to DB product
};

type StockItem = {
  id: string; // product id
  title: string;
  price: number;
  qty: number;
  img?: string | null;
  lowStock?: boolean;
};

/* ----- Component ----- */
export default function ScanSellScreen({
  navigation,
  route,
}: {
  navigation?: any;
  route?: any;
}) {
  /* camera permissions & refs */
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torch, setTorch] = useState(false);

  /* mode: "sell" | "stock" */
  const [mode, setMode] = useState<"sell" | "stock">(
    route?.params?.initialMode || "sell",
  );

  useEffect(() => {
    if (route?.params?.initialMode) {
      setMode(route.params.initialMode);
    }
  }, [route?.params?.initialMode]);

  /* cart */
  const [cart, setCart] = useState<CartItem[]>([]);

  /* loading state */
  const [loading, setLoading] = useState(false);

  /* scan animation */
  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = Math.min(width * 0.62, 320);

  /* scan cooldown to avoid duplicates */
  const lastScanTs = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 1500; // Increased slightly for async ops

  /* enter-code modal */
  const [enterModalVisible, setEnterModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");

  /* product modal */
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<{
    id?: string; // undefined if new
    barcode: string;
    title: string;
    price: number;
    qty: number;
    category: string;
    costPrice: number;
  } | null>(null);

  const [isNewProduct, setIsNewProduct] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editCategory, setEditCategory] = useState("General");
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
      ]),
    ).start();
  }, [scanY, scanBoxSize]);

  // Sync edit form when modal opens
  useEffect(() => {
    if (productModalVisible && currentProduct) {
      setEditTitle(currentProduct.title);
      setEditPrice(currentProduct.price.toString());
      setEditCostPrice(currentProduct.costPrice.toString());
      setEditCategory(currentProduct.category);
      setEditQty(currentProduct.qty);
    }
  }, [productModalVisible, currentProduct]);

  const totalAmount = useMemo(
    () => cart.reduce((s, it) => s + it.qty * it.unitPrice, 0),
    [cart],
  );

  /* ----- Actions ----- */
  const changeCartQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((it) =>
          it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it,
        )
        .filter((it) => it.qty > 0),
    );

  const clearAllCart = () =>
    Alert.alert("Clear cart", "Remove all items from cart?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setCart([]) },
    ]);

  const onCheckout = async () => {
    if (cart.length === 0) return;

    Alert.alert("Checkout", `Total: ₦${totalAmount.toLocaleString()}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pay",
        onPress: async () => {
          try {
            setLoading(true);
            const itemsToProcess = cart.map((item) => ({
              productId: item.productId,
              quantity: item.qty,
              price: item.unitPrice,
            }));

            await productService.processSale(itemsToProcess);

            setCart([]);
            Alert.alert("Success", "Sale recorded successfully!");
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to process sale.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

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

  const handleScannedCode = async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTs.current < SCAN_COOLDOWN_MS) return;
    lastScanTs.current = now;

    try {
      setLoading(true);
      const product = await productService.getProductByBarcode(barcode);

      if (mode === "stock") {
        // In stock mode, we always open modal to edit/view details
        if (product) {
          // Existing product
          setCurrentProduct({
            id: product.id,
            barcode: product.barcode,
            title: product.name,
            price: product.sellingPrice,
            qty: product.quantity || 0,
            category: product.category,
            costPrice: product.purchasePrice,
          });
          setIsNewProduct(false);
        } else {
          // New product
          setCurrentProduct({
            barcode: barcode,
            title: "",
            price: 0,
            qty: 1,
            category: "General",
            costPrice: 0,
          });
          setIsNewProduct(true);
        }
        setProductModalVisible(true);
      } else {
        // Sell mode
        if (product) {
          // Check if in stock? (Optional, skipping hard check for now but could warn)
          if ((product.quantity || 0) <= 0) {
            // Alert.alert("Warning", "Item is out of stock!", [{text: "Add anyway"}]);
            // Just adding for now
          }

          setCart((prev) => {
            const found = prev.find((p) => p.productId === product.id);
            if (found) {
              return prev.map((p) =>
                p.productId === product.id ? { ...p, qty: p.qty + 1 } : p,
              );
            }
            return [
              {
                id: Date.now().toString(), // temp id for cart item
                productId: product.id,
                title: product.name,
                unitPrice: product.sellingPrice,
                qty: 1,
                image: null,
              },
              ...prev,
            ];
          });
        } else {
          // Product not found in sell mode -> prompt to create?
          Alert.alert(
            "Product not found",
            "Would you like to add this product to inventory?",
            [
              { text: "No", style: "cancel" },
              {
                text: "Yes",
                onPress: () => {
                  setCurrentProduct({
                    barcode: barcode,
                    title: "",
                    price: 0,
                    qty: 1,
                    category: "General",
                    costPrice: 0,
                  });
                  setIsNewProduct(true);
                  setProductModalVisible(true);
                },
              },
            ],
          );
        }
      }
    } catch (e) {
      console.error("Scan error", e);
      Alert.alert("Error", "Failed to lookup product");
    } finally {
      setLoading(false);
    }
  };

  const handleProductConfirm = async () => {
    if (!currentProduct) return;

    const title = editTitle.trim();
    const price = parseFloat(editPrice) || 0;
    const cost = parseFloat(editCostPrice) || 0;
    const qty = editQty; // Can be 0

    if (!title || price < 0) {
      Alert.alert("Invalid input", "Please check name and price.");
      return;
    }

    try {
      setLoading(true);

      if (isNewProduct) {
        // Create
        const newId = await productService.createProduct({
          name: title,
          barcode: currentProduct.barcode,
          category: editCategory,
          sellingPrice: price,
          purchasePrice: cost,
          quantity: qty,
        });

        // If in sell mode, add to cart immediately after creating
        if (mode === "sell") {
          setCart((prev) => [
            {
              id: Date.now().toString(),
              productId: newId,
              title: title,
              unitPrice: price,
              qty: 1,
              image: null,
            },
            ...prev,
          ]);
        }

        Alert.alert("Success", "Product added to inventory");
      } else {
        // Update
        if (currentProduct.id) {
          await productService.updateProduct(currentProduct.id, {
            name: title,
            sellingPrice: price,
            purchasePrice: cost,
            category: editCategory,
          });

          await productService.updateInventory(currentProduct.id, qty);
          Alert.alert("Success", "Product updated");
        }
      }

      setProductModalVisible(false);
      setCurrentProduct(null);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const onBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    if (!data) return;
    handleScannedCode(data);
  };

  if (permission === null) {
    return <View style={styles.container} />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#000", textAlign: "center", marginTop: 50 }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{ padding: 20, alignItems: "center" }}
        >
          <Text style={{ color: MAIN_GREEN, fontWeight: "bold" }}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ----- Renders ----- */

  const renderCartRow = ({ item }: { item: CartItem }) => (
    <View style={styles.cartRow}>
      <View style={styles.itemLeft}>
        <View style={styles.itemThumb}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          ) : (
            <View style={styles.itemPlaceholder}>
              <MaterialIcons name="image" size={20} color="#9ca3af" />
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
          <MaterialIcons name="remove" size={16} color="#000" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnAdd]}
          onPress={() => changeCartQty(item.id, 1)}
        >
          <MaterialIcons name="add" size={16} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Main Layout: Camera takes full screen, UI overlays it */}
      <View style={styles.container}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing={facing}
            enableTorch={torch}
            onBarcodeScanned={onBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"],
            }}
            ref={cameraRef}
          />

          {/* Top Controls Overlay */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation?.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[
                  styles.modePill,
                  mode === "sell" ? styles.modeActive : null,
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
                  mode === "stock" ? styles.modeActive : null,
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
                onPress={() => setEnterModalVisible(true)}
              >
                <MaterialIcons name="keyboard" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Camera Shortcuts (Flash, Flip) */}
          <View style={styles.cameraShortcuts}>
            <View style={styles.shortcut}>
              <TouchableOpacity
                style={styles.circleBtnSmall}
                onPress={toggleTorch}
              >
                <MaterialIcons
                  name={torch ? "flash-on" : "flash-off"}
                  size={20}
                  color={torch ? "#FFD700" : "#000"}
                />
              </TouchableOpacity>
              <Text style={styles.shortcutText}>Flash</Text>
            </View>
            <View style={styles.shortcut}>
              <TouchableOpacity
                style={styles.circleBtnSmall}
                onPress={toggleCameraType}
              >
                <MaterialIcons name="flip-camera-ios" size={20} color="#000" />
              </TouchableOpacity>
              <Text style={styles.shortcutText}>Flip</Text>
            </View>
          </View>

          {/* Center Scan Area Box */}
          <View style={styles.centerArea} pointerEvents="none">
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
                    width: scanBoxSize,
                    transform: [{ translateY: scanY }],
                  },
                ]}
              />
            </View>
            <View style={styles.alignHint}>
              <MaterialIcons name="qr-code-scanner" size={16} color="#fff" />
              <Text style={styles.alignText}>Align code within frame</Text>
            </View>
          </View>
        </View>

        {/* Bottom Sheet for Cart or Info */}
        <View
          style={[styles.bottomSheet, { maxHeight: BOTTOM_SHEET_MAX_HEIGHT }]}
        >
          <View style={styles.sheetHandle} />

          {/* Header row */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>
                {mode === "sell" ? "Current Cart" : "Scan History"}
              </Text>
              <Text style={styles.sheetSub}>
                {mode === "sell"
                  ? `${cart.length} items added`
                  : "Scan to update inventory"}
              </Text>
            </View>
            {cart.length > 0 && mode === "sell" && (
              <TouchableOpacity onPress={clearAllCart}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {mode === "sell" ? (
            <FlatList
              data={cart}
              keyExtractor={(item) => item.id}
              renderItem={renderCartRow}
              style={styles.cartList}
              contentContainerStyle={{ paddingBottom: 80 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    Scan a barcode to add items
                  </Text>
                </View>
              }
            />
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>
                Ready to scan products for inventory
              </Text>
            </View>
          )}

          {/* Checkout Button (Sell mode only) */}
          {mode === "sell" && cart.length > 0 && (
            <View style={styles.checkoutWrap}>
              <TouchableOpacity
                style={styles.checkoutBtn}
                activeOpacity={0.9}
                onPress={onCheckout}
              >
                <View>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>
                    ₦{totalAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.checkoutRight}>
                  <Text style={styles.checkoutText}>Checkout</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#000" />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={MAIN_GREEN} />
          </View>
        )}
      </View>

      {/* --- Modals --- */}

      {/* Enter Code Manual Modal */}
      <Modal
        visible={enterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEnterModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={modalStyles.modalWrapper}
        >
          <View style={modalStyles.modal}>
            <Text style={modalStyles.modalTitle}>Enter Barcode</Text>
            <TextInput
              style={modalStyles.modalInput}
              placeholder="Type code here..."
              placeholderTextColor="#9ca3af"
              value={enteredCode}
              onChangeText={setEnteredCode}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={modalStyles.modalRow}>
              <TouchableOpacity
                style={modalStyles.modalBtnAlt}
                onPress={() => setEnterModalVisible(false)}
              >
                <Text style={modalStyles.modalBtnTextAlt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.modalBtn}
                onPress={handleEnterCodeConfirm}
              >
                <Text style={modalStyles.modalBtnText}>Scan Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Product Edit/Add Modal */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={productModalStyles.modalWrapper}
        >
          <View style={productModalStyles.modal}>
            <Text style={productModalStyles.modalTitle}>
              {isNewProduct ? "Add New Product" : "Edit Product"}
            </Text>

            {/* Title */}
            <View style={productModalStyles.field}>
              <Text style={productModalStyles.label}>Product Name</Text>
              <View style={productModalStyles.inputWrap}>
                <TextInput
                  style={productModalStyles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="e.g. Indomie Chicken"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>

            {/* Prices Row */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={[productModalStyles.field, { flex: 1 }]}>
                <Text style={productModalStyles.label}>Selling Price</Text>
                <View style={productModalStyles.inputWrap}>
                  <Text style={productModalStyles.prefix}>₦</Text>
                  <TextInput
                    style={[
                      productModalStyles.input,
                      productModalStyles.inputWithPrefix,
                    ]}
                    value={editPrice}
                    onChangeText={setEditPrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#6b7280"
                  />
                </View>
              </View>

              <View style={[productModalStyles.field, { flex: 1 }]}>
                <Text style={productModalStyles.label}>Cost Price</Text>
                <View style={productModalStyles.inputWrap}>
                  <Text style={productModalStyles.prefix}>₦</Text>
                  <TextInput
                    style={[
                      productModalStyles.input,
                      productModalStyles.inputWithPrefix,
                    ]}
                    value={editCostPrice}
                    onChangeText={setEditCostPrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#6b7280"
                  />
                </View>
              </View>
            </View>

            {/* Category */}
            <View style={productModalStyles.field}>
              <Text style={productModalStyles.label}>Category</Text>
              <View style={productModalStyles.inputWrap}>
                <TextInput
                  style={productModalStyles.input}
                  value={editCategory}
                  onChangeText={setEditCategory}
                  placeholder="e.g. Snacks"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>

            {/* Quantity */}
            <View style={productModalStyles.field}>
              <Text style={productModalStyles.label}>Stock Quantity</Text>
              <View style={productModalStyles.qtyWrap}>
                <TouchableOpacity
                  style={productModalStyles.qtyBtn}
                  onPress={() => setEditQty((q) => Math.max(0, q - 1))}
                >
                  <MaterialIcons name="remove" size={24} color="#111" />
                </TouchableOpacity>
                <View style={productModalStyles.qtyDisplay}>
                  <Text style={productModalStyles.qtyText}>{editQty}</Text>
                  <Text style={productModalStyles.qtyUnit}>Units</Text>
                </View>
                <TouchableOpacity
                  style={[
                    productModalStyles.qtyBtn,
                    productModalStyles.qtyBtnAdd,
                  ]}
                  onPress={() => setEditQty((q) => q + 1)}
                >
                  <MaterialIcons name="add" size={24} color="#000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions */}
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
                <Text style={productModalStyles.modalBtnText}>
                  {isNewProduct ? "Create Product" : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: "absolute",
    top: Platform.OS === "android" ? 40 : 60,
    left: 16,
    right: 16,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 4,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  modePill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  modeActive: {
    backgroundColor: MAIN_GREEN,
  },
  modeText: {
    color: "#fff",
    fontWeight: "600",
  },
  modeActiveText: {
    color: "#000",
    fontWeight: "700",
  },
  rightTopActions: {
    flexDirection: "row",
    gap: 10,
  },
  cameraShortcuts: {
    position: "absolute",
    top: Platform.OS === "android" ? 110 : 130,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 40,
  },
  shortcut: {
    alignItems: "center",
  },
  circleBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  shortcutText: {
    color: "#fff",
    fontSize: 12,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },

  centerArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: height * 0.3, // approximate center above bottom sheet
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  scanBox: {
    borderWidth: 0,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    elevation: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  corner: {
    position: "absolute",
    width: 32,
    height: 32,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: MAIN_GREEN,
    borderRadius: 8,
  },
  tl: {
    left: 0,
    top: 0,
    transform: [{ rotate: "0deg" }],
  },
  tr: {
    right: 0,
    top: 0,
    transform: [{ rotate: "90deg" }],
  },
  bl: {
    left: 0,
    bottom: 0,
    transform: [{ rotate: "-90deg" }],
  },
  br: {
    right: 0,
    bottom: 0,
    transform: [{ rotate: "180deg" }],
  },
  scanLine: {
    position: "absolute",
    height: 3,
    backgroundColor: MAIN_GREEN,
    opacity: 0.8,
    shadowColor: MAIN_GREEN,
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  alignHint: {
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alignText: {
    color: "#fff",
    marginLeft: 0,
    fontWeight: "600",
  },

  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
  },
  sheetTitle: {
    color: "#111",
    fontSize: 18,
    fontWeight: "800",
  },
  sheetSub: {
    color: "#6b7280",
    fontSize: 13,
  },
  clearText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  cartList: {
    marginTop: 0,
    maxHeight: 300,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  highlightRow: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  itemPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    color: "#111",
    fontSize: 15,
    fontWeight: "700",
  },
  itemPrice: {
    color: MAIN_GREEN,
    fontWeight: "700",
    marginTop: 2,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  qtyBtnAdd: {
    backgroundColor: MAIN_GREEN,
    borderColor: MAIN_GREEN,
  },
  qtyText: {
    color: "#111",
    minWidth: 16,
    textAlign: "center",
    fontWeight: "700",
  },
  emptyRow: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
  },
  checkoutWrap: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: Platform.OS === "ios" ? 34 : 20,
  },
  checkoutBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#111",
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
  },
  totalLabel: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  totalValue: {
    color: MAIN_GREEN,
    fontSize: 18,
    fontWeight: "800",
  },
  checkoutRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  checkoutText: {
    fontWeight: "700",
    color: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
});

const modalStyles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modal: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
    color: "#111",
  },
  modalInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalBtnAlt: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalBtnTextAlt: {
    color: "#6b7280",
    fontWeight: "600",
  },
});

const productModalStyles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modal: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
    color: "#111",
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: {
    position: "relative",
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 16,
    color: "#111",
    fontSize: 16,
  },
  prefix: {
    position: "absolute",
    left: 16,
    top: 14,
    zIndex: 1,
    color: "#9ca3af",
    fontSize: 16,
  },
  inputWithPrefix: {
    paddingLeft: 32,
  },
  qtyWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 6,
  },
  qtyBtn: {
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 1,
  },
  qtyBtnAdd: {
    backgroundColor: MAIN_GREEN,
  },
  qtyDisplay: {
    alignItems: "center",
  },
  qtyText: {
    color: "#111",
    fontSize: 20,
    fontWeight: "800",
  },
  qtyUnit: {
    color: "#6b7280",
    fontSize: 10,
    marginTop: -2,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalBtnAlt: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnTextAlt: {
    color: "#6b7280",
    fontWeight: "600",
  },
});
