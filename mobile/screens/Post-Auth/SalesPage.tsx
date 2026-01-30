import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  FlatList,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import {
  X,
  Zap,
  ZapOff,
  RefreshCw,
  Keyboard,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  ArrowRight,
  Scan,
  Check,
  Trash2,
  Barcode,
  Sparkles,
  ChevronDown,
  ArrowLeft,
  ImageIcon,
} from "lucide-react-native";
import { productService } from "../../services/productService";
import RNPickerSelect from "react-native-picker-select";
import { Button } from "../../components/ui/button";
import { Text } from "../../components/ui/text";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { t } from "../../utils/localization";

const { width, height } = Dimensions.get("window");
const SCAN_COOLDOWN_MS = 1500;

type CartItem = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
  image?: string | null;
  productId: string;
};

export default function ScanSellScreen({
  navigation,
  route,
}: {
  navigation?: any;
  route?: any;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torch, setTorch] = useState(false);

  const [mode, setMode] = useState<"sell" | "stock">(
    route?.params?.initialMode || "sell",
  );

  useEffect(() => {
    if (route?.params?.initialMode) {
      setMode(route.params.initialMode);
    }
  }, [route?.params?.initialMode]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = Math.min(width * 0.65, 320);
  const lastScanTs = useRef<number>(0);

  const [enterModalVisible, setEnterModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");

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
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [editQty, setEditQty] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [isRecommendingCategory, setIsRecommendingCategory] = useState(false);

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
          toValue: -scanBoxSize / 2 + 10,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: scanBoxSize / 2 - 10,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scanY, scanBoxSize]);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await productService.getCategories();
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0 && editCategory === "General") {
          setEditCategory(fetchedCategories[0]);
        }
      } catch (error) {
        setCategories(["General", "Snacks", "Beverages"]);
      }
    };
    fetchCategories();
  }, []);

  const handleRecommendCategory = async () => {
    if (!editTitle.trim()) return;
    setIsRecommendingCategory(true);
    try {
      const { category: recommendedCategory } =
        await productService.recommendCategory(editTitle.trim());
      if (recommendedCategory && categories.includes(recommendedCategory)) {
        setEditCategory(recommendedCategory);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRecommendingCategory(false);
    }
  };

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
        if (product) {
          setCart((prev) => {
            const found = prev.find((p) => p.productId === product.id);
            if (found) {
              return prev.map((p) =>
                p.productId === product.id ? { ...p, qty: p.qty + 1 } : p,
              );
            }
            return [
              ...prev,
              {
                id: Date.now().toString(),
                productId: product.id,
                title: product.name,
                unitPrice: product.sellingPrice,
                qty: 1,
                image: null,
              },
            ];
          });
        } else {
          Alert.alert(
            "Product not found",
            `Code: ${barcode}. Add to inventory?`,
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProductConfirm = async () => {
    if (!currentProduct) return;

    const title = editTitle.trim();
    const price = parseFloat(editPrice) || 0;
    const cost = parseFloat(editCostPrice) || 0;
    const qty = editQty;

    if (!title) {
      Alert.alert("Error", "Product name is required.");
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
            ...prev,
            {
              id: Date.now().toString(),
              productId: newId,
              title: title,
              unitPrice: price,
              qty: 1,
              image: null,
            },
          ]);
        }
      } else if (currentProduct.id) {
        await productService.updateProduct(currentProduct.id, {
          name: title,
          sellingPrice: price,
          purchasePrice: cost,
          category: editCategory,
          quantity: qty,
        });

        if (mode === "sell") {
          setCart((prev) =>
            prev.map((item) =>
              item.productId === currentProduct.id
                ? { ...item, title: title, unitPrice: price }
                : item,
            ),
          );
        }
      }
      setProductModalVisible(false);
    } catch (e) {
      Alert.alert("Error", "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (result.data) handleScannedCode(result.data);
  };

  if (permission && !permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-5">
        <Package size={60} className="text-muted-foreground mb-4" />
        <Text variant="h2" className="text-center mb-2">
          Camera Access Needed
        </Text>
        <Text variant="p" className="text-center text-muted-foreground mb-8">
          We need your permission to show the camera for scanning barcodes.
        </Text>
        <Button
          onPress={requestPermission}
          className="w-full h-14 rounded-full"
        >
          <Text className="font-bold text-lg">Grant Permission</Text>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Camera */}
      <View className="flex-1 bg-black overflow-hidden">
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            className="flex-1"
            facing={facing}
            enableTorch={torch}
            onBarcodeScanned={onBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "code128",
                "code39",
                "qr",
              ],
            }}
          />
        )}

        {/* Top Controls Overlay */}
        <SafeAreaView className="absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-5 pt-4">
          <Button
            variant="secondary"
            size="icon"
            className="w-11 h-11 rounded-full bg-black/40 border border-white/20"
            onPress={() => navigation?.goBack()}
          >
            <ArrowLeft size={22} color="white" />
          </Button>

          <View className="flex-row bg-black/40 p-1 rounded-full border border-white/20">
            <Pressable
              onPress={() => setMode("sell")}
              className={cn(
                "px-5 py-2 rounded-full",
                mode === "sell" ? "bg-primary" : "bg-transparent",
              )}
            >
              <Text
                className={cn(
                  "font-black text-xs uppercase",
                  mode === "sell" ? "text-primary-foreground" : "text-white",
                )}
              >
                {t("sell")}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("stock")}
              className={cn(
                "px-5 py-2 rounded-full",
                mode === "stock" ? "bg-primary" : "bg-transparent",
              )}
            >
              <Text
                className={cn(
                  "font-black text-xs uppercase",
                  mode === "stock" ? "text-primary-foreground" : "text-white",
                )}
              >
                {t("inventory")}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="w-11 h-11 rounded-full bg-black/40 border border-white/20"
              onPress={toggleTorch}
            >
              {torch ? (
                <Zap size={20} color="#36e27b" />
              ) : (
                <ZapOff size={20} color="white" />
              )}
            </Button>
          </View>
        </SafeAreaView>

        {/* Center Scan Area */}
        <View className="absolute inset-0 items-center justify-center z-0 pointer-events-none">
          <View
            style={{ width: scanBoxSize, height: scanBoxSize }}
            className="border-2 border-white/30 rounded-[32px] overflow-hidden bg-white/5"
          >
            {/* Corner Accents */}
            <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-2xl" />
            <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-2xl" />
            <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-2xl" />
            <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-2xl" />

            {/* Scan Line Animation */}
            <Animated.View
              style={{
                transform: [{ translateY: scanY }],
                width: "100%",
              }}
              className="h-1 bg-primary opacity-80 shadow-lg shadow-primary"
            />
          </View>

          <View className="mt-8 flex-row items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-white/10">
            <Scan size={16} className="text-primary" />
            <Text className="text-white text-xs font-bold uppercase tracking-widest">
              Align barcode to scan
            </Text>
          </View>
        </View>

        {/* Side Shortcuts Overlay */}
        <View className="absolute top-1/2 right-4 -translate-y-1/2 z-10 gap-6">
          <Pressable onPress={toggleCameraType} className="items-center">
            <View className="w-12 h-12 rounded-full bg-black/40 border border-white/10 items-center justify-center mb-1">
              <RefreshCw size={22} color="white" />
            </View>
            <Text className="text-white text-[10px] font-black uppercase shadow-black">
              Flip
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setEnterModalVisible(true)}
            className="items-center"
          >
            <View className="w-12 h-12 rounded-full bg-black/40 border border-white/10 items-center justify-center mb-1">
              <Keyboard size={22} color="white" />
            </View>
            <Text className="text-white text-[10px] font-black uppercase shadow-black">
              Manual
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom Session Panel */}
      <View className="absolute bottom-0 left-0 right-0 bg-background rounded-t-[40px] shadow-2xl shadow-black p-6 pb-10">
        <View className="w-12 h-1.5 bg-muted rounded-full self-center mb-5" />

        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text variant="h3" className="font-black text-foreground">
              {mode === "sell" ? t("cart") : t("scannedItems")}
            </Text>
            {mode === "sell" && (
              <Text variant="muted" className="text-xs font-bold uppercase">
                {cart.length} {t("items")}
              </Text>
            )}
          </View>
          {cart.length > 0 && mode === "sell" && (
            <Pressable onPress={clearAllCart}>
              <Text className="text-destructive font-bold text-xs uppercase tracking-tighter">
                Clear All
              </Text>
            </Pressable>
          )}
        </View>

        {/* Cart List */}
        <View className="max-h-60 mb-4">
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between p-3 bg-secondary/50 rounded-2xl border border-border/50 mb-3">
                <View className="flex-row items-center flex-1 gap-3">
                  <View className="w-10 h-10 rounded-xl bg-background items-center justify-center">
                    <ImageIcon size={18} className="text-muted-foreground/30" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-black text-foreground"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-primary font-bold text-xs mt-0.5">
                      ₦{item.unitPrice.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-3 ml-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-lg border-border"
                    onPress={() => changeCartQty(item.id, -1)}
                  >
                    <Minus size={14} color="#666" />
                  </Button>
                  <Text className="min-w-[20px] text-center font-black text-foreground">
                    {item.qty}
                  </Text>
                  <Button
                    variant="default"
                    size="icon"
                    className="w-8 h-8 rounded-lg"
                    onPress={() => changeCartQty(item.id, 1)}
                  >
                    <Plus size={14} color="#000" />
                  </Button>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="py-6 items-center">
                <ShoppingCart
                  size={32}
                  className="text-muted-foreground/20 mb-2"
                />
                <Text variant="muted" className="font-bold italic">
                  No items scanned yet
                </Text>
              </View>
            }
          />
        </View>

        {/* Checkout / Finish Bar */}
        {mode === "sell" ? (
          <Button
            className="h-16 rounded-3xl flex-row items-center justify-between px-6 bg-primary shadow-xl shadow-primary/30"
            onPress={onCheckout}
            disabled={cart.length === 0}
          >
            <View>
              <Text className="text-[10px] font-black text-primary-foreground/70 uppercase tracking-widest">
                Total Amount
              </Text>
              <Text className="text-xl font-black text-primary-foreground">
                ₦{totalAmount.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 bg-black/10 px-4 py-2 rounded-2xl">
              <Text className="font-black text-primary-foreground uppercase tracking-tight">
                Checkout
              </Text>
              <ArrowRight size={20} color="#000" strokeWidth={3} />
            </View>
          </Button>
        ) : (
          <Button
            className="h-16 rounded-3xl bg-secondary border border-border"
            onPress={() => navigation?.goBack()}
          >
            <Text className="font-black text-foreground uppercase tracking-widest">
              Finish Inventory
            </Text>
          </Button>
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={enterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEnterModalVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-center items-center p-6">
          <Card className="w-full p-6 bg-background rounded-[32px] border border-border shadow-2xl">
            <Text variant="h3" className="font-black text-foreground mb-6">
              Enter Barcode
            </Text>
            <Input
              placeholder="e.g. 12345678"
              className="h-14 rounded-2xl bg-secondary border-border mb-6 text-lg font-bold"
              value={enteredCode}
              onChangeText={setEnteredCode}
              keyboardType="number-pad"
              autoFocus
            />
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-2xl"
                onPress={() => setEnterModalVisible(false)}
              >
                <Text className="font-bold">Cancel</Text>
              </Button>
              <Button
                className="flex-1 h-12 rounded-2xl"
                onPress={handleEnterCodeConfirm}
              >
                <Text className="font-black uppercase text-xs">Confirm</Text>
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Product Edit/Add Modal */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-black/60 justify-center items-center p-6"
        >
          <Card className="w-full p-6 bg-background rounded-[32px] border border-border shadow-2xl max-h-[90%]">
            <Text variant="h3" className="font-black text-foreground mb-2">
              {isNewProduct ? "New Product" : "Edit Product"}
            </Text>
            <View className="flex-row items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-xl self-start mb-6">
              <Barcode size={14} className="text-primary" />
              <Text className="text-[11px] font-black text-primary uppercase">
                {currentProduct?.barcode}
              </Text>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => "form"}
              showsVerticalScrollIndicator={false}
              renderItem={() => (
                <View className="gap-5 pb-4">
                  {/* Title Field */}
                  <View>
                    <View className="flex-row justify-between items-center mb-2 px-1">
                      <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Product Name
                      </Text>
                      {isNewProduct && (
                        <Pressable
                          className="flex-row items-center gap-1"
                          onPress={handleRecommendCategory}
                        >
                          <Sparkles size={12} className="text-primary" />
                          <Text className="text-[10px] font-bold text-primary">
                            Suggest Category
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    <Input
                      className="h-14 rounded-2xl bg-secondary border-border text-base font-bold"
                      placeholder="e.g. Coca-Cola 50cl"
                      value={editTitle}
                      onChangeText={setEditTitle}
                    />
                  </View>

                  {/* Price Row */}
                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">
                        Selling Price
                      </Text>
                      <View className="relative">
                        <Text className="absolute left-4 top-[17px] z-10 text-base font-bold text-foreground">
                          ₦
                        </Text>
                        <Input
                          className="h-14 rounded-2xl bg-secondary border-border pl-8 text-base font-bold"
                          keyboardType="numeric"
                          value={editPrice}
                          onChangeText={setEditPrice}
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">
                        Cost Price
                      </Text>
                      <View className="relative">
                        <Text className="absolute left-4 top-[17px] z-10 text-base font-bold text-muted-foreground">
                          ₦
                        </Text>
                        <Input
                          className="h-14 rounded-2xl bg-secondary border-border pl-8 text-base font-bold text-muted-foreground"
                          keyboardType="numeric"
                          value={editCostPrice}
                          onChangeText={setEditCostPrice}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Category Selection */}
                  <View>
                    <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">
                      Category
                    </Text>
                    <View className="h-14 rounded-2xl bg-secondary border border-border justify-center px-4 overflow-hidden relative">
                      <RNPickerSelect
                        onValueChange={(v) => setEditCategory(v)}
                        items={categories.map((c) => ({ label: c, value: c }))}
                        value={editCategory}
                        style={{
                          inputIOS: {
                            color: "white",
                            fontSize: 16,
                            fontWeight: "700",
                          },
                          inputAndroid: {
                            color: "white",
                            fontSize: 16,
                            fontWeight: "700",
                          },
                          placeholder: { color: "#666" },
                        }}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => (
                          <ChevronDown
                            size={18}
                            className="text-muted-foreground absolute right-4 top-1"
                          />
                        )}
                      />
                    </View>
                  </View>

                  {/* Quantity Stepper */}
                  <View>
                    <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">
                      Current Stock
                    </Text>
                    <View className="flex-row items-center justify-between bg-secondary p-3 rounded-2xl border border-border">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-12 h-12 rounded-xl bg-background border border-border shadow-sm"
                        onPress={() => setEditQty((q) => Math.max(0, q - 1))}
                      >
                        <Minus size={20} color="white" />
                      </Button>
                      <View className="items-center">
                        <Text className="text-2xl font-black text-foreground">
                          {editQty}
                        </Text>
                        <Text className="text-[9px] font-bold text-muted-foreground uppercase">
                          Units in store
                        </Text>
                      </View>
                      <Button
                        className="w-12 h-12 rounded-xl bg-primary shadow-sm"
                        size="icon"
                        onPress={() => setEditQty((q) => q + 1)}
                      >
                        <Plus size={20} color="#000" />
                      </Button>
                    </View>
                  </View>
                </View>
              )}
            />

            <View className="flex-row gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl"
                onPress={() => setProductModalVisible(false)}
              >
                <Text className="font-bold">Cancel</Text>
              </Button>
              <Button
                className="flex-2 h-14 rounded-2xl bg-primary"
                onPress={handleProductConfirm}
              >
                <Text className="font-black uppercase tracking-tight text-primary-foreground">
                  {isNewProduct ? "Add Product" : "Save Changes"}
                </Text>
              </Button>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>

      {/* Loading Overlay */}
      {loading && (
        <View className="absolute inset-0 bg-black/40 justify-center items-center z-[100]">
          <View className="bg-background p-6 rounded-3xl border border-border items-center">
            <ActivityIndicator size="large" color="#36e27b" />
            <Text className="mt-4 font-black text-xs uppercase tracking-widest">
              Processing...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
