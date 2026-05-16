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
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { productService } from "../../services/productService";
import RNPickerSelect from "react-native-picker-select";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Set your Anthropic API key here, or pull from your environment/config file.
// e.g. import { ANTHROPIC_API_KEY } from "@env"; (via react-native-dotenv)
const ANTHROPIC_API_KEY = "sk-ant-api03-your-key-here";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
// ─────────────────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get("window");
const MAIN_GREEN = "#dd4f05";

type CartItem = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
  image?: string | null;
  productId: string;
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

  /* AI scan loading state (separate so we can show a distinct message) */
  const [aiLoading, setAiLoading] = useState(false);

  /* scan animation */
  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = Math.min(width * 0.62, 320);

  /* scan cooldown */
  const lastScanTs = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 1500;

  /* enter-code modal */
  const [enterModalVisible, setEnterModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");

  /* product modal */
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<{
    id?: string;
    barcode: string;
    title: string;
    price: number;
    qty: number;
    category: string;
    costPrice: number;
  } | null>(null);

  const [isNewProduct, setIsNewProduct] = useState(false);
  const [isAiIdentified, setIsAiIdentified] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editQty, setEditQty] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [isRecommendingCategory, setIsRecommendingCategory] = useState(false);

  /* bottom sheet height */
  const BOTTOM_SHEET_MAX_HEIGHT = Math.min(height * 0.3, 520);

  useEffect(() => {
    if (permission === null) return;
    if (!permission.granted) requestPermission();
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
      setEditPrice(
        currentProduct.price > 0 ? currentProduct.price.toString() : "",
      );
      setEditCostPrice(
        currentProduct.costPrice > 0 ? currentProduct.costPrice.toString() : "",
      );
      setEditCategory(currentProduct.category);
      setEditQty(currentProduct.qty);
    }
  }, [productModalVisible, currentProduct]);

  const totalAmount = useMemo(
    () => cart.reduce((s, it) => s + it.qty * it.unitPrice, 0),
    [cart],
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetched = await productService.getCategories();
        setCategories(fetched);
        if (fetched.length > 0 && editCategory === "General") {
          setEditCategory(fetched[0]);
        }
      } catch {
        setCategories([
          "General",
          "Snacks",
          "Beverages",
          "Household",
          "Personal Care",
          "Dairy",
          "Condiments",
        ]);
      }
    };
    fetchCategories();
  }, []);

  const handleRecommendCategory = async () => {
    if (!editTitle.trim()) return;
    setIsRecommendingCategory(true);
    try {
      const { category: rec } = await productService.recommendCategory(
        editTitle.trim(),
      );
      if (rec && categories.includes(rec)) setEditCategory(rec);
    } catch {
      // silent
    } finally {
      setIsRecommendingCategory(false);
    }
  };

  /* ----- Cart Actions ----- */
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
            await productService.processSale(
              cart.map((item) => ({
                productId: item.productId,
                quantity: item.qty,
                price: item.unitPrice,
              })),
            );
            setCart([]);
            Alert.alert("Success", "Sale recorded successfully!");
          } catch {
            Alert.alert("Error", "Failed to process sale.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  /* ----- AI Scanner ----- */
  const handleAIScan = async () => {
    if (!cameraRef.current) return;

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "YOUR_API_KEY_HERE") {
      Alert.alert(
        "API Key Missing",
        "Please set your Anthropic API key in ScanSellScreen.tsx (ANTHROPIC_API_KEY constant).",
      );
      return;
    }

    try {
      setAiLoading(true);

      // Capture photo
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
        skipProcessing: true,
      });

      if (!photo?.base64) {
        Alert.alert("Error", "Failed to capture photo. Please try again.");
        return;
      }

      // Send to Claude for identification
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: photo.base64,
                  },
                },
                {
                  type: "text",
                  text: `You are a product identification assistant for a Nigerian retail store.
Examine this product image and identify it.

Respond with ONLY a valid JSON object — no markdown, no backticks, no explanation:
{
  "name": "full product name including brand and variant if visible",
  "category": "one of: Beverages, Snacks, Household, Personal Care, Dairy, Condiments, General",
  "estimatedSellingPrice": <estimated retail price in Nigerian Naira as a number>,
  "estimatedCostPrice": <estimated wholesale/cost price in Nigerian Naira as a number>,
  "confidence": "high" | "medium" | "low"
}

If you cannot identify the product at all, return:
{"name":"","category":"General","estimatedSellingPrice":0,"estimatedCostPrice":0,"confidence":"low"}`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Claude API error:", errText);
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      const rawText =
        data.content?.find((b: any) => b.type === "text")?.text ?? "";

      let parsed: {
        name: string;
        category: string;
        estimatedSellingPrice: number;
        estimatedCostPrice: number;
        confidence: string;
      };

      try {
        parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());
      } catch {
        throw new Error("Could not parse AI response");
      }

      const confidence = parsed.confidence ?? "low";
      const identified = !!parsed.name;

      // Open product modal pre-filled with AI data
      setCurrentProduct({
        barcode: `AI-${Date.now()}`,
        title: parsed.name ?? "",
        price: parsed.estimatedSellingPrice ?? 0,
        qty: 1,
        category: parsed.category ?? "General",
        costPrice: parsed.estimatedCostPrice ?? 0,
      });
      setIsNewProduct(true);
      setIsAiIdentified(true);
      setProductModalVisible(true);

      if (!identified || confidence === "low") {
        Alert.alert(
          "Low confidence",
          "AI couldn't identify this product clearly. Please fill in the details manually.",
          [{ text: "OK" }],
        );
      }
    } catch (e: any) {
      console.error("AI scan error:", e);
      // Still open the modal so user can fill manually
      setCurrentProduct({
        barcode: `AI-${Date.now()}`,
        title: "",
        price: 0,
        qty: 1,
        category: "General",
        costPrice: 0,
      });
      setIsNewProduct(true);
      setIsAiIdentified(false);
      setProductModalVisible(true);
      Alert.alert(
        "Identification failed",
        "Could not identify the product automatically. Please enter the details manually.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  /* ----- Barcode Scanner ----- */
  const handleScannedCode = async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTs.current < SCAN_COOLDOWN_MS) return;
    lastScanTs.current = now;

    try {
      setLoading(true);
      const product = await productService.getProductByBarcode(barcode);

      if (mode === "stock") {
        if (product) {
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
          setCurrentProduct({
            barcode,
            title: "",
            price: 0,
            qty: 1,
            category: "General",
            costPrice: 0,
          });
          setIsNewProduct(true);
        }
        setIsAiIdentified(false);
        setProductModalVisible(true);
      } else {
        if (product) {
          setCart((prev) => {
            const found = prev.find((p) => p.productId === product.id);
            if (found) {
              return prev.map((p) =>
                p.productId === product.id ? { ...p, qty: p.qty + 1 } : p,
              );
            }
            return [
              {
                id: Date.now().toString(),
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
          Alert.alert(
            "Product not found",
            "Would you like to add this product to inventory?",
            [
              { text: "No", style: "cancel" },
              {
                text: "Yes",
                onPress: () => {
                  setCurrentProduct({
                    barcode,
                    title: "",
                    price: 0,
                    qty: 1,
                    category: "General",
                    costPrice: 0,
                  });
                  setIsNewProduct(true);
                  setIsAiIdentified(false);
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

  const handleEnterCodeConfirm = () => {
    if (!enteredCode.trim()) {
      Alert.alert("Enter code", "Please enter a code.");
      return;
    }
    handleScannedCode(enteredCode.trim());
    setEnteredCode("");
    setEnterModalVisible(false);
  };

  /* ----- Save Product ----- */
  const handleProductConfirm = async () => {
    if (!currentProduct) return;

    const title = editTitle.trim();
    const price = parseFloat(editPrice) || 0;
    const cost = parseFloat(editCostPrice) || 0;
    const qty = editQty;

    if (!title) {
      Alert.alert("Missing name", "Please enter a product name.");
      return;
    }
    if (price <= 0) {
      Alert.alert("Invalid price", "Please enter a valid selling price.");
      return;
    }

    try {
      setLoading(true);

      if (isNewProduct) {
        const newId = await productService.createProduct({
          name: title,
          barcode: currentProduct.barcode,
          category: editCategory,
          sellingPrice: price,
          purchasePrice: cost,
          quantity: qty,
        });

        if (mode === "sell") {
          setCart((prev) => [
            {
              id: Date.now().toString(),
              productId: newId,
              title,
              unitPrice: price,
              qty: 1,
              image: null,
            },
            ...prev,
          ]);
        }

        Alert.alert("Success", "Product added to inventory");
      } else {
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
      setIsAiIdentified(false);
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

  const toggleTorch = () => setTorch((prev) => !prev);
  const toggleCameraType = () =>
    setFacing((t) => (t === "back" ? "front" : "back"));

  /* ----- Permission States ----- */
  if (permission === null) return <View style={styles.container} />;
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
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
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

          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.circleBtn}
              onPress={() => navigation?.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modePill, mode === "sell" && styles.modeActive]}
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
                style={[styles.modePill, mode === "stock" && styles.modeActive]}
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
              {/* AI Scan Button */}
              <TouchableOpacity
                style={[styles.circleBtn, styles.aiBtnCircle]}
                onPress={handleAIScan}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name="auto-awesome" size={20} color="#fff" />
                )}
              </TouchableOpacity>

              {/* Manual entry */}
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => setEnterModalVisible(true)}
              >
                <MaterialIcons name="keyboard" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Flash / Flip shortcuts */}
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

          {/* Center Scan Box */}
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
                  { width: scanBoxSize, transform: [{ translateY: scanY }] },
                ]}
              />
            </View>
            <View style={styles.alignHint}>
              <MaterialIcons name="qr-code-scanner" size={16} color="#fff" />
              <Text style={styles.alignText}>Align code within frame</Text>
            </View>
            {/* AI hint below scan box */}
            <View style={styles.aiHint}>
              <MaterialIcons name="auto-awesome" size={13} color="#fff" />
              <Text style={styles.aiHintText}>
                No barcode? Tap ✨ to scan with AI
              </Text>
            </View>
          </View>

          {/* AI Loading overlay on camera */}
          {aiLoading && (
            <View style={styles.aiLoadingOverlay}>
              <View style={styles.aiLoadingCard}>
                <ActivityIndicator size="large" color={MAIN_GREEN} />
                <Text style={styles.aiLoadingText}>Identifying product…</Text>
                <Text style={styles.aiLoadingSubtext}>
                  Claude is analysing the image
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Sheet */}
        <View
          style={[styles.bottomSheet, { maxHeight: BOTTOM_SHEET_MAX_HEIGHT }]}
        >
          <View style={styles.sheetHandle} />

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

      {/* ─── MODALS ─── */}

      {/* Enter Code Modal */}
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

      {/* Product Edit / Add Modal */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setProductModalVisible(false);
          setIsAiIdentified(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={productModalStyles.modalWrapper}
        >
          <View style={productModalStyles.modal}>
            {/* Header */}
            <View style={productModalStyles.modalHeader}>
              <Text style={productModalStyles.modalTitle}>
                {isNewProduct ? "Add New Product" : "Edit Product"}
              </Text>
              {isAiIdentified && (
                <View style={productModalStyles.aiBadge}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={12}
                    color={MAIN_GREEN}
                  />
                  <Text style={productModalStyles.aiBadgeText}>
                    AI identified
                  </Text>
                </View>
              )}
            </View>

            {isAiIdentified && (
              <Text style={productModalStyles.aiNote}>
                Review and adjust the details below before saving.
              </Text>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Product Name */}
              <View style={productModalStyles.field}>
                <Text style={productModalStyles.label}>Product Name *</Text>
                <View style={productModalStyles.inputWrap}>
                  <TextInput
                    style={productModalStyles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    onBlur={handleRecommendCategory}
                    placeholder="e.g. Indomie Chicken Flavour"
                    placeholderTextColor="#6b7280"
                  />
                </View>
              </View>

              {/* Prices Row */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={[productModalStyles.field, { flex: 1 }]}>
                  <Text style={productModalStyles.label}>Selling Price *</Text>
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
                  {isAiIdentified && parseFloat(editPrice) > 0 && (
                    <Text style={productModalStyles.aiEstimate}>
                      AI estimate
                    </Text>
                  )}
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
                  {isAiIdentified && parseFloat(editCostPrice) > 0 && (
                    <Text style={productModalStyles.aiEstimate}>
                      AI estimate
                    </Text>
                  )}
                </View>
              </View>

              {/* Profit margin display */}
              {parseFloat(editPrice) > 0 && parseFloat(editCostPrice) > 0 && (
                <View style={productModalStyles.marginRow}>
                  <MaterialIcons name="trending-up" size={14} color="#10b981" />
                  <Text style={productModalStyles.marginText}>
                    Margin: ₦
                    {(
                      parseFloat(editPrice) - parseFloat(editCostPrice)
                    ).toLocaleString()}{" "}
                    (
                    {Math.round(
                      ((parseFloat(editPrice) - parseFloat(editCostPrice)) /
                        parseFloat(editPrice)) *
                        100,
                    )}
                    %)
                  </Text>
                </View>
              )}

              {/* Category */}
              <View style={productModalStyles.field}>
                <Text style={productModalStyles.label}>Category</Text>
                {isRecommendingCategory ? (
                  <View
                    style={[
                      productModalStyles.input,
                      productModalStyles.loadingInput,
                    ]}
                  >
                    <ActivityIndicator color={MAIN_GREEN} size="small" />
                    <Text style={{ color: "#6b7280", marginLeft: 8 }}>
                      Suggesting…
                    </Text>
                  </View>
                ) : (
                  <RNPickerSelect
                    onValueChange={(value) => value && setEditCategory(value)}
                    items={categories.map((cat) => ({
                      label: cat,
                      value: cat,
                    }))}
                    style={{
                      inputIOS: productModalStyles.input,
                      inputAndroid: productModalStyles.input,
                      placeholder: { color: "#6b7280" },
                    }}
                    value={editCategory}
                    placeholder={{
                      label: "Select a category...",
                      value: null,
                      color: "#6b7280",
                    }}
                  />
                )}
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
            </ScrollView>

            {/* Actions */}
            <View style={productModalStyles.modalRow}>
              <TouchableOpacity
                style={productModalStyles.modalBtnAlt}
                onPress={() => {
                  setProductModalVisible(false);
                  setIsAiIdentified(false);
                }}
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

/* ─── STYLES ─── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1 },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },

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
  aiBtnCircle: {
    backgroundColor: MAIN_GREEN,
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
  modeActive: { backgroundColor: MAIN_GREEN },
  modeText: { color: "#fff", fontWeight: "600" },
  modeActiveText: { color: "#000", fontWeight: "700" },
  rightTopActions: { flexDirection: "row", gap: 10 },

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
  shortcut: { alignItems: "center" },
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
    bottom: height * 0.3,
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
  tl: { left: 0, top: 0 },
  tr: { right: 0, top: 0, transform: [{ rotate: "90deg" }] },
  bl: { left: 0, bottom: 0, transform: [{ rotate: "-90deg" }] },
  br: { right: 0, bottom: 0, transform: [{ rotate: "180deg" }] },
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
  alignText: { color: "#fff", fontWeight: "600" },
  aiHint: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.75,
  },
  aiHintText: {
    color: "#fff",
    fontSize: 12,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },

  aiLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  aiLoadingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: "center",
    gap: 12,
  },
  aiLoadingText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginTop: 8,
  },
  aiLoadingSubtext: {
    fontSize: 13,
    color: "#6b7280",
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
  sheetTitle: { color: "#111", fontSize: 18, fontWeight: "800" },
  sheetSub: { color: "#6b7280", fontSize: 13 },
  clearText: { color: "#ef4444", fontWeight: "600" },
  cartList: { marginTop: 0, maxHeight: 300 },

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
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e5e7eb",
  },
  itemImage: { width: "100%", height: "100%", resizeMode: "cover" },
  itemPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  itemTitle: { color: "#111", fontSize: 15, fontWeight: "700", maxWidth: 140 },
  itemPrice: { color: MAIN_GREEN, fontWeight: "700", marginTop: 2 },

  qtyWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  qtyBtnAdd: { backgroundColor: MAIN_GREEN, borderColor: MAIN_GREEN },
  qtyText: {
    color: "#111",
    minWidth: 16,
    textAlign: "center",
    fontWeight: "700",
  },

  emptyRow: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: "#9ca3af" },

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
  totalValue: { color: MAIN_GREEN, fontSize: 18, fontWeight: "800" },
  checkoutRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  checkoutText: { fontWeight: "700", color: "#000" },

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
  modalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  modalBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
  modalBtnAlt: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  modalBtnTextAlt: { color: "#6b7280", fontWeight: "600" },
});

const productModalStyles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modal: {
    width: "92%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#111" },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff2ec",
    borderWidth: 1,
    borderColor: "#fbd5c0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aiBadgeText: { fontSize: 11, fontWeight: "700", color: MAIN_GREEN },
  aiNote: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 16,
    fontStyle: "italic",
  },
  aiEstimate: {
    fontSize: 10,
    color: MAIN_GREEN,
    fontWeight: "600",
    marginTop: 3,
    marginLeft: 4,
  },
  marginRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  marginText: { fontSize: 13, color: "#10b981", fontWeight: "600" },

  field: { marginBottom: 16 },
  label: {
    color: "#4b5563",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: { position: "relative" },
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
  loadingInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  prefix: {
    position: "absolute",
    left: 16,
    top: 14,
    zIndex: 1,
    color: "#9ca3af",
    fontSize: 16,
  },
  inputWithPrefix: { paddingLeft: 32 },

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
  qtyBtnAdd: { backgroundColor: MAIN_GREEN },
  qtyDisplay: { alignItems: "center" },
  qtyText: { color: "#111", fontSize: 20, fontWeight: "800" },
  qtyUnit: { color: "#6b7280", fontSize: 10, marginTop: -2 },

  modalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  modalBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
  modalBtnAlt: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14 },
  modalBtnTextAlt: { color: "#6b7280", fontWeight: "600" },
});
