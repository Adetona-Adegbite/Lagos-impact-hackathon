import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Dimensions,
  Animated,
  FlatList,
  ImageBackground,
  StatusBar,
  Platform,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ChevronRight, Check, ScanQrCode } from "lucide-react-native";
import { localizationService, t } from "../../utils/localization";
import { Button } from "../../components/ui/button";
import { Text } from "../../components/ui/text";
import { cn } from "../../lib/utils";

const { width } = Dimensions.get("window");
const SAFE_TOP =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;
const IMAGE_MAX = Math.min(width * 0.86, 420);

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  imageUri?: string;
  badgeIcon?: any;
  layout?: "first" | "middle" | "last";
  buttonLabel?: string;
};

const slides: Slide[] = [
  {
    key: "s1",
    title: "Scan & Stock\nInstantly",
    subtitle:
      "Turn your phone into a powerful barcode scanner. Add items to your shop inventory in seconds without typing.",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDqt58rvyp6HdJluW7dRUQCGJKxu30K5vDflSM4nztJm_cZ9cyh9b3z2p_iy_u4hNgQXU60Wkp04_GL3tZDaf83aT978NTUcEKAbvZ5GTvvfYWxul_b_Dy2aqRJIsENkvUxZXH0Am-pVv79jtlekFSW5Rycv95YXIPjBrj9rbt8AtCAWkzN4HMOK_A2rs94q875WHHud7ZkPMYSYHBdybGDMusD6hB9e-Bu4xCzw0Bf7p4i44LkWFQnmXtx797i9lQatUjLoHT-cew",
    badgeIcon: ScanQrCode,
    layout: "first",
  },
  {
    key: "s2",
    title: "Real-time Tracking",
    subtitle:
      "Scan items as they arrive. Watch your stock levels update instantly so you never miss a sale.",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCGPq6LGLDGLAd-Cr5fdmiyuZ4nKAxAHebeR8sgbxWfnYesEntn8O_4A-TVZmVJry-pQv7UBGxmWlXIgVxxilQzTHzmJGTQreF1nRgyJahQjr9owItBXMgHtRYUlZym3MDG6WULCWG_B59nV6kawo3bmiuqEEXXInKMkIDphcXImWs-Aw5rUShnkoqGU21tDlUFVyWCUgQvXfMyJHQvLzJJE1n78UmNlSfNwD9Hoao9yOWrB-_jUDrXfQp8Zj6zqac_hdu7k04WdLo",
    badgeIcon: Check,
    layout: "middle",
  },
  {
    key: "s3",
    title: "Sell Faster",
    subtitle:
      "Stop doing mental math. Scan products to automatically calculate totals and give customers their change in seconds.",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgGbSmUk7DpU6SUOGr_NdKZQvqHXfeb2cl2RyVF70JyBePcM77YYSaBPMQy3DTN8f8GwKEWYLWF5M6RAQkAAoN7oHv1RKwdkpZovkpFnuLD4gOdHnptkMDz3vKkxnVcPQ3A6H0i6bDg2-UzLdn_odqU1xZbGF1W6ZsUOCRgNjMzi15lu2_lykByv1wL1TdrUVtVH07dDVFo5uwCMR4rsHp2O7hLJjvRKqkvp3vMqym1qY-217Rn0QHwhoqP6GSmpsomFj_HwU4kSw",
    badgeIcon: Check,
    layout: "last",
    buttonLabel: "Get Started",
  },
];

export default function OnboardingScreen({ navigation }: { navigation?: any }) {
  const [language, setLanguage] = useState(
    localizationService.getCurrentLanguage(),
  );
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

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onMomentum = (e: any) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: index + 1 });
      setIndex(index + 1);
    } else {
      navigation?.navigate?.("LoginScreen") ??
        console.log("onboarding finished");
    }
  };

  const skipToEnd = () => {
    flatRef.current?.scrollToIndex({ index: slides.length - 1 });
    setIndex(slides.length - 1);
  };

  if (!languageSelected) {
    return (
      <View className="flex-1 bg-background justify-center p-5">
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />
        <View className="px-5">
          <Text variant="h1" className="text-center mb-2">
            {t("welcome")}
          </Text>
          <Text variant="p" className="text-center text-muted-foreground mb-8">
            {t("selectLanguage")}
          </Text>
          <Button
            label={t("english")}
            onPress={() => handleSetLanguage("en")}
            className="mb-4 rounded-full h-14"
            labelClasses="font-bold text-lg"
          />
          <Button
            label={t("pidgin")}
            onPress={() => handleSetLanguage("pcm")}
            variant="outline"
            className="rounded-full h-14 border-primary"
            labelClasses="font-bold text-lg text-primary"
          />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Top Bar */}
      <View
        style={{ paddingTop: SAFE_TOP }}
        className="flex-row items-center justify-between px-5 h-24"
      >
        <View className="w-12" />
        <View className="flex-1 items-center">
          <Text className="text-primary font-bold text-lg tracking-wider">
            Supamart
          </Text>
        </View>
        <Pressable onPress={skipToEnd} hitSlop={8} className="w-16 items-end">
          <Text className="text-foreground opacity-50 font-semibold">Skip</Text>
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
          const isFirst = item.layout === "first";
          const isMiddle = item.layout === "middle";
          const isLast = item.layout === "last";

          return (
            <View style={{ width }} className="flex-1 justify-center">
              <View className="flex-1 items-center justify-center">
                {/* Image Area */}
                <View
                  style={{ width: IMAGE_MAX, height: IMAGE_MAX }}
                  className="rounded-[28px] mb-5 self-center relative"
                >
                  {/* Glow Behind */}
                  <View className="absolute -inset-10 bg-primary/5 rounded-full scale-90" />

                  <ImageBackground
                    source={item.imageUri ? { uri: item.imageUri } : undefined}
                    className="flex-1 overflow-hidden rounded-[28px]"
                    imageStyle={{ resizeMode: "cover" }}
                  >
                    <View
                      className="absolute inset-0 bg-background/35"
                      pointerEvents="none"
                    />

                    {/* Scan Mock */}
                    <View className="absolute inset-0 items-center justify-center">
                      <View
                        style={{
                          width: IMAGE_MAX * 0.58,
                          height: IMAGE_MAX * 0.58,
                        }}
                        className="rounded-2xl border-2 border-primary/45 relative items-center justify-center"
                      >
                        <View className="absolute top-[-2px] left-[-2px] w-3 h-3 border-t-4 border-l-4 border-primary" />
                        <View className="absolute top-[-2px] right-[-2px] w-3 h-3 border-t-4 border-r-4 border-primary" />
                        <View className="absolute bottom-[-2px] left-[-2px] w-3 h-3 border-b-4 border-l-4 border-primary" />
                        <View className="absolute bottom-[-2px] right-[-2px] w-3 h-3 border-b-4 border-r-4 border-primary" />
                        <View className="absolute w-full h-[3px] bg-primary opacity-90 top-1/2" />
                      </View>
                    </View>

                    {/* Middle Slide Floating Card */}
                    {isMiddle && (
                      <View className="absolute bottom-4 left-4 right-4 bg-white/10 rounded-2xl p-3 border border-white/10 flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                          <Check size={18} color="#000" strokeWidth={3} />
                        </View>
                        <View className="flex-1">
                          <View className="h-2 w-24 bg-white/90 rounded-md mb-2" />
                          <View className="h-2 w-14 bg-white/40 rounded-md" />
                        </View>
                        <Text className="text-primary font-bold ml-2">+12</Text>
                      </View>
                    )}

                    {/* Last Slide Floating Card */}
                    {isLast && (
                      <View className="absolute bottom-5 left-3 right-3 rounded-xl p-3 bg-background/80 border border-white/5">
                        <View className="flex-row items-center">
                          <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                            <Check size={18} color="#000" strokeWidth={3} />
                          </View>
                          <View className="ml-3">
                            <Text className="text-[10px] text-primary font-bold uppercase">
                              Scanned
                            </Text>
                            <Text className="text-foreground text-sm font-bold">
                              Indomie 70g (Carton)
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row justify-between mt-2 items-center">
                          <Text className="text-muted-foreground text-xs">
                            Unit Price
                          </Text>
                          <Text className="text-foreground text-xl font-extrabold">
                            ₦5,200
                          </Text>
                        </View>
                      </View>
                    )}
                  </ImageBackground>

                  {/* Badge Icon (First Screen) */}
                  {item.badgeIcon && isFirst && (
                    <View className="absolute right-6 -bottom-2 bg-primary p-3 rounded-2xl border-4 border-background shadow-lg">
                      <item.badgeIcon
                        size={24}
                        color="#000"
                        strokeWidth={2.5}
                      />
                    </View>
                  )}
                </View>

                {/* Text Block */}
                <View className="px-7 items-center">
                  <Text variant="h1" className="text-center mb-3 leading-tight">
                    {item.title.split("\n").map((line, idx) => (
                      <Text
                        key={idx}
                        className={cn(
                          line.includes("Instantly") && "text-primary",
                        )}
                      >
                        {line}
                        {idx !== item.title.split("\n").length - 1 ? "\n" : ""}
                      </Text>
                    ))}
                  </Text>
                  <Text
                    variant="p"
                    className="text-center text-muted-foreground leading-relaxed"
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Footer */}
      <View className="px-5 pb-10 pt-2 bg-transparent">
        {slides[index].layout === "first" && (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              {slides.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-primary" : "w-2.5 bg-muted",
                  )}
                />
              ))}
            </View>
            <Button
              onPress={goNext}
              className="w-14 h-14 rounded-full p-0"
              children={<ChevronRight size={24} color="#000" strokeWidth={3} />}
            />
          </View>
        )}

        {slides[index].layout === "middle" && (
          <View className="items-center gap-4">
            <View className="flex-row items-center gap-2 mb-1">
              {slides.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-primary" : "w-2.5 bg-muted",
                  )}
                />
              ))}
            </View>
            <Button
              onPress={goNext}
              className="w-full h-14 rounded-full flex-row gap-2"
            >
              <Text className="text-primary-foreground font-extrabold text-base uppercase tracking-tight">
                {t("continue")}
              </Text>
              <ChevronRight size={20} color="#000" strokeWidth={3} />
            </Button>
          </View>
        )}

        {slides[index].layout === "last" && (
          <View className="items-center gap-4">
            <View className="flex-row items-center gap-2 mb-1">
              {slides.map((_, i) => (
                <View
                  key={`dot-${i}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-primary" : "w-2.5 bg-muted",
                  )}
                />
              ))}
            </View>
            <Button onPress={goNext} className="w-full h-14 rounded-full">
              <Text className="text-primary-foreground font-black text-base uppercase tracking-tighter">
                {t("continue")}
              </Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
