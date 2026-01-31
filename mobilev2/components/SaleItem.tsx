import React from 'react';
import { View, Pressable } from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { t } from '@/utils/localization';
import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';

export interface Sale {
  id: string;
  title?: string;
  itemCount: number;
  createdAt: string;
  totalAmount: number;
  paymentMethod?: string;
}

interface SaleItemProps {
  item: Sale;
}

export const SaleItem = ({ item }: SaleItemProps) => {
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/receipt',
          params: { id: item.id },
        })
      }>
      <Card className="mb-3 flex-row items-center border-border/50 bg-secondary/50 p-4">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-background">
          <ShoppingCart size={20} className="text-muted-foreground" />
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-sm font-black text-foreground">
            {item.title || t('sale')}
            {item.itemCount > 1 && ` +${item.itemCount - 1} ${t('items')}`}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-2">
            <Text variant="muted" className="text-[10px] font-bold">
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <View className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <Text variant="muted" className="text-[10px] font-bold uppercase tracking-tight">
              {item.paymentMethod || 'Cash'}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-black text-primary">
            ₦{item.totalAmount.toLocaleString()}
          </Text>
          <View className="mt-1 rounded-md bg-primary/10 px-2 py-0.5">
            <Text className="text-[9px] font-black uppercase text-primary">Paid</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};
