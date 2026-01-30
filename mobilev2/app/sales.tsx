import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import {
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
  Barcode,
  Sparkles,
  ChevronDown,
  ArrowLeft,
  ImageIcon,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { productService } from '@/services/productService';
import RNPickerSelect from 'react-native-picker-select';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { t } from '@/utils/localization';

const { width } = Dimensions.get('window');
const SCAN_COOLDOWN_MS = 1500;

type CartItem = {
  id: string;
  title: string;
  unitPrice: number;
  qty: number;
  image?: string | null;
  productId: string;
};

export default function ScanSellScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialMode: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState(false);

  const [mode, setMode] = useState<'sell' | 'stock'>((params.initialMode as any) || 'sell');

  useEffect(() => {
    if (params.initialMode) {
      setMode(params.initialMode as any);
    }
  }, [params.initialMode]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = Math.min(width * 0.65, 320);
  const lastScanTs = useRef<number>(0);

  const [enterModalVisible, setEnterModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');

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
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCostPrice, setEditCostPrice] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editQty, setEditQty] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [isRecommendingCategory, setIsRecommendingCategory] = useState(false);
  const [isScannerPaused, setIsScannerPaused] = useState(false);

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
      ])
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

  const totalAmount = useMemo(() => cart.reduce((s, it) => s + it.qty * it.unitPrice, 0), [cart]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await productService.getCategories();
        setCategories(fetchedCategories);
        if (fetchedCategories.length > 0 && editCategory === 'General') {
          setEditCategory(fetchedCategories[0]);
        }
      } catch (error) {
        setCategories(['General', 'Snacks', 'Beverages']);
      }
    };
    fetchCategories();
  }, [editCategory]);

  const handleRecommendCategory = async () => {
    if (!editTitle.trim()) return;
    setIsRecommendingCategory(true);
    try {
      const { category: recommendedCategory } = await productService.recommendCategory(
        editTitle.trim()
      );
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
        .map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
        .filter((it) => it.qty > 0)
    );

  const clearAllCart = () => {
    setIsScannerPaused(true);
    Alert.alert(
      'Clear cart',
      'Remove all items from cart?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsScannerPaused(false),
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCart([]);
            setIsScannerPaused(false);
          },
        },
      ],
      { onDismiss: () => setIsScannerPaused(false) }
    );
  };

  const onCheckout = async () => {
    if (cart.length === 0) return;

    setIsScannerPaused(true);
    Alert.alert(
      'Checkout',
      `Total: ₦${totalAmount.toLocaleString()}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsScannerPaused(false),
        },
        {
          text: 'Pay',
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
              Alert.alert(
                'Success',
                'Sale recorded successfully!',
                [{ text: 'OK', onPress: () => setIsScannerPaused(false) }],
                { onDismiss: () => setIsScannerPaused(false) }
              );
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to process sale.',
                [{ text: 'OK', onPress: () => setIsScannerPaused(false) }],
                { onDismiss: () => setIsScannerPaused(false) }
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { onDismiss: () => setIsScannerPaused(false) }
    );
  };

  const toggleTorch = () => setTorch((prev) => !prev);
  const toggleCameraType = () => setFacing((t) => (t === 'back' ? 'front' : 'back'));

  const handleEnterCodeConfirm = () => {
    if (!enteredCode.trim()) {
      Alert.alert('Enter code', 'Please enter a code.');
      return;
    }
    handleScannedCode(enteredCode.trim());
    setEnteredCode('');
    setEnterModalVisible(false);
  };

  const handleScannedCode = async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTs.current < SCAN_COOLDOWN_MS) return;
    lastScanTs.current = now;

    try {
      setLoading(true);
      const product = await productService.getProductByBarcode(barcode);

      if (mode === 'stock') {
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
            title: '',
            price: 0,
            qty: 1,
            category: 'General',
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
              return prev.map((p) => (p.productId === product.id ? { ...p, qty: p.qty + 1 } : p));
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
          setIsScannerPaused(true);
          Alert.alert(
            'Product not found',
            `Code: ${barcode}. Add to inventory?`,
            [
              {
                text: 'No',
                style: 'cancel',
                onPress: () => setIsScannerPaused(false),
              },
              {
                text: 'Yes',
                onPress: () => {
                  setCurrentProduct({
                    barcode: barcode,
                    title: '',
                    price: 0,
                    qty: 1,
                    category: 'General',
                    costPrice: 0,
                  });
                  setIsNewProduct(true);
                  setProductModalVisible(true);
                  setIsScannerPaused(false);
                },
              },
            ],
            { onDismiss: () => setIsScannerPaused(false) }
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
      Alert.alert('Error', 'Product name is required.');
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

        if (mode === 'sell') {
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
        });
        await productService.updateInventory(currentProduct.id, qty);

        if (mode === 'sell') {
          setCart((prev) =>
            prev.map((item) =>
              item.productId === currentProduct.id
                ? { ...item, title: title, unitPrice: price }
                : item
            )
          );
        }
      }
      setProductModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isScannerPaused || loading || enterModalVisible || productModalVisible) return;
    if (result.data) handleScannedCode(result.data);
  };

  if (permission && !permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background p-5">
        <Package size={60} className="mb-4 text-muted-foreground" />
        <Text variant="h2" className="mb-2 text-center">
          Camera Access Needed
        </Text>
        <Text variant="p" className="mb-8 text-center text-muted-foreground">
          We need your permission to show the camera for scanning barcodes.
        </Text>
        <Button onPress={requestPermission} className="h-14 w-full rounded-full">
          <Text className="text-lg font-bold text-primary-foreground">Grant Permission</Text>
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View className="flex-1 overflow-hidden bg-black">
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            enableTorch={torch}
            onBarcodeScanned={onBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
            }}
          />
        )}

        <SafeAreaView className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between px-5 pt-4">
          <Button
            variant="secondary"
            size="icon"
            className="h-11 w-11 rounded-full border border-white/20 bg-black/40"
            onPress={() => router.back()}>
            <ArrowLeft size={22} color="white" />
          </Button>

          <View className="flex-row rounded-full border border-white/20 bg-black/40 p-1">
            <Pressable
              onPress={() => setMode('sell')}
              className={cn(
                'rounded-full px-5 py-2',
                mode === 'sell' ? 'bg-primary' : 'bg-transparent'
              )}>
              <Text
                className={cn(
                  'text-xs font-black uppercase',
                  mode === 'sell' ? 'text-primary-foreground' : 'text-white'
                )}>
                {t('sell')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('stock')}
              className={cn(
                'rounded-full px-5 py-2',
                mode === 'stock' ? 'bg-primary' : 'bg-transparent'
              )}>
              <Text
                className={cn(
                  'text-xs font-black uppercase',
                  mode === 'stock' ? 'text-primary-foreground' : 'text-white'
                )}>
                {t('inventory')}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-11 w-11 rounded-full border border-white/20 bg-black/40"
              onPress={toggleTorch}>
              {torch ? <Zap size={20} color="#36e27b" /> : <ZapOff size={20} color="white" />}
            </Button>
          </View>
        </SafeAreaView>

        <View className="pointer-events-none absolute inset-0 z-0 items-center justify-center">
          <View
            style={{ width: scanBoxSize, height: scanBoxSize }}
            className="overflow-hidden rounded-[32px] border-2 border-white/30 bg-white/5">
            <View className="absolute left-0 top-0 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-primary" />
            <View className="absolute right-0 top-0 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-primary" />
            <View className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-primary" />
            <View className="absolute bottom-0 right-0 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-primary" />

            <Animated.View
              style={{
                transform: [{ translateY: scanY }],
                width: '100%',
              }}
              className="h-1 bg-primary opacity-80 shadow-lg shadow-primary"
            />
          </View>

          <View className="mt-8 flex-row items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2">
            <Scan size={16} className="text-primary" />
            <Text className="text-xs font-bold uppercase tracking-widest text-white">
              Align barcode to scan
            </Text>
          </View>
        </View>

        <View className="absolute right-4 top-1/2 z-10 -translate-y-1/2 gap-6">
          <Pressable onPress={toggleCameraType} className="items-center">
            <View className="mb-1 h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40">
              <RefreshCw size={22} color="white" />
            </View>
            <Text className="text-[10px] font-black uppercase text-white shadow-black">Flip</Text>
          </Pressable>

          <Pressable onPress={() => setEnterModalVisible(true)} className="items-center">
            <View className="mb-1 h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40">
              <Keyboard size={22} color="white" />
            </View>
            <Text className="text-[10px] font-black uppercase text-white shadow-black">Manual</Text>
          </Pressable>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 rounded-t-[40px] bg-background p-6 pb-10 shadow-2xl shadow-black">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-muted" />

        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text variant="h3" className="font-black text-foreground">
              {mode === 'sell' ? t('cart') : t('scannedItems')}
            </Text>
            {mode === 'sell' && (
              <Text variant="muted" className="text-xs font-bold uppercase">
                {cart.length} {t('items')}
              </Text>
            )}
          </View>
          {cart.length > 0 && mode === 'sell' && (
            <Pressable onPress={clearAllCart}>
              <Text className="text-xs font-bold uppercase tracking-tighter text-destructive">
                Clear All
              </Text>
            </Pressable>
          )}
        </View>

        <View className="mb-4 max-h-60">
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-border/50 bg-secondary/50 p-3">
                <View className="flex-1 flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-background">
                    <ImageIcon size={18} className="text-muted-foreground/30" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-black text-foreground" numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text className="mt-0.5 text-xs font-bold text-primary">
                      ₦{item.unitPrice.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View className="ml-2 flex-row items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border"
                    onPress={() => changeCartQty(item.id, -1)}>
                    <Minus size={14} color="#666" />
                  </Button>
                  <Text className="min-w-[20px] text-center font-black text-foreground">
                    {item.qty}
                  </Text>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    onPress={() => changeCartQty(item.id, 1)}>
                    <Plus size={14} color="#000" />
                  </Button>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center py-6">
                <ShoppingCart size={32} className="mb-2 text-muted-foreground/20" />
                <Text variant="muted" className="font-bold italic">
                  No items scanned yet
                </Text>
              </View>
            }
          />
        </View>

        {mode === 'sell' ? (
          <Button
            className="h-16 flex-row items-center justify-between rounded-3xl bg-primary px-6 shadow-xl shadow-primary/30"
            onPress={onCheckout}
            disabled={cart.length === 0}>
            <View>
              <Text className="text-[10px] font-black uppercase tracking-widest text-primary-foreground/70">
                Total Amount
              </Text>
              <Text className="text-xl font-black text-primary-foreground">
                ₦{totalAmount.toLocaleString()}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-2xl bg-black/10 px-4 py-2">
              <Text className="font-black uppercase tracking-tight text-primary-foreground">
                Checkout
              </Text>
              <ArrowRight size={20} color="#000" strokeWidth={3} />
            </View>
          </Button>
        ) : (
          <Button
            className="h-16 rounded-3xl border border-border bg-secondary"
            onPress={() => router.back()}>
            <Text className="font-black uppercase tracking-widest text-foreground">
              Finish Inventory
            </Text>
          </Button>
        )}
      </View>

      <Modal
        visible={enterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEnterModalVisible(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 p-6">
          <Card className="w-full rounded-[32px] border border-border bg-background p-6 shadow-2xl">
            <Text variant="h3" className="mb-6 font-black text-foreground">
              Enter Barcode
            </Text>
            <Input
              placeholder="e.g. 12345678"
              className="mb-6 h-14 rounded-2xl border-border bg-secondary text-lg font-bold"
              value={enteredCode}
              onChangeText={setEnteredCode}
              keyboardType="number-pad"
              autoFocus
            />
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-2xl"
                onPress={() => setEnterModalVisible(false)}>
                <Text className="font-bold">Cancel</Text>
              </Button>
              <Button className="h-12 flex-1 rounded-2xl" onPress={handleEnterCodeConfirm}>
                <Text className="text-xs font-black uppercase">Confirm</Text>
              </Button>
            </View>
          </Card>
        </View>
      </Modal>

      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 items-center justify-center bg-black/60 p-6">
          <Card className="max-h-[90%] w-full rounded-[32px] border border-border bg-background p-6 shadow-2xl">
            <Text variant="h3" className="mb-2 font-black text-foreground">
              {isNewProduct ? 'New Product' : 'Edit Product'}
            </Text>
            <View className="mb-6 flex-row items-center gap-2 self-start rounded-xl bg-primary/10 px-3 py-1.5">
              <Barcode size={14} className="text-primary" />
              <Text className="text-[11px] font-black uppercase text-primary">
                {currentProduct?.barcode}
              </Text>
            </View>

            <FlatList
              data={[1]}
              keyExtractor={() => 'form'}
              showsVerticalScrollIndicator={false}
              renderItem={() => (
                <View className="gap-5 pb-4">
                  <View>
                    <View className="mb-2 flex-row items-center justify-between px-1">
                      <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Product Name
                      </Text>
                      {isNewProduct && (
                        <Pressable
                          className="flex-row items-center gap-1"
                          onPress={handleRecommendCategory}>
                          <Sparkles size={12} color="white" />
                          <Text className="text-[10px] font-bold text-primary">
                            Suggest Category
                          </Text>
                        </Pressable>
                      )}
                    </View>
                    <Input
                      className="h-14 rounded-2xl border-border bg-secondary text-base font-bold"
                      placeholder="e.g. Coca-Cola 50cl"
                      value={editTitle}
                      onChangeText={setEditTitle}
                    />
                  </View>

                  <View className="flex-row gap-4">
                    <View className="flex-1">
                      <Text className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Selling Price
                      </Text>
                      <View className="relative">
                        <Text className="absolute left-3 top-1/2 z-10 translate-y-[-50%] text-base font-bold text-foreground">
                          ₦
                        </Text>
                        <Input
                          className="h-14 rounded-2xl border-border bg-secondary pl-8 text-base font-bold"
                          keyboardType="numeric"
                          value={editPrice}
                          onChangeText={setEditPrice}
                        />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Cost Price
                      </Text>
                      <View className="relative">
                        <Text className="absolute left-3 top-1/2 z-10 translate-y-[-50%] text-base font-bold text-foreground">
                          ₦
                        </Text>
                        <Input
                          className="h-14 rounded-2xl border-border bg-secondary pl-8 text-base font-bold text-muted-foreground"
                          keyboardType="numeric"
                          value={editCostPrice}
                          onChangeText={setEditCostPrice}
                        />
                      </View>
                    </View>
                  </View>

                  <View>
                    <Text className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Category
                    </Text>
                    <View className="relative h-14 justify-center overflow-hidden rounded-2xl border border-border bg-secondary px-4">
                      <RNPickerSelect
                        onValueChange={(v) => setEditCategory(v)}
                        items={categories.map((c) => ({ label: c, value: c }))}
                        value={editCategory}
                        style={{
                          inputIOS: {
                            color: 'white',
                            fontSize: 16,
                            fontWeight: '700',
                          },
                          inputAndroid: {
                            color: 'white',
                            fontSize: 16,
                            fontWeight: '700',
                          },
                          placeholder: { color: '#666' },
                        }}
                        useNativeAndroidPickerStyle={false}
                        Icon={() => (
                          <ChevronDown
                            size={18}
                            className="absolute right-4 top-1 text-muted-foreground"
                          />
                        )}
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Current Stock
                    </Text>
                    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-secondary p-3">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-12 w-12 rounded-xl border border-border bg-background shadow-sm"
                        onPress={() => setEditQty((q) => Math.max(0, q - 1))}>
                        <Minus size={20} color="white" />
                      </Button>
                      <View className="items-center">
                        <Text className="text-2xl font-black text-foreground">{editQty}</Text>
                        <Text className="text-[9px] font-bold uppercase text-muted-foreground">
                          Units in store
                        </Text>
                      </View>
                      <Button
                        className="h-12 w-12 rounded-xl bg-primary shadow-sm"
                        size="icon"
                        onPress={() => setEditQty((q) => q + 1)}>
                        <Plus size={20} color="#000" />
                      </Button>
                    </View>
                  </View>
                </View>
              )}
            />

            <View className="mt-4 flex-row gap-3">
              <Button
                variant="outline"
                className="h-14 flex-1 rounded-2xl"
                onPress={() => setProductModalVisible(false)}>
                <Text className="font-bold">Cancel</Text>
              </Button>
              <Button className="flex-2 h-14 rounded-2xl bg-primary" onPress={handleProductConfirm}>
                <Text className="font-black uppercase tracking-tight text-primary-foreground">
                  {isNewProduct ? 'Add Product' : 'Save Changes'}
                </Text>
              </Button>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>

      {loading && (
        <View className="absolute inset-0 z-[100] items-center justify-center bg-black/40">
          <View className="items-center rounded-3xl border border-border bg-background p-6">
            <ActivityIndicator size="large" color="#36e27b" />
            <Text className="mt-4 text-xs font-black uppercase tracking-widest">Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
}
