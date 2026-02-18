import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, FlatList, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Sparkles, TrendingUp, ShoppingCart, Plus, Calendar } from 'lucide-react-native';
import { productService } from '@/services/productService';
import { t } from '@/utils/localization';
import { SaleItem } from '@/components/SaleItem';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Icon } from '@/components/ui/icon';

const { width } = Dimensions.get('window');

export default function AllSalesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sales, setSales] = useState<any[]>([]);
  const [insights] = useState({
    message: 'Your sales are up 12% compared to last week. Most sales are coming from Beverages.',
    chips: [
      { label: 'Top Seller', value: 'Coke 50cl', color: 'text-primary' },
      { label: 'Low Margin', value: 'Bread', color: 'text-destructive' },
    ],
  });

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const allSales = await productService.getAllSales();
        setSales(allSales);
      } catch (error) {
        console.error('Failed to fetch sales', error);
      }
    };
    fetchSales();
  }, []);

  const filters = ['All', 'Cash', 'POS', 'Transfer'];

  const filteredSales = useMemo(() => {
    const q = query.toLowerCase();
    return sales.filter((s) => {
      const matchesSearch = (s.title || 'Sale').toLowerCase().includes(q);
      const matchesFilter = activeFilter === 'All' || s.paymentMethod === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [query, activeFilter, sales]);

  const todayStr = new Date().toDateString();
  const todaySales = filteredSales.filter((s) => new Date(s.createdAt).toDateString() === todayStr);
  const previousSales = filteredSales.filter(
    (s) => new Date(s.createdAt).toDateString() !== todayStr
  );

  const totalToday = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Dynamic weekly data for graph
  const weeklyData = useMemo(() => {
    const salesByDate: Record<string, number> = {};
    sales.forEach((s) => {
      const dateStr = new Date(s.createdAt).toDateString();
      salesByDate[dateStr] = (salesByDate[dateStr] || 0) + (s.totalAmount || 0);
    });

    const data = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dateStr = d.toDateString();
      const label = dayLabels[d.getDay()];
      const dayTotal = salesByDate[dateStr] || 0;

      data.push({ label, total: dayTotal });
    }

    const maxTotal = Math.max(...data.map((d) => d.total), 0);
    return data.map((d) => ({
      ...d,
      height: maxTotal > 0 ? Math.max((d.total / maxTotal) * 100, 5) : 5,
    }));
  }, [sales]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader
        title={t('allSales')}
        className="border-b-0 px-5 py-4"
        rightAdornment={
          <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full bg-secondary">
            <Icon as={Calendar} size={20} className="text-foreground" />
          </Button>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>
        {/* AI Assistant Card */}
        <View className="mt-2 px-5">
          <Card className="rounded-[32px] border-primary/20 bg-primary/10 p-5">
            <View className="mb-3 flex-row items-center gap-2">
              <Icon as={Sparkles} size={18} className="text-primary" />
              <Text className="text-[10px] font-black uppercase tracking-widest text-primary">
                AI Sales Assistant
              </Text>
            </View>
            <Text className="mb-4 text-sm font-bold leading-5 text-foreground">
              {insights.message}
            </Text>
            <View className="flex-row gap-3">
              {insights.chips.map((chip, idx) => (
                <View
                  key={idx}
                  className="flex-1 rounded-2xl border border-white/5 bg-background/50 px-3 py-2">
                  <Text className="mb-1 text-[9px] font-black uppercase text-muted-foreground">
                    {chip.label}
                  </Text>
                  <Text className={cn('text-xs font-black', chip.color)}>{chip.value}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Weekly Overview */}
        <View className="mt-6 px-5">
          <Card className="rounded-[32px] border-border/50 bg-secondary p-5">
            <View className="mb-6 flex-row items-center justify-between">
              <View>
                <Text className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Today's Total
                </Text>
                <Text className="text-3xl font-black text-foreground">
                  ₦{totalToday.toLocaleString()}
                </Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary/20">
                <Icon as={TrendingUp} size={24} className="text-primary" />
              </View>
            </View>

            <View className="h-24 flex-row items-end gap-3 px-1">
              {weeklyData.map((item, i) => (
                <View key={i} className="flex-1 items-center">
                  <View
                    style={{ height: `${item.height}%` }}
                    className={cn(
                      'w-full rounded-t-lg',
                      i === 6 ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-primary/20'
                    )}
                  />
                  <Text className="mt-2 text-[8px] font-black text-muted-foreground">
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Search & Filter */}
        <View className="mt-8 px-5">
          <View className="mb-4 h-12 flex-row items-center rounded-2xl border border-border bg-secondary px-4">
            <Icon as={Search} size={18} className="text-muted-foreground" />
            <Input
              placeholder="Search sales..."
              className="ml-2 h-full flex-1 border-0 bg-transparent text-sm font-bold"
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/*<ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row mb-2"
          >
            {filters.map((f) => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                className={cn(
                  "px-5 h-9 rounded-full mr-2 border justify-center",
                  activeFilter === f
                    ? "bg-primary border-primary"
                    : "bg-secondary border-border",
                )}
              >
                <Text
                  className={cn(
                    "text-[11px] font-black uppercase",
                    activeFilter === f
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </ScrollView>*/}
        </View>

        {/* Sales List */}
        <View className="mt-4 px-5">
          {todaySales.length > 0 && (
            <View className="mb-6">
              <Text className="mb-3 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Today
              </Text>
              {todaySales.map((sale) => (
                <SaleItem key={sale.id} item={sale} />
              ))}
            </View>
          )}

          {previousSales.length > 0 && (
            <View>
              <Text className="mb-3 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Earlier
              </Text>
              {previousSales.map((sale) => (
                <SaleItem key={sale.id} item={sale} />
              ))}
            </View>
          )}

          {filteredSales.length === 0 && (
            <View className="items-center rounded-[32px] border border-dashed border-border bg-secondary/30 py-20">
              <Icon as={ShoppingCart} size={48} className="mb-3 text-muted-foreground/20" />
              <Text variant="p" className="text-center font-bold text-muted-foreground">
                No matching sales found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <View className="absolute bottom-10 right-6 shadow-2xl shadow-primary/40">
        <Button
          size="icon"
          className="h-16 w-16 rounded-full bg-primary"
          onPress={() => router.push('/sales')}>
          <Icon as={Plus} size={32} color="#000" strokeWidth={3} />
        </Button>
      </View>
    </SafeAreaView>
  );
}
