import React, { useEffect, useState } from 'react';
import { View, Modal, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Barcode, Sparkles, ChevronDown, Minus, Plus } from 'lucide-react-native';
import RNPickerSelect from 'react-native-picker-select';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { t } from '@/utils/localization';

export interface ProductFormData {
  name: string;
  barcode: string;
  sellingPrice: number;
  purchasePrice: number;
  category: string;
  quantity: number;
}

interface ProductFormModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: ProductFormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
  isNewProduct: boolean;
  categories: string[];
  onRecommendCategory?: (name: string) => Promise<string | undefined>;
}

export function ProductFormModal({
  visible,
  onClose,
  onConfirm,
  initialData,
  isNewProduct,
  categories: initialCategories,
  onRecommendCategory,
}: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      setName(initialData.name || '');
      setBarcode(initialData.barcode || '');
      setSellingPrice(initialData.sellingPrice?.toString() || '');
      setPurchasePrice(initialData.purchasePrice?.toString() || '');
      setCategory(initialData.category || '');
      setQuantity(initialData.quantity || 0);
    }
  }, [visible, initialData]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({
        name,
        barcode,
        sellingPrice: parseFloat(sellingPrice) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        category,
        quantity,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggest = async () => {
    if (!onRecommendCategory) return;
    const suggested = await onRecommendCategory(name);
    if (suggested) {
      setCategory(suggested);
      if (!categories.includes(suggested)) {
        setCategories((prev) => [...prev, suggested]);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1 items-center justify-center bg-black/60 p-6">
        <Card className="max-h-[90%] w-full rounded-[32px] border border-border bg-background p-6 shadow-2xl">
          <Text variant="h3" className="mb-2 font-black text-foreground">
            {isNewProduct ? t('addItem') : t('editProduct')}
          </Text>
          <View className="mb-6 flex-row items-center gap-2 self-start rounded-xl bg-primary/10 px-3 py-1.5">
            <Barcode size={14} className="text-primary" />
            <Text className="text-[11px] font-black uppercase text-primary">{barcode}</Text>
          </View>

          <FlatList
            data={[1]}
            keyExtractor={() => 'form'}
            showsVerticalScrollIndicator={false}
            renderItem={() => (
              <View className="gap-5 pb-4">
                <View>
                  <View className="mb-2 px-1">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Product Name
                    </Text>
                  </View>
                  <Input
                    className="h-14 rounded-2xl border-border bg-secondary text-base font-bold"
                    placeholder="e.g. Coca-Cola 50cl"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t('sellingPrice')}
                    </Text>
                    <View className="relative">
                      <Text className="absolute left-3 top-1/2 z-10 translate-y-[-50%] text-base font-bold text-foreground">
                        ₦
                      </Text>
                      <Input
                        className="h-14 rounded-2xl border-border bg-secondary pl-8 text-base font-bold"
                        keyboardType="numeric"
                        value={sellingPrice}
                        onChangeText={setSellingPrice}
                      />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t('costPrice')}
                    </Text>
                    <View className="relative">
                      <Text className="absolute left-3 top-1/2 z-10 translate-y-[-50%] text-base font-bold text-foreground">
                        ₦
                      </Text>
                      <Input
                        className="h-14 rounded-2xl border-border bg-secondary pl-8 text-base font-bold text-muted-foreground"
                        keyboardType="numeric"
                        value={purchasePrice}
                        onChangeText={setPurchasePrice}
                      />
                    </View>
                  </View>
                </View>

                <View>
                  <View className="mb-2 flex-row items-center justify-between px-1">
                    <Text className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {t('category')}
                    </Text>
                    {onRecommendCategory && (
                      <Pressable className="flex-row items-center gap-1" onPress={handleSuggest}>
                        <Sparkles size={12} color="white" />
                        <Text className="text-[10px] font-bold text-primary">{t('suggest')}</Text>
                      </Pressable>
                    )}
                  </View>
                  <View className="relative h-14 justify-center overflow-hidden rounded-2xl border border-border bg-secondary px-4">
                    <RNPickerSelect
                      onValueChange={(v) => setCategory(v)}
                      items={categories.map((c) => ({ label: c, value: c }))}
                      value={category}
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
                          className="absolute right-4 top-1/2 translate-y-[-50%] text-muted-foreground"
                        />
                      )}
                    />
                  </View>
                </View>

                <View>
                  <Text className="mb-2 px-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {t('currentStock')}
                  </Text>
                  <View className="flex-row items-center justify-between rounded-2xl border border-border bg-secondary p-3">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-12 w-12 rounded-xl border border-border bg-background shadow-sm"
                      onPress={() => setQuantity((q) => Math.max(0, q - 1))}>
                      <Minus size={20} color="white" />
                    </Button>
                    <View className="flex-1 items-center">
                      <Input
                        className="h-10 w-full border-0 bg-transparent text-center text-2xl font-black text-foreground"
                        keyboardType="numeric"
                        value={quantity.toString()}
                        onChangeText={(v) => {
                          const clean = v.replace(/[^0-9]/g, '');
                          setQuantity(clean ? parseInt(clean, 10) : 0);
                        }}
                      />
                      <Text className="text-[9px] font-bold uppercase text-muted-foreground">
                        {t('units')}
                      </Text>
                    </View>
                    <Button
                      className="h-12 w-12 rounded-xl bg-primary shadow-sm"
                      size="icon"
                      onPress={() => setQuantity((q) => q + 1)}>
                      <Plus size={20} color="#000" />
                    </Button>
                  </View>
                </View>
              </View>
            )}
          />

          <View className="mt-4 flex-row gap-3">
            <Button variant="outline" className="h-14 flex-1 rounded-2xl" onPress={onClose}>
              <Text className="font-bold">{t('cancel')}</Text>
            </Button>
            <Button
              className="flex-2 h-14 rounded-2xl bg-primary"
              onPress={handleConfirm}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="font-black uppercase tracking-tight text-primary-foreground">
                  {isNewProduct ? t('addItem') : t('saveChanges')}
                </Text>
              )}
            </Button>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}
