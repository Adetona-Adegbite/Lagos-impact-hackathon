import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView, ActivityIndicator, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Banknote,
  // Sparkles,
  // Landmark,
  // TrendingUp,
  // Package,
  // CreditCard,
  ChevronRight,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { productService } from '@/services/productService';
import { t } from '@/utils/localization';
import { cn } from '@/lib/utils';

type SaleItemDetail = {
  id: string;
  productId: string;
  quantity: number;
  priceAtSale: number;
  title: string;
  category: string;
};

type SaleDetail = {
  id: string;
  totalAmount: number;
  createdAt: string;
  paymentMethod?: string;
  items: SaleItemDetail[];
};

export default function SalesReceiptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSale = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await productService.getSaleById(id);
      if (data) {
        setSale(data as SaleDetail);
      }
    } catch (error) {
      console.error('Failed to fetch sale details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#36e27b" />
      </View>
    );
  }

  if (!sale) {
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

  const dateStr = new Date(sale.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border/10 px-5 py-3">
        <View className="flex-row items-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-secondary"
            onPress={() => router.back()}>
            <ArrowLeft size={22} color="white" />
          </Button>
          <Text variant="h3" className="font-black text-foreground">
            Receipt #{sale.id.slice(-4).toUpperCase()}
          </Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        {/* Receipt Card */}
        <View className="p-5">
          <Card className="overflow-hidden rounded-[40px] border-border/50 bg-secondary/30">
            {/* Success Header */}
            <View className="items-center border-b border-border/50 p-8">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Check size={32} color="#36e27b" strokeWidth={3} />
              </View>
              <Text className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Payment Successful
              </Text>
              <Text className="mt-2 text-4xl font-black text-foreground">
                ₦{sale.totalAmount.toLocaleString()}
              </Text>

              <View className="mt-6 w-full flex-row items-center justify-between rounded-2xl bg-background/40 px-4 py-3">
                <Text className="text-xs font-bold text-muted-foreground">{dateStr}</Text>
                <View className="flex-row items-center gap-2">
                  <Banknote size={14} className="text-primary" />
                  <Text className="text-xs font-black uppercase text-foreground">
                    {sale.paymentMethod || 'Cash'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Items List */}
            <View className="p-6">
              <Text className="mb-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Items Purchased
              </Text>
              {sale.items.map((it) => (
                <Pressable
                  key={it.id}
                  onPress={() => router.push(`/product/${it.productId}`)}
                  className="mb-4 flex-row items-center justify-between active:opacity-70">
                  <View className="flex-1 flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-background/50">
                      <Text className="text-xs font-black text-primary">{it.quantity}x</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-black text-foreground" numberOfLines={1}>
                        {it.title}
                      </Text>
                      <Text className="text-[10px] font-bold uppercase text-muted-foreground">
                        {it.category}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className="ml-4 font-black text-foreground">
                      ₦{(it.priceAtSale * it.quantity).toLocaleString()}
                    </Text>
                    <ChevronRight size={14} color="white" />
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>
        </View>

        {/* AI Analysis section */}
        {/*<View className="px-5">
          <View className="mb-4 flex-row items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <Text className="text-lg font-black text-foreground">AI Analysis</Text>
          </View>*/}

        {/*<View className="gap-3">*/}
        {/* VAT Insight */}
        {/*<View className="relative flex-row overflow-hidden rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
              <View className="absolute bottom-0 left-0 top-0 w-1.5 bg-blue-500" />
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-background/50">
                <Landmark size={18} className="text-blue-500" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-foreground">VAT Eligible</Text>
                <Text className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
                  This sale contains VAT-eligible items. Estimated tax:{' '}
                  <Text className="font-black text-blue-500">
                    ₦{(sale.totalAmount * 0.075).toLocaleString()}
                  </Text>
                </Text>
              </View>
            </View>*/}

        {/* Growth Insight */}
        {/*<View className="relative flex-row overflow-hidden rounded-3xl border border-orange-500/20 bg-orange-500/10 p-5">
              <View className="absolute bottom-0 left-0 top-0 w-1.5 bg-orange-500" />
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-background/50">
                <TrendingUp size={18} className="text-orange-500" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-foreground">Notable Transaction</Text>
                <Text className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
                  {sale.totalAmount > 5000
                    ? 'High-value transaction compared to store average. Flagged as notable for growth metrics.'
                    : 'Consistent transaction volume. No unusual patterns detected for this sale.'}
                </Text>
              </View>
            </View>*/}

        {/* Inventory Insight */}
        {/*<View className="relative flex-row overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-5">
              <View className="absolute bottom-0 left-0 top-0 w-1.5 bg-primary" />
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-background/50">
                <Package size={18} className="text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-foreground">Inventory Management</Text>
                <Text className="mt-1 text-xs font-bold leading-5 text-muted-foreground">
                  Inventory levels updated successfully for {sale.items.length} items. Indicated
                  items are being monitored for restocking.
                </Text>
              </View>
            </View>
          </View>
        </View>*/}
      </ScrollView>

      {/* Sticky Footer */}
      {/*<View className="absolute bottom-10 left-5 right-5 shadow-2xl shadow-primary/40">
        <Button
          onPress={() => console.log('Include in credit history')}
          className="h-16 flex-row gap-3 rounded-full bg-primary shadow-xl shadow-primary/30">
          <CreditCard size={24} color="#000" strokeWidth={3} />
          <Text className="text-lg font-black uppercase tracking-tight text-primary-foreground">
            Include in Credit History
          </Text>
        </Button>
      </View>*/}
    </SafeAreaView>
  );
}
