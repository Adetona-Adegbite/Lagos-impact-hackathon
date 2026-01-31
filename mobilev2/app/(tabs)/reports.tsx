import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Search } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { authStorage } from '@/services/authStorage';
import { productService } from '@/services/productService';
import { t } from '@/utils/localization';
import { cn } from '@/lib/utils';

type Range = 'month' | 'ytd';

interface ReportStats {
  fastestMoving: { name: string; totalQuantity: number; totalRevenue: number }[];
  slowestMoving: { name: string; totalQuantity: number }[];
  mostProfitableDay: { day: string; total: number };
}

export default function ReportsScreen() {
  const router = useRouter();
  const [range, setRange] = useState<Range>('month');
  const [query, setQuery] = useState('');
  const [shopName, setShopName] = useState('My Shop');

  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const authData = await authStorage.getAuthData();
      if (authData?.user?.shopName) {
        setShopName(authData.user.shopName);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await productService.getReportStats(range);
        setStats(data);
      } catch (e) {
        console.error('Failed to fetch report stats:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range]);

  const filteredStats = useMemo(() => {
    if (!stats) return null;

    // Filter out items in slowestMoving that are also in fastestMoving
    const fastestNames = new Set(stats.fastestMoving.map((item) => item.name));
    const filteredSlowestMoving = stats.slowestMoving.filter(
      (item) => !fastestNames.has(item.name)
    );

    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        ...stats,
        slowestMoving: filteredSlowestMoving,
      };
    }

    return {
      ...stats,
      fastestMoving: stats.fastestMoving.filter((i) => i.name.toLowerCase().includes(q)),
      slowestMoving: filteredSlowestMoving.filter((i) => i.name.toLowerCase().includes(q)),
    };
  }, [stats, query]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View className="flex-row items-center gap-4 border-b border-border/10 px-4 py-3">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-secondary"
          onPress={() => router.back()}>
          <ArrowLeft size={20} color="white" />
        </Button>
        <Text variant="h3" className="font-black text-foreground">
          {t('report')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}>
        {/* Date range toggle */}
        <View className="mb-4 px-5">
          <View className="flex-row rounded-xl bg-secondary p-1">
            <TouchableOpacity
              className={cn(
                'flex-1 items-center rounded-lg py-2',
                range === 'month' && 'bg-background'
              )}
              onPress={() => setRange('month')}>
              <Text
                className={cn(
                  'font-bold',
                  range === 'month' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={cn(
                'flex-1 items-center rounded-lg py-2',
                range === 'ytd' && 'bg-background'
              )}
              onPress={() => setRange('ytd')}>
              <Text
                className={cn(
                  'font-bold',
                  range === 'ytd' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                Year-to-date
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="mt-4 flex-row items-center gap-2">
            <View className="relative flex-1">
              <View className="absolute left-3 top-3 z-10">
                <Search size={18} color="#72777C" />
              </View>
              <Input
                placeholder="Filter products..."
                value={query}
                onChangeText={setQuery}
                className="pl-10"
                returnKeyType="search"
              />
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" className="mt-12 text-primary" />
        ) : filteredStats ? (
          <>
            {/* Most Profitable Day Card */}
            <Card className="mx-5 mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <View className="mb-4 flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Calendar size={20} color="#36E27B" />
                  </View>
                  <Text className="text-lg font-bold text-foreground">Best Performing Day</Text>
                </View>
                <View>
                  <Text className="text-3xl font-black text-foreground">
                    {filteredStats.mostProfitableDay.day}
                  </Text>
                  <Text variant="muted" className="mt-1 font-medium">
                    Total Sales: ₦
                    {filteredStats.mostProfitableDay.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Fastest Moving Products */}
            <View className="mx-5 mb-6">
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <TrendingUp size={20} color="#22C55E" />
                </View>
                <Text variant="h3" className="text-lg">
                  Fastest Moving Products
                </Text>
              </View>

              <Card>
                <CardContent className="gap-0 p-0">
                  {filteredStats.fastestMoving.length > 0 ? (
                    filteredStats.fastestMoving.map((item, index) => (
                      <View
                        key={index}
                        className={cn(
                          'flex-row items-center gap-4 p-4',
                          index !== filteredStats.fastestMoving.length - 1 &&
                            'border-b border-border'
                        )}>
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                          <Text className="text-xs font-bold text-green-600">{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="mb-1 font-bold text-foreground">{item.name}</Text>
                          <Text variant="muted" className="text-xs">
                            {item.totalQuantity} sold • ₦{item.totalRevenue.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="items-center p-6">
                      <Text variant="muted" className="italic">
                        No sales data found.
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            </View>

            {/* Slowest Moving Products */}
            <View className="mx-5 mb-6">
              <View className="mb-4 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <TrendingDown size={20} color="#F97316" />
                </View>
                <Text variant="h3" className="text-lg">
                  Slowest Moving Products
                </Text>
              </View>

              <Card>
                <CardContent className="gap-0 p-0">
                  {filteredStats.slowestMoving.length > 0 ? (
                    filteredStats.slowestMoving.map((item, index) => (
                      <View
                        key={index}
                        className={cn(
                          'flex-row items-center gap-4 p-4',
                          index !== filteredStats.slowestMoving.length - 1 &&
                            'border-b border-border'
                        )}>
                        <View className="h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                          <Text className="text-xs font-bold text-orange-600">{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="mb-1 font-bold text-foreground">{item.name}</Text>
                          <Text variant="muted" className="text-xs">
                            {item.totalQuantity} sold
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="items-center p-6">
                      <Text variant="muted" className="italic">
                        No data available.
                      </Text>
                    </View>
                  )}
                </CardContent>
              </Card>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Floating FAB */}
      <View className="absolute bottom-8 right-5">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full bg-primary shadow-xl shadow-primary/30"
          onPress={() => console.log('export report')}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={26}
            className="text-primary-foreground"
          />
        </Button>
      </View>
    </SafeAreaView>
  );
}
