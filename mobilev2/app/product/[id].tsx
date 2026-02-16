import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Edit3,
  Package,
  History,
  TrendingUp,
  ImageIcon,
  Calendar,
  AlertTriangle,
  Barcode,
  Trash2,
} from 'lucide-react-native';
import { productService } from '@/services/productService';
import { t } from '@/utils/localization';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProductFormModal, ProductFormData } from '@/components/ProductFormModal';
import { ScreenHeader } from '@/components/ScreenHeader';

const { width } = Dimensions.get('window');

type ProductData = {
  id: string;
  name: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  purchasePrice: number;
  quantity: number;
};

type SaleRecord = {
  saleId: string;
  createdAt: string;
  quantity: number;
  priceAtSale: number;
};

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'Today' | 'Week' | 'Month' | 'All'>('All');
  const [categories, setCategories] = useState<string[]>([]);

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [prod, history, cats] = await Promise.all([
        productService.getProductById(id),
        productService.getProductSales(id),
        productService.getCategories(),
      ]);

      if (prod) {
        setProduct({
          id: prod.id,
          name: prod.name,
          barcode: prod.barcode,
          category: prod.category,
          sellingPrice: prod.sellingPrice,
          purchasePrice: prod.purchasePrice,
          quantity: prod.quantity || 0,
        });
      }
      setSales(history);
      setCategories(cats);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSales = useMemo(() => {
    if (period === 'All') return sales;
    const now = new Date();
    return sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      if (period === 'Today') {
        return saleDate.toDateString() === now.toDateString();
      }
      if (period === 'Week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (period === 'Month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        return saleDate >= monthAgo;
      }
      return true;
    });
  }, [sales, period]);

  const totalSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.quantity, 0);
  }, [filteredSales]);

  const revenue = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.quantity * s.priceAtSale, 0);
  }, [filteredSales]);

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!product) return;
    try {
      await productService.updateProduct(product.id, {
        name: data.name,
        sellingPrice: data.sellingPrice,
        purchasePrice: data.purchasePrice,
        category: data.category,
      });
      await productService.updateInventory(product.id, data.quantity);
      setEditModalVisible(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleDeleteProduct = () => {
    if (!product) return;
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(product.id);
              router.back();
            } catch (error) {
              console.error('Failed to delete product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleRecommendCategory = async (name: string) => {
    try {
      const res = await productService.recommendCategory(name);
      return res.category;
    } catch (e) {
      console.log('Category suggestion failed', e);
      return undefined;
    }
  };

  const initialFormData = useMemo(
    () =>
      product
        ? {
            name: product.name,
            barcode: product.barcode,
            sellingPrice: product.sellingPrice,
            purchasePrice: product.purchasePrice,
            category: product.category,
            quantity: product.quantity,
          }
        : undefined,
    [product]
  );

  if (loading && !product) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#36e27b" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text variant="h3" className="text-center font-black">
          {t('productNotFound')}
        </Text>
        <Button className="mt-4" onPress={() => router.back()}>
          <Text>{t('goBack')}</Text>
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title={t('productDetails')}
        rightAdornment={
          <View className="flex-row gap-2">
            {sales.length === 0 && (
              <Button
                variant="destructive"
                size="icon"
                className="h-10 w-10 rounded-full"
                onPress={handleDeleteProduct}>
                <Trash2 size={20} color="white" />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-secondary"
              onPress={() => setEditModalVisible(true)}>
              <Edit3 size={20} color="white" />
            </Button>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        {/* Product Image & Key Info */}
        <View className="p-5">
          <Card className="items-center border-border/50 bg-secondary/30 p-6">
            <View className="mb-4 h-32 w-32 items-center justify-center rounded-3xl bg-background shadow-sm">
              <ImageIcon size={48} className="text-muted-foreground/20" />
            </View>
            <Text className="text-center text-2xl font-black text-foreground">{product.name}</Text>
            <Text className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {product.category}
            </Text>
            <View className="mt-4 flex items-center justify-center">
              <View className="flex-row items-center gap-2 self-start rounded-xl bg-primary/10 px-3 py-1.5">
                <Barcode size={14} className="text-primary" />
                <Text className="text-[11px] font-black uppercase text-primary">
                  {product.barcode}
                </Text>
              </View>
            </View>

            <View className="mt-6 w-full flex-row gap-8">
              <View className="flex-1 items-center">
                <Text className="mb-1 text-[10px] font-black uppercase text-muted-foreground">
                  {t('sellingPrice')}
                </Text>
                <Text className="text-xl font-black text-primary">
                  ₦{product.sellingPrice.toLocaleString()}
                </Text>
              </View>
              <View className="flex-1 items-center border-l border-border/50">
                <Text className="mb-1 text-[10px] font-black uppercase text-muted-foreground">
                  {t('costPrice')}
                </Text>
                <Text className="text-xl font-black text-foreground/70">
                  ₦{product.purchasePrice.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Stock Status */}
        <View className="px-5 pb-5">
          <Card className="flex-row items-center justify-between border-border/50 bg-secondary/20 p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Package size={24} className="text-primary" />
              </View>
              <View>
                <Text className="text-sm font-black text-foreground">{t('currentStock')}</Text>
                <Text className="text-xs font-bold text-muted-foreground">
                  {product.quantity} {t('units')} {t('inStock')}
                </Text>
              </View>
            </View>
            {product.quantity <= 3 && (
              <View className="flex-row items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5">
                <AlertTriangle size={12} className="text-destructive" />
                <Text className="text-[10px] font-black uppercase text-destructive">
                  {t('lowStock')}
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Sales Stats Overview */}
        <View className="px-5 pb-5">
          <View className="flex-row gap-3">
            <Card className="flex-1 border-border/50 bg-secondary/20 p-4">
              <Text className="mb-1 text-[10px] font-black uppercase text-muted-foreground">
                {t('totalSold')}
              </Text>
              <View className="flex-row items-end gap-1">
                <Text className="text-2xl font-black text-foreground">{totalSold}</Text>
                <Text className="mb-1 text-[10px] font-bold text-muted-foreground">
                  {t('units')}
                </Text>
              </View>
            </Card>
            <Card className="flex-1 border-border/50 bg-secondary/20 p-4">
              <Text className="mb-1 text-[10px] font-black uppercase text-muted-foreground">
                {t('revenue')}
              </Text>
              <Text className="text-2xl font-black text-foreground" numberOfLines={1}>
                ₦{revenue.toLocaleString()}
              </Text>
            </Card>
          </View>
        </View>

        {/* Sales History */}
        <View className="px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <History size={18} className="text-foreground" />
              <Text className="text-lg font-black text-foreground">{t('salesHistory')}</Text>
            </View>
          </View>

          {/* Period Filter */}
          <View className="mb-4 flex-row gap-2">
            {(['Today', 'Week', 'Month', 'All'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                className={cn(
                  'rounded-full border px-4 py-2',
                  period === p ? 'border-primary bg-primary' : 'border-border bg-secondary/50'
                )}>
                <Text
                  className={cn(
                    'text-[10px] font-black uppercase',
                    period === p ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                  {t(p.toLowerCase() as any)}
                </Text>
              </Pressable>
            ))}
          </View>

          {filteredSales.length === 0 ? (
            <View className="items-center rounded-3xl border border-dashed border-border bg-secondary/10 py-12">
              <TrendingUp size={32} className="mb-2 text-muted-foreground/20" />
              <Text className="text-sm font-bold italic text-muted-foreground">
                {t('noSalesFound')}{' '}
              </Text>
            </View>
          ) : (
            filteredSales.map((sale) => (
              <View
                key={sale.saleId}
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-border/50 bg-secondary/40 p-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-background">
                    <Calendar size={18} className="text-muted-foreground/40" />
                  </View>
                  <View>
                    <Text className="text-sm font-black text-foreground">
                      {new Date(sale.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text className="text-xs font-bold text-muted-foreground">
                      {t('sold')} {sale.quantity} {t('units')}
                    </Text>
                  </View>
                </View>
                <Text className="font-black text-foreground">
                  ₦{(sale.quantity * sale.priceAtSale).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <ProductFormModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        onConfirm={handleUpdateProduct}
        initialData={initialFormData}
        isNewProduct={false}
        categories={categories}
        onRecommendCategory={handleRecommendCategory}
      />
    </SafeAreaView>
  );
}
