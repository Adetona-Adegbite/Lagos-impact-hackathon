import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  Image,
  FlatList,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Bell,
  Package,
  AlertTriangle,
  Plus,
  ChevronRight,
  ImageIcon,
} from 'lucide-react-native';
import { productService } from '@/services/productService';
import { t } from '@/utils/localization';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

type UIProduct = {
  id: string;
  title: string;
  category: string;
  price: number;
  qty: number;
  img?: string;
  lowStock?: boolean;
};

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(params.filter || 'All Items');
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveFilter(params.filter || 'All Items');
  }, [params.filter]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const dbProducts = await productService.getAllProducts();

      const mappedProducts: UIProduct[] = dbProducts.map((p) => ({
        id: p.id,
        title: p.name,
        category: p.category,
        price: p.sellingPrice,
        qty: p.quantity || 0,
        lowStock: (p.quantity || 0) <= 3,
        img: undefined,
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.lowStock).length;
  }, [products]);

  const filters = useMemo(() => {
    const categories = Array.from(new Set(products.map((p) => p.category))).sort();
    return [
      { key: 'All Items', label: t('allItems') },
      { key: 'Low Stock', label: t('lowStock') },
      ...categories.map((cat) => {
        const key = cat
          .replace(/ & /g, ' And ')
          .replace(/\//g, ' ')
          .replace(/[(),]/g, '')
          .split(/\s+/)
          .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
          .join('');
        const label = t(key as any);
        return { key: cat, label: label === key ? cat : label };
      }),
    ];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeFilter === 'Low Stock') return p.lowStock;
      if (activeFilter !== 'All Items') {
        if (p.category !== activeFilter) return false;
      }
      if (!q) return true;
      return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [query, activeFilter, products]);

  const renderProduct = ({ item }: { item: UIProduct }) => (
    <Pressable onPress={() => router.push(`/product/${item.id}`)}>
      <Card className="mb-3 flex-row items-center border-border/50 bg-secondary/50 p-3">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-background">
          {item.img ? (
            <Image source={{ uri: item.img }} className="h-full w-full" resizeMode="cover" />
          ) : (
            <ImageIcon size={24} className="text-muted-foreground/30" />
          )}
        </View>

        <View className="ml-4 flex-1 justify-center">
          <Text className="text-sm font-black text-foreground" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {item.category}
          </Text>
          <Text className="mt-1 font-black text-primary">₦{item.price.toLocaleString()}</Text>
        </View>

        <View className="items-end">
          <View
            className={cn(
              'flex-row items-center gap-1.5 rounded-full px-3 py-1.5',
              item.lowStock ? 'bg-destructive/10' : 'bg-primary/10'
            )}>
            {item.lowStock ? (
              <AlertTriangle size={12} className="text-destructive" />
            ) : (
              <View className="h-2 w-2 rounded-full bg-primary" />
            )}
            <Text
              className={cn(
                'text-[10px] font-black uppercase',
                item.lowStock ? 'text-destructive' : 'text-primary'
              )}>
              {item.qty} {t('quantity')}
            </Text>
          </View>
          <View className="mt-2">
            <ChevronRight size={18} className="text-muted-foreground/50" />
          </View>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScreenHeader
        title={t('inventory')}
        rightAdornment={
          <Button variant="secondary" size="icon" className="h-10 w-10 rounded-full bg-secondary">
            <Bell size={20} color="white" />
            <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        }
      />

      {/* Search & Filter */}
      <View className="gap-4 px-5 pt-4">
        <View className="h-12 flex-row items-center rounded-2xl border border-border bg-secondary px-4">
          <Search size={18} className="text-muted-foreground" />
          <TextInput
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#6b7280"
            className="ml-3 h-full flex-1 font-bold text-foreground"
            value={query}
            onChangeText={setQuery}
          />
          <Pressable>
            <SlidersHorizontal size={18} className="text-muted-foreground" />
          </Pressable>
        </View>

        {/* Filter Chips */}
        <View className="h-10">
          <FlatList
            horizontal
            data={filters}
            keyExtractor={(i) => i.key}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const active = item.key === activeFilter;
              return (
                <Pressable
                  onPress={() => setActiveFilter(item.key)}
                  className={cn(
                    'mr-2 h-9 flex-row items-center rounded-full border px-4',
                    active ? 'border-primary bg-primary' : 'border-border bg-secondary/50'
                  )}>
                  <Text
                    className={cn(
                      'text-xs font-black',
                      active ? 'text-primary-foreground' : 'text-muted-foreground'
                    )}>
                    {item.label}
                  </Text>
                  {item.key === 'Low Stock' && (
                    <View
                      className={cn(
                        'ml-2 rounded-full px-1.5 py-0.5',
                        active ? 'bg-primary-foreground/20' : 'bg-destructive/20'
                      )}>
                      <Text
                        className={cn(
                          'text-[10px] font-black',
                          active ? 'text-primary-foreground' : 'text-destructive'
                        )}>
                        {lowStockCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>

      {/* List */}
      <View className="flex-1 px-5 pt-4">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#36e27b" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(p) => p.id}
            renderItem={renderProduct}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="mt-4 items-center rounded-3xl border border-dashed border-border bg-secondary/20 py-20">
                <Package size={48} className="mb-3 text-muted-foreground/20" />
                <Text variant="p" className="text-center font-bold text-muted-foreground">
                  {t('noProductsFound')}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <View className="absolute bottom-10 left-5 right-5 shadow-2xl shadow-primary/40">
        <Button
          onPress={() =>
            router.push({
              pathname: '/sales',
              params: { initialMode: 'stock' },
            })
          }
          className="h-16 flex-row gap-2 rounded-full bg-primary">
          <Plus size={24} color="#000" strokeWidth={3} />
          <Text className="text-lg font-black uppercase tracking-tight text-primary-foreground">
            {t('addItem')}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
