import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Image, ScrollView, FlatList, Dimensions, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bell,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Package,
  ShoppingCart,
  History,
  Sparkles,
  ArrowRight,
  Landmark,
  ChevronRight,
} from 'lucide-react-native';
import { productService } from '@/services/productService';
import { authStorage } from '@/services/authStorage';
import { syncEngine } from '@/services/sync/SyncEngine';
import { t } from '@/utils/localization';
import { SaleItem } from '@/components/SaleItem';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.round(width * 0.62);

type StatCard = {
  id: string;
  title: string;
  value: string;
  icon: any;
  color: string;
  hint?: string;
  onPress?: () => void;
};

export default function RetailHomeScreen() {
  const router = useRouter();
  const [shopName, setShopName] = useState('My Shop');
  const [stats, setStats] = useState({
    todaySales: 0,
    lowStock: 0,
    totalItems: 0,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const { colorScheme } = useColorScheme();

  const ACTIONS = [
    {
      id: 'a1',
      title: t('newSale'),
      subtitle: t('recordTransaction'),
      icon: ShoppingCart,
      primary: true,
      route: '/sales' as const,
    },
    {
      id: 'a2',
      title: t('inventory'),
      subtitle: t('manageStock'),
      icon: Package,
      route: '/inventory' as const,
    },
    {
      id: 'a3',
      title: t('report'),
      subtitle: t('businessAnalytics'),
      icon: TrendingUp,
      route: '/(tabs)/reports' as const,
    },
    {
      id: 'a4',
      title: t('allSales'),
      subtitle: t('viewSalesHistory'),
      icon: History,
      route: '/all-sales' as const,
    },
    // {
    //   id: 'a5',
    //   title: t('aiCreditScore'),
    //   subtitle: t('loanReadyInsights'),
    //   icon: CreditCard,
    //   route: '/credit-profile' as const,
    // },
    // {
    //   id: 'a6',
    //   title: t('taxInsights'),
    //   subtitle: t('quickTaxReports'),
    //   icon: Landmark,
    //   route: '/tax-insights' as const,
    // },
  ];

  const fetchData = useCallback(async () => {
    try {
      await syncEngine.triggerSync();
      const authData = await authStorage.getAuthData();
      if (authData?.user?.shopName) {
        setShopName(authData.user.shopName);
      }

      const dashboardStats = await productService.getDashboardStats();
      setStats({
        todaySales: dashboardStats.todaySales,
        lowStock: dashboardStats.lowStockCount,
        totalItems: dashboardStats.totalItemsCount,
      });

      const recent = await productService.getRecentSales();
      setRecentSales(recent);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const statCards: StatCard[] = [
    {
      id: 's1',
      title: t('todaysSales'),
      value: `₦${stats.todaySales.toLocaleString()}`,
      icon: CreditCard,
      color: 'text-primary',
      onPress: () => router.push('/all-sales'),
    },
    {
      id: 's2',
      title: t('lowStock'),
      value: `${stats.lowStock} ${t('items')}`,
      icon: AlertTriangle,
      color: 'text-orange-500',
      onPress: () => router.push({ pathname: '/inventory', params: { filter: 'Low Stock' } }),
    },
    {
      id: 's3',
      title: t('totalItems'),
      value: `${stats.totalItems}`,
      icon: Package,
      color: 'text-blue-400',
      onPress: () => router.push('/inventory'),
    },
  ];

  const renderStat = ({ item }: { item: StatCard }) => (
    <Pressable onPress={item.onPress}>
      <Card style={{ width: CARD_WIDTH }} className="mr-3 border-border bg-secondary p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View className={cn('h-11 w-11 items-center justify-center rounded-xl bg-background/50')}>
            <item.icon size={22} className={item.color} />
          </View>
          {item.hint && (
            <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
              <TrendingUp size={12} className="text-primary" />
              <Text className="text-[10px] font-bold text-primary">{item.hint}</Text>
            </View>
          )}
        </View>

        <View>
          <Text variant="muted" className="mb-1 text-xs font-bold uppercase tracking-wider">
            {item.title}
          </Text>
          <Text className="text-2xl font-black text-foreground">{item.value}</Text>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center gap-3">
          <View className="relative">
            <View className="h-12 w-12 overflow-hidden rounded-2xl border-2 border-primary/20">
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB550YN3lKxry9QOC4oNfn0aeV1_1TIjXV7PtMxqTBp_uJQvFNPrSWF9gmqQ3jqpv8T1u44drXmEY4x3UPXpm4SwD2zSqyW2OYhSz1naNXMHb9M18RzshGRIPXbsYl6TOPzluRLQPbJ_vucMcPrPY0Ud4GKXVfIOUiFr8yn8f4HmNKjJ1Edqt4pXFgTpK0-P2UtbkbSGS4-PHJEAoP_66lMleAIMSkc6OpPuT4z2fCMRknEgSCE_lh2kvU8W3zyXkdp40CsdUgceu8',
                }}
                className="h-full w-full"
              />
            </View>
            <View className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary" />
          </View>
          <View>
            <Text variant="muted" className="text-xs font-bold">
              {t('goodMorning')}
            </Text>
            <Text className="text-lg font-black text-foreground">{shopName}</Text>
          </View>
        </View>

        <Button
          variant="secondary"
          size="icon"
          className="relative h-11 w-11 rounded-2xl bg-secondary">
          <Bell size={20} color="white" />
          <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View className="mb-2 mt-4 px-5">
          <Text className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {t('overview')}
          </Text>
        </View>

        <FlatList
          horizontal
          data={statCards}
          keyExtractor={(i) => i.id}
          renderItem={renderStat}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
        />

        <View className="m-5 flex h-[1px] bg-accent" />

        <View className="flex-row flex-wrap gap-3 px-5">
          {ACTIONS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push(a.route as any)}
              className={cn(
                'aspect-square w-[48%] justify-between rounded-[24px] border p-4',
                a.primary
                  ? 'border-primary bg-primary shadow-lg shadow-primary/30'
                  : 'border-border bg-secondary'
              )}>
              <View className="flex-row items-start justify-between">
                <View
                  className={cn(
                    'h-12 w-12 items-center justify-center rounded-2xl',
                    a.primary ? 'bg-white/20' : 'bg-background/40'
                  )}>
                  <a.icon
                    size={28}
                    color={a.primary ? '#000' : colorScheme === 'dark' ? '#fff' : '#444'}
                    strokeWidth={a.primary ? 2.5 : 2}
                  />
                </View>
                <ArrowRight size={18} color={a.primary ? '#000' : '#666'} strokeWidth={3} />
              </View>
              <View>
                <Text
                  className={cn(
                    'text-lg font-black',
                    a.primary ? 'text-primary-foreground' : 'text-foreground'
                  )}>
                  {a.title}
                </Text>
                <Text
                  numberOfLines={1}
                  className={cn(
                    'mt-1 text-[11px] font-bold',
                    a.primary ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                  {a.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Recent Activity */}
        <View className="mt-8 px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text variant="h3" className="font-black text-foreground">
              {t('recentSales')}
            </Text>
            <Pressable onPress={() => router.push('/all-sales')}>
              <ChevronRight size={20} color="#666" />
            </Pressable>
          </View>

          {recentSales.map((r) => (
            <SaleItem key={r.id} item={r} />
          ))}

          {recentSales.length === 0 && (
            <View className="items-center rounded-3xl border border-dashed border-border bg-secondary/30 py-10">
              <History size={40} className="mb-2 text-muted-foreground/30" />
              <Text variant="muted" className="font-bold">
                No recent sales
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button (Alternative New Sale) */}
      <View className="absolute bottom-8 left-5 right-5 shadow-2xl shadow-primary/40">
        <Button
          onPress={() => router.push('/sales')}
          className="h-16 flex-row gap-3 rounded-full bg-primary">
          <ShoppingCart size={24} color="#000" strokeWidth={3} />
          <Text className="text-lg font-black uppercase tracking-tight text-primary-foreground">
            {t('newSale')}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
