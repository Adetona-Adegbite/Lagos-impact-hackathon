import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Animated,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
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
  Pencil,
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
import { CartItem } from '@/types/cart';

// Hooks
import { useCarts } from '@/hooks/sales/useCarts';
import { useScanner } from '@/hooks/sales/useScanner';
import { useProductManagement } from '@/hooks/sales/useProductManagement';
import { useCheckout } from '@/hooks/sales/useCheckout';
import { useSound } from '@/hooks/sales/useSound';

const { width } = Dimensions.get('window');

export default function ScanSellScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colorScheme } = useColorScheme();

  const [mode, setMode] = useState<'sell' | 'stock'>(
    params.initialMode === 'stock' ? 'stock' : 'sell'
  );
  const [loading, setLoading] = useState(false);

  const lastScanTs = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 1000;

  // Custom Hooks
  const {
    carts,
    setCarts,
    activeCartId,
    setActiveCartId,
    activeCartItems,
    setActiveCartItems,
    addNewCart,
    removeCart,
    changeCartQty,
    clearActiveCart,
  } = useCarts(params.initialMode === 'stock' ? 'stock' : 'sell');

  const {
    permission,
    requestPermission,
    cameraRef,
    facing,
    torch,
    setTorch,
    isScannerPaused,
    setIsScannerPaused,
    toggleTorch,
    toggleCameraType,
  } = useScanner();

  const {
    productModalVisible,
    setProductModalVisible,
    currentProduct,
    setCurrentProduct,
    isNewProduct,
    setIsNewProduct,
    categories,
    fetchCategories,
    handleRecommendCategory,
    enterModalVisible,
    setEnterModalVisible,
    enteredCode,
    setEnteredCode,
    searchResults,
    setSearchResults,
  } = useProductManagement();

  const { playSound } = useSound();

  // Animation
  const scanY = useRef(new Animated.Value(0)).current;
  const scanBoxSize = width * 0.7;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(scanY, {
          toValue: scanBoxSize,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scanY, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, [scanY, scanBoxSize]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const totalAmount = useMemo(
    () => activeCartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    [activeCartItems]
  );

  const { onCheckout } = useCheckout({
    cart: activeCartItems,
    totalAmount,
    activeCartId,
    setCarts,
    setIsScannerPaused,
    setLoading,
  });

  const handleClearCart = () => {
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
            clearActiveCart();
            setIsScannerPaused(false);
          },
        },
      ],
      { onDismiss: () => setIsScannerPaused(false) }
    );
  };

  const handleEditCartItem = async (item: CartItem) => {
    setIsScannerPaused(true);
    setLoading(true);
    try {
      const product = await productService.getProductById(item.productId);
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
        setProductModalVisible(true);
      } else {
        Alert.alert('Error', 'Product details not found.');
        setIsScannerPaused(false);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load product details.');
      setIsScannerPaused(false);
    } finally {
      setLoading(false);
    }
  };

  const handleScannedCode = async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTs.current < SCAN_COOLDOWN_MS) return;
    lastScanTs.current = now;

    playSound();

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
          setIsScannerPaused(true);
          setProductModalVisible(true);
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
          setIsScannerPaused(true);
          setProductModalVisible(true);
        }
      } else {
        if (product) {
          setActiveCartItems((prev) => {
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
          setActiveCartItems((prev) => [
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
        } else if (mode === 'stock') {
          setActiveCartItems((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              productId: newId,
              title: data.name,
              unitPrice: data.sellingPrice,
              qty: data.quantity,
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

        setCarts((prevCarts) =>
          prevCarts.map((c) => ({
            ...c,
            items: c.items.map((item) => {
              if (item.productId === currentProduct.id) {
                return {
                  ...item,
                  title: data.name,
                  unitPrice: data.sellingPrice,
                  qty: mode === 'stock' && c.id === 'inventory' ? data.quantity : item.qty,
                };
              }
              return item;
            }),
          }))
        );
      }
      setProductModalVisible(false);
      setIsScannerPaused(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterCodeConfirm = (code?: string) => {
    const codeToProcess = typeof code === 'string' ? code : enteredCode.trim();

    if (!codeToProcess) {
      Alert.alert('Enter code', 'Please enter a code or name.');
      return;
    }
    handleScannedCode(codeToProcess);
    setEnteredCode('');
    setSearchResults([]);
    setEnterModalVisible(false);
  };

  const handleCloseModal = () => {
    setProductModalVisible(false);
    setIsScannerPaused(false);
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (isScannerPaused || loading || enterModalVisible || productModalVisible) return;
    if (result.data) handleScannedCode(result.data);
  };

  const initialFormData: ProductFormData = {
    name: currentProduct?.name || '',
    barcode: currentProduct?.barcode || '',
    sellingPrice: currentProduct?.sellingPrice || 0,
    purchasePrice: currentProduct?.purchasePrice || 0,
    category: currentProduct?.category || categories[0] || 'General',
    quantity: currentProduct?.quantity || 1,
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
      <View className="flex-1 overflow-hidden bg-black">
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            enableTorch={torch}
            onBarcodeScanned={onBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
          />
        )}

        <SafeAreaView className="absolute left-0 right-0 top-0 z-10 flex-row items-center justify-between px-5 pt-4">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-secondary"
            onPress={() => router.back()}>
            <ArrowLeft size={22} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </Button>

          <View className="flex-row rounded-full border border-white/20 bg-black/40 p-1">
            <Pressable
              onPress={() => {
                setMode('sell');
                const salesCart = carts.find((c) => c.id !== 'inventory');
                if (salesCart) setActiveCartId(salesCart.id);
              }}
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
              onPress={() => {
                setMode('stock');
                setActiveCartId('inventory');
              }}
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

        <View className="absolute inset-0 z-0 items-center justify-start py-32">
          <View
            style={{ width: scanBoxSize, height: scanBoxSize }}
            className="pointer-events-none overflow-hidden rounded-2xl border-2 border-white/30 bg-white/5">
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

          <View className="absolute right-1 top-1/2 z-10 -translate-y-full gap-6">
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
              <Text className="text-[10px] font-black uppercase text-white shadow-black">
                Manual
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 rounded-t-[40px] bg-background p-6 pb-10 shadow-2xl shadow-black">
        <View className="mb-5 h-1.5 w-12 self-center rounded-full bg-muted" />

        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text variant="h3" className="font-black text-foreground">
              {mode === 'sell'
                ? `${t('cart')} ${carts.filter((c) => c.id !== 'inventory').findIndex((c) => c.id === activeCartId) + 1}`
                : t('scannedItems')}
            </Text>
            {mode === 'sell' && (
              <Text variant="muted" className="text-xs font-bold uppercase">
                {activeCartItems.length} {t('items')}
              </Text>
            )}
          </View>
          <View className="flex-row items-center gap-4">
            {activeCartItems.length > 0 && mode === 'sell' && (
              <Pressable onPress={handleClearCart}>
                <Text className="text-xs font-bold uppercase tracking-tighter text-destructive">
                  Clear All
                </Text>
              </Pressable>
            )}
            {mode === 'sell' && carts.filter((c) => c.id !== 'inventory').length > 1 && (
              <Pressable onPress={() => removeCart(activeCartId)}>
                <Text className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">
                  Remove Cart
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {mode === 'sell' && (
          <View className="mb-4">
            <FlatList
              horizontal
              data={carts.filter((c) => c.id !== 'inventory')}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <Pressable
                  onPress={() => setActiveCartId(item.id)}
                  className={cn(
                    'mr-2 flex-row items-center gap-2 rounded-xl border px-4 py-2',
                    activeCartId === item.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/50'
                  )}>
                  <ShoppingCart size={14} color={activeCartId === item.id ? '#36e27b' : '#666'} />
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      activeCartId === item.id ? 'text-primary' : 'text-muted-foreground'
                    )}>
                    {t('cart')} {index + 1}
                    {item.items.length > 0
                      ? ` · ₦${item.items
                          .reduce((s, it) => s + it.qty * it.unitPrice, 0)
                          .toLocaleString()}`
                      : ''}
                  </Text>
                </Pressable>
              )}
              ListFooterComponent={
                <Pressable
                  onPress={addNewCart}
                  className="flex-row items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2">
                  <Plus size={14} color="#666" />
                  <Text className="text-xs font-bold text-muted-foreground">New Cart</Text>
                </Pressable>
              }
            />
          </View>
        )}

        <View className="mb-4 max-h-60">
          <FlatList
            data={activeCartItems}
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
                  {mode === 'stock' ? (
                    <>
                      <Text className="mr-2 text-xs font-bold text-muted-foreground">
                        {item.qty} in stock
                      </Text>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border"
                        onPress={() => handleEditCartItem(item)}>
                        <Pencil size={14} color="#666" />
                      </Button>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center py-6">
                <ShoppingCart size={32} className="mb-2 text-muted-foreground/20" />
                <Text variant="muted" className="font-bold italic">
                  No items scanned yet{' '}
                </Text>
              </View>
            }
          />
        </View>

        {mode === 'sell' ? (
          <Button
            className="h-16 flex-row items-center justify-between rounded-3xl bg-primary px-6 shadow-xl shadow-primary/30"
            onPress={onCheckout}
            disabled={activeCartItems.length === 0}>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 items-center justify-center bg-black/60 p-6">
          <Card className="max-h-full w-full rounded-[32px] border border-border bg-background p-6 shadow-2xl">
            <Text variant="h3" className="mb-6 font-black text-foreground">
              Enter Barcode or Name
            </Text>
            <Input
              placeholder="e.g. 12345678 or Indomie"
              className="mb-4 h-14 rounded-2xl border-border bg-secondary text-lg font-bold"
              value={enteredCode}
              onChangeText={setEnteredCode}
              autoFocus
            />

            {searchResults.length > 0 && (
              <View className="mb-4 max-h-44 shrink overflow-hidden rounded-xl border border-border bg-secondary/30">
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleEnterCodeConfirm(item.barcode)}
                      className="flex-row items-center justify-between border-b border-border/50 p-3 active:bg-primary/10">
                      <View className="flex-1">
                        <Text className="font-bold text-foreground">{item.name}</Text>
                        <Text className="text-xs text-muted-foreground">{item.barcode}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-bold text-primary">
                          ₦{item.sellingPrice.toLocaleString()}
                        </Text>
                        <Text className="text-[10px] text-muted-foreground">
                          {item.quantity} in stock
                        </Text>
                      </View>
                    </Pressable>
                  )}
                />
              </View>
            )}

            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-2xl"
                onPress={() => setEnterModalVisible(false)}>
                <Text className="font-bold">Cancel</Text>
              </Button>
              <Button className="h-12 flex-1 rounded-2xl" onPress={() => handleEnterCodeConfirm()}>
                <Text className="text-xs font-black uppercase">Confirm</Text>
              </Button>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </Modal>

      <ProductFormModal
        visible={productModalVisible}
        onClose={handleCloseModal}
        onConfirm={handleProductConfirm}
        initialData={initialFormData}
        isNewProduct={isNewProduct}
        categories={categories}
        onRecommendCategory={(name) => handleRecommendCategory(name).then((r) => r?.category)}
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
