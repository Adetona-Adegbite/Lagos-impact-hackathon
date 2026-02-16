import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Dimensions,
  Animated,
  FlatList,
  ImageBackground,
  StatusBar,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScanQrCode, Check, ChevronRight } from 'lucide-react-native';
import { localizationService, t } from '@/utils/localization';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const { width } = Dimensions.get('window');
const SAFE_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;
const IMAGE_MAX = Math.min(width * 0.86, 420);

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  imageUri?: string;
  badgeIcon?: any;
  layout?: 'first' | 'middle' | 'last';
  buttonLabel?: string;
};

const slides: Slide[] = [
  {
    key: 's1',
    title: 'Scan & Stock\nInstantly',
    subtitle:
      'Turn your phone into a powerful barcode scanner. Add items to your shop inventory in seconds without typing.',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqt58rvyp6HdJluW7dRUQCGJKxu30K5vDflSM4nztJm_cZ9cyh9b3z2p_iy_u4hNgQXU60Wkp04_GL3tZDaf83aT978NTUcEKAbvZ5GTvvfYWxul_b_Dy2aqRJIsENkvUxZXH0Am-pVv79jtlekFSW5Rycv95YXIPjBrj9rbt8AtCAWkzN4HMOK_A2rs94q875WHHud7ZkPMYSYHBdybGDMusD6hB9e-Bu4xCzw0Bf7p4i44LkWFQnmXtx797i9lQatUjLoHT-cew',
    badgeIcon: ScanQrCode,
    layout: 'first',
  },
  {
    key: 's2',
    title: 'Real-time Tracking',
    subtitle:
      'Scan items as they arrive. Watch your stock levels update instantly so you never miss a sale.',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGPq6LGLDGLAd-Cr5fdmiyuZ4nKAxAHebeR8sgbxWfnYesEntn8O_4A-TVZmVJry-pQv7UBGxmWlXIgVxxilQzTHzmJGTQreF1nRgyJahQjr9owItBXMgHtRYUlZym3MDG6WULCWG_B59nV6kawo3bmiuqEEXXInKMkIDphcXImWs-Aw5rUShnkoqGU21tDlUFVyWCUgQvXfMyJHQvLzJJE1n78UmNlSfNwD9Hoao9yOWrB-_jUDrXfQp8Zj6zqac_hdu7k04WdLo',
    badgeIcon: Check,
    layout: 'middle',
  },
  {
    key: 's3',
    title: 'Sell Faster',
    subtitle:
      'Stop doing mental math. Scan products to automatically calculate totals and give customers their change in seconds.',
    imageUri:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgGbSmUk7DpU6SUOGr_NdKZQvqHXfeb2cl2RyVF70JyBePcM77YYSaBPMQy3DTN8f8GwKEWYLWF5M6RAQkAAoN7oHv1RKwdkpZovkpFnuLD4gOdHnptkMDz3vKkxnVcPQ3A6H0i6bDg2-UzLdn_odqU1xZbGF1W6ZsUOCRgNjMzi15lu2_lykByv1wL1TdrUVtVH07dDVFo5uwCMR4rsHp2O7hLJjvRKqkvp3vMqym1qY-217Rn0QHwhoqP6GSmpsomFj_HwU4kSw',
    badgeIcon: Check,
    layout: 'last',
    buttonLabel: 'Get Started',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState(localizationService.getCurrentLanguage());
  const [languageSelected, setLanguageSelected] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const init = async () => {
      await localizationService.initialize();
      const savedLanguage = await localizationService.getLanguage();
      if (savedLanguage) {
        setLanguage(savedLanguage);
        setLanguageSelected(true);
      }
    };
    init();
  }, []);

  const handleSetLanguage = async (lang: string) => {
    await localizationService.setLanguage(lang);
    setLanguage(lang);
    setLanguageSelected(true);
  };

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef<FlatList<any> | null>(null);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
  });

  const onMomentum = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const skipToEnd = () => {
    flatRef.current?.scrollToIndex({ index: slides.length - 1 });
    setIndex(slides.length - 1);
  };

  if (!languageSelected) {
    return (
      <View className="flex-1 justify-center bg-background p-5">
        <View className="px-5">
          <Text variant="h1" className="mb-2 text-center">
            {t('welcome')}
          </Text>
          <Text variant="p" className="mb-8 text-center text-muted-foreground">
            {t('selectLanguage')}
          </Text>
          <Button onPress={() => handleSetLanguage('en')} className="mb-4 h-14 rounded-full">
            <Text className="text-lg font-bold text-primary-foreground">{t('english')}</Text>
          </Button>
          <Button
            onPress={() => handleSetLanguage('pcm')}
            variant="outline"
            className="h-14 rounded-full border-primary">
            <Text className="text-lg font-bold text-primary">{t('pidgin')}</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Top Bar */}
      <View
        style={{ paddingTop: SAFE_TOP }}
        className="h-24 flex-row items-center justify-between px-5">
        <View className="w-12" />
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold tracking-wider text-primary">Supamart</Text>
        </View>
        <Pressable onPress={skipToEnd} hitSlop={8} className="w-16 items-end">
          <Text className="font-semibold text-foreground opacity-50">Skip</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentum}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          const isFirst = item.layout === 'first';
          const isMiddle = item.layout === 'middle';
          const isLast = item.layout === 'last';

          return (
            <View style={{ width }} className="flex-1 justify-center">
              <View className="flex-1 items-center justify-center">
                <View
                  style={{ width: IMAGE_MAX, height: IMAGE_MAX }}
                  className="relative mb-5 self-center rounded-[28px]">
                  <View className="absolute -inset-10 scale-90 rounded-full bg-primary/5" />

                  <ImageBackground
                    source={item.imageUri ? { uri: item.imageUri } : undefined}
                    className="flex-1 overflow-hidden rounded-[28px]"
                    imageStyle={{ resizeMode: 'cover' }}>
                    <View className="absolute inset-0 bg-background/35" pointerEvents="none" />

                    <View className="absolute inset-0 items-center justify-center">
                      <View
                        style={{ width: IMAGE_MAX * 0.58, height: IMAGE_MAX * 0.58 }}
                        className="relative items-center justify-center rounded-2xl border-2 border-primary/45">
                        <View className="absolute left-[-2px] top-[-2px] h-3 w-3 border-l-4 border-t-4 border-primary" />
                        <View className="absolute right-[-2px] top-[-2px] h-3 w-3 border-r-4 border-t-4 border-primary" />
                        <View className="absolute bottom-[-2px] left-[-2px] h-3 w-3 border-b-4 border-l-4 border-primary" />
                        <View className="absolute bottom-[-2px] right-[-2px] h-3 w-3 border-b-4 border-r-4 border-primary" />
                        <View className="absolute top-1/2 h-[3px] w-full bg-primary opacity-90" />
                      </View>
                    </View>

                    {isMiddle && (
                      <View className="absolute bottom-4 left-4 right-4 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-3">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                          <Check size={18} color="#000" strokeWidth={3} />
                        </View>
                        <View className="flex-1">
                          <View className="mb-2 h-2 w-24 rounded-md bg-white/90" />
                          <View className="h-2 w-14 rounded-md bg-white/40" />
                        </View>
                        <Text className="ml-2 font-bold text-primary">+12</Text>
                      </View>
                    )}

                    {isLast && (
                      <View className="absolute bottom-5 left-3 right-3 rounded-xl border border-white/5 bg-background/80 p-3">
                        <View className="flex-row items-center">
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                            <Check size={18} color="#000" strokeWidth={3} />
                          </View>
                          <View className="ml-3">
                            <Text className="text-[10px] font-bold uppercase text-primary">
                              Scanned
                            </Text>
                            <Text className="text-sm font-bold text-foreground">
                              Indomie 70g (Carton)
                            </Text>
                          </View>
                        </View>
                        <View className="mt-2 flex-row items-center justify-between">
                          <Text className="text-xs text-muted-foreground">Unit Price</Text>
                          <Text className="text-xl font-extrabold text-foreground">₦5,200</Text>
                        </View>
                      </View>
                    )}
                  </ImageBackground>

                  {item.badgeIcon && isFirst && (
                    <View className="absolute -bottom-2 right-6 rounded-2xl border-4 border-background bg-primary p-3 shadow-lg">
                      <item.badgeIcon size={24} color="#000" strokeWidth={2.5} />
                    </View>
                  )}
                </View>

                <View className="items-center px-7">
                  <Text variant="h1" className="mb-3 text-center leading-tight">
                    {item.title.split('\n').map((line, idx) => (
                      <Text key={idx} className={cn(line.includes('Instantly') && 'text-primary')}>
                        {line}
                        {idx !== item.title.split('\n').length - 1 ? '\n' : ''}
                      </Text>
                    ))}
                  </Text>
                  <Text variant="p" className="text-center leading-relaxed text-muted-foreground">
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Footer */}
      <View className="bg-transparent px-5 pb-10 pt-2">
        {slides[index].layout === 'first' && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {slides.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-300',
                    i === index ? 'w-8 bg-primary' : 'w-2.5 bg-muted'
                  )}
                />
              ))}
            </View>
            <Button onPress={goNext} size="icon" className="h-14 w-14 rounded-full p-0">
              <ChevronRight size={24} color="#000" strokeWidth={3} />
            </Button>
          </View>
        )}

        {slides[index].layout === 'middle' && (
          <View className="items-center gap-4">
            <View className="mb-1 flex-row items-center gap-2">
              {slides.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-300',
                    i === index ? 'w-8 bg-primary' : 'w-2.5 bg-muted'
                  )}
                />
              ))}
            </View>
            <Button onPress={goNext} className="h-14 w-full flex-row gap-2 rounded-full">
              <Text className="text-base font-extrabold uppercase tracking-tight text-primary-foreground">
                {t('continue')}
              </Text>
              <ChevronRight size={20} color="#000" strokeWidth={3} />
            </Button>
          </View>
        )}

        {slides[index].layout === 'last' && (
          <View className="items-center gap-4">
            <View className="mb-1 flex-row items-center gap-2">
              {slides.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  className={cn(
                    'h-2.5 rounded-full transition-all duration-300',
                    i === index ? 'w-8 bg-primary' : 'w-2.5 bg-muted'
                  )}
                />
              ))}
            </View>
            <Button onPress={goNext} className="h-14 w-full rounded-full">
              <Text className="text-base font-black uppercase tracking-tighter text-primary-foreground">
                {t('continue')}
              </Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
