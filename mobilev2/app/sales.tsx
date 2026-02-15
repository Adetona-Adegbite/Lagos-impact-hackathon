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
import { Audio } from 'expo-av';
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
  ArrowLeft,
  ImageIcon,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { productService } from '@/services/productService';
import { ProductFormModal, ProductFormData } from '@/components/ProductFormModal';
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

// TODO(tobani):
// update the checkout flow to ask if the sale has been paid for
// if it hasnt it should have a special section on the sales ui,
// i'd like to add special support for 'credit' where you can specify their details to keep track of what they owe

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
  const [sound, setSound] = useState<Audio.Sound>();

  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = Math.min(width * 0.65, 320);
  const lastScanTs = useRef<number>(0);

  const [enterModalVisible, setEnterModalVisible] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');

  const [productModalVisible, setProductModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<
    (Partial<ProductFormData> & { id?: string }) | null
  >(null);

  const [isNewProduct, setIsNewProduct] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isScannerPaused, setIsScannerPaused] = useState(false);

  useEffect(() => {
    if (permission === null) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    async function loadSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(require('../assets/scan-sound.mp3'));
        setSound(sound);
      } catch (e) {
        console.log('Error loading sound', e);
      }
    }
    loadSound();
  }, []);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

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

  const initialFormData = useMemo(
    () =>
      currentProduct
        ? {
            name: currentProduct.name,
            barcode: currentProduct.barcode,
            sellingPrice: currentProduct.sellingPrice,
            purchasePrice: currentProduct.purchasePrice,
            category: currentProduct.category,
            quantity: currentProduct.quantity,
          }
        : undefined,
    [currentProduct]
  );

  const totalAmount = useMemo(() => cart.reduce((s, it) => s + it.qty * it.unitPrice, 0), [cart]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await productService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        setCategories(['General', 'Snacks', 'Beverages']);
      }
    };
    fetchCategories();
  }, []);

  const handleRecommendCategory = async (name: string) => {
    try {
      const res = await productService.recommendCategory(name);
      return res.category;
    } catch (e) {
      console.log('Category suggestion failed', e);
      return undefined;
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
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound', error);
    }

    try {
      setLoading(true);
      const product = await productService.getProductByBarcode(barcode);

      if (mode === 'stock') {
        if (product) {
          setCurrentProduct({
            id: product.id,
            barcode: product.barcode,
            name: product.name,
            sellingPrice: product.sellingPrice,
            quantity: product.quantity || 0,
            category: product.category,
            purchasePrice: product.purchasePrice,
          });
          setIsNewProduct(false);
        } else {
          setCurrentProduct({
            barcode: barcode,
            name: '',
            sellingPrice: 0,
            quantity: 1,
            category: categories[0] || 'General',
            purchasePrice: 0,
          });
          setIsNewProduct(true);
        }
        setIsScannerPaused(true);
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
                    name: '',
                    sellingPrice: 0,
                    quantity: 1,
                    category: categories[0] || 'General',
                    purchasePrice: 0,
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

  const handleProductConfirm = async (data: ProductFormData) => {
    if (!currentProduct) return;

    if (!data.name.trim()) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }

    try {
      setLoading(true);
      if (isNewProduct) {
        const newId = await productService.createProduct({
          name: data.name,
          barcode: currentProduct.barcode!,
          category: data.category,
          sellingPrice: data.sellingPrice,
          purchasePrice: data.purchasePrice,
          quantity: data.quantity,
        });

        if (mode === 'sell') {
          setCart((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              productId: newId,
              title: data.name,
              unitPrice: data.sellingPrice,
              qty: 1,
              image: null,
            },
          ]);
        }
      } else if (currentProduct.id) {
        await productService.updateProduct(currentProduct.id, {
          name: data.name,
          sellingPrice: data.sellingPrice,
          purchasePrice: data.purchasePrice,
          category: data.category,
        });
        await productService.updateInventory(currentProduct.id, data.quantity);

        if (mode === 'sell') {
          setCart((prev) =>
            prev.map((item) =>
              item.productId === currentProduct.id
                ? { ...item, title: data.name, unitPrice: data.sellingPrice }
                : item
            )
          );
        }
      }
      setProductModalVisible(false);
      setIsScannerPaused(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setProductModalVisible(false);
    setIsScannerPaused(false);
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
            className="h-10 w-10 rounded-full bg-secondary"
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
            className="overflow-hidden rounded-2xl border-2 border-white/30 bg-white/5">
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

      <ProductFormModal
        visible={productModalVisible}
        onClose={handleCloseModal}
        onConfirm={handleProductConfirm}
        initialData={initialFormData}
        isNewProduct={isNewProduct}
        categories={categories}
        onRecommendCategory={handleRecommendCategory}
      />

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
