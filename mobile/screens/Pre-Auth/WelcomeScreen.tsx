// src/screens/OnboardingScreen.tsx
import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  FlatList,
  ImageBackground,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { localizationService, t } from "../../utils/localization";

const { width, height } = Dimensions.get("window");
const MAIN_GREEN = "#36e27b"; // matches your tailwind primary
const SAFE_TOP =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44;
const IMAGE_MAX = Math.min(width * 0.86, 420);

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  imageUri?: string; // main background image
  badgeIcon?: string; // material icon name
  layout?: "first" | "middle" | "last"; // controls bottom layout
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
    badgeIcon: "qr-code-scanner",
    layout: "first",
  },
  {
    key: "s2",
    title: "Real-time Tracking",
    subtitle:
      "Scan items as they arrive. Watch your stock levels update instantly so you never miss a sale.",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCGPq6LGLDGLAd-Cr5fdmiyuZ4nKAxAHebeR8sgbxWfnYesEntn8O_4A-TVZmVJry-pQv7UBGxmWlXIgVxxilQzTHzmJGTQreF1nRgyJahQjr9owItBXMgHtRYUlZym3MDG6WULCWG_B59nV6kawo3bmiuqEEXXInKMkIDphcXImWs-Aw5rUShnkoqGU21tDlUFVyWCUgQvXfMyJHQvLzJJE1n78UmNlSfNwD9Hoao9yOWrB-_jUDrXfQp8Zj6zqac_hdu7k04WdLo",
    badgeIcon: "check",
    layout: "middle",
  },
  {
    key: "s3",
    title: "Sell Faster",
    subtitle:
      "Stop doing mental math. Scan products to automatically calculate totals and give customers their change in seconds.",
    imageUri:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAgGbSmUk7DpU6SUOGr_NdKZQvqHXfeb2cl2RyVF70JyBePcM77YYSaBPMQy3DTN8f8GwKEWYLWF5M6RAQkAAoN7oHv1RKwdkpZovkpFnuLD4gOdHnptkMDz3vKkxnVcPQ3A6H0i6bDg2-UzLdn_odqU1xZbGF1W6ZsUOCRgNjMzi15lu2_lykByv1wL1TdrUVtVH07dDVFo5uwCMR4rsHp2O7hLJjvRKqkvp3vMqym1qY-217Rn0QHwhoqP6GSmpsomFj_HwU4kSw",
    badgeIcon: "check",
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
    {
      useNativeDriver: false,
    },
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

  const renderDot = (i: number) => {
    // Animated width for active dot
    const widthAnim = scrollX.interpolate({
      inputRange: [(i - 1) * width, i * width, (i + 1) * width],
      outputRange: [8, i === index ? 32 : 8, 8],
      extrapolate: "clamp",
    });
    const bg = scrollX.interpolate({
      inputRange: [(i - 1) * width, i * width, (i + 1) * width],
      outputRange: ["#CFCFCF", MAIN_GREEN, "#CFCFCF"],
      extrapolate: "clamp",
    });
    if (!languageSelected) {
      return (
        <View style={[styles.container, { justifyContent: "center" }]}>
          <StatusBar
            barStyle="dark-content"
            translucent
            backgroundColor="transparent"
          />
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={styles.titleText}>{t("welcome")}</Text>
            <Text style={[styles.subtitleText, { marginBottom: 30 }]}>
              {t("selectLanguage")}
            </Text>
            <TouchableOpacity
              style={[styles.primaryFullBtn, { marginBottom: 15 }]}
              onPress={() => handleSetLanguage("en")}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryFullBtnText}>{t("english")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryFullBtn}
              onPress={() => handleSetLanguage("pcm")}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryFullBtnText}>{t("pidgin")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <Animated.View
        key={`dot-${i}`}
        style={[
          styles.dot,
          {
            width: widthAnim,
            backgroundColor: i === index ? MAIN_GREEN : "#CFCFCF",
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      {/* Top bar: logo center + skip right */}
      <View style={styles.topBar}>
        <View style={styles.topLeftPlaceholder} />
        <View style={styles.logoCenter}>
          {/* replace with Image if you have a logo */}
          <Text style={styles.logoText}>Supamart</Text>
        </View>
        <Pressable onPress={skipToEnd} hitSlop={8} style={styles.skipWrap}>
          <Text style={styles.skipText}>Skip</Text>
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
            <View style={[styles.slide, { width }]}>
              <View style={styles.contentInner}>
                {/* Image area with layered overlays */}
                <View style={styles.imageWrap}>
                  <View style={styles.glowBehind} />
                  <ImageBackground
                    source={item.imageUri ? { uri: item.imageUri } : undefined}
                    style={styles.imageBg}
                    imageStyle={styles.imageStyle}
                  >
                    {/* dark gradient overlay */}
                    <View style={styles.gradientOverlay} pointerEvents="none" />

                    {/* floating scan mock */}
                    <View style={styles.scanCenter}>
                      <View style={styles.scanBox}>
                        <View style={styles.scanCornerTopLeft} />
                        <View style={styles.scanCornerTopRight} />
                        <View style={styles.scanCornerBottomLeft} />
                        <View style={styles.scanCornerBottomRight} />
                        <View style={styles.scanLine} />
                      </View>
                    </View>

                    {/* floating small UI (second screen style) */}
                    {isMiddle && (
                      <View style={styles.floatingCard}>
                        <View style={styles.floatingRow}>
                          <View style={styles.smallCircle}>
                            <MaterialIcons
                              name="check"
                              size={18}
                              color="#072"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.fakeBarLarge} />
                            <View style={styles.fakeBarSmall} />
                          </View>
                          <Text style={styles.plusBadge}>+12</Text>
                        </View>
                      </View>
                    )}

                    {/* floating bottom details (third screen style) */}
                    {isLast && (
                      <View style={styles.floatingBottomCard}>
                        <View style={styles.bottomCardInner}>
                          <View style={styles.bottomCardRow}>
                            <View style={styles.smallCircle}>
                              <MaterialIcons
                                name="check"
                                size={18}
                                color="#072"
                              />
                            </View>
                            <View style={{ marginLeft: 10 }}>
                              <Text style={styles.bottomCardUpper}>
                                Scanned
                              </Text>
                              <Text style={styles.bottomCardTitle}>
                                Indomie 70g (Carton)
                              </Text>
                            </View>
                            <View style={{ flex: 1 }} />
                          </View>
                          <View style={styles.bottomCardFooter}>
                            <Text style={styles.unitText}>Unit Price</Text>
                            <Text style={styles.unitPrice}>₦5,200</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </ImageBackground>

                  {/* floating badge icon (first screen) */}
                  {item.badgeIcon && isFirst && (
                    <View style={styles.badgeWrap}>
                      <View style={styles.badgeInner}>
                        <MaterialIcons
                          name={item.badgeIcon as any}
                          size={28}
                          color="#012"
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Text block */}
                <View style={styles.textBlock}>
                  <Text style={styles.titleText}>
                    {item.title.split("\n").map((line: any, idx: any) => (
                      <Text
                        key={idx}
                        style={
                          line.includes("Instantly")
                            ? { color: MAIN_GREEN }
                            : {}
                        }
                      >
                        {line}
                        {idx !== item.title.split("\n").length - 1 ? "\n" : ""}
                      </Text>
                    ))}
                  </Text>
                  <Text style={styles.subtitleText}>{item.subtitle}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Footer area: changes per slide layout */}
      <View style={styles.footer}>
        {/* layout for first slide: dots left + round arrow right */}
        {slides[index].layout === "first" && (
          <>
            <View style={styles.footerInner}>
              <View style={styles.dotsLeft}>
                {slides.map((_, i) => (
                  <View
                    key={`dleft-${i}`}
                    style={[
                      styles.footerDot,
                      i === index
                        ? { width: 32, backgroundColor: MAIN_GREEN }
                        : undefined,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={styles.roundBtn}
                onPress={goNext}
                activeOpacity={0.85}
              >
                <MaterialIcons name="arrow-forward" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* layout for middle slide: dots centered + full width Next under them */}
        {slides[index].layout === "middle" && (
          <View style={styles.centeredFooter}>
            <View style={styles.dotsCenter}>
              {slides.map((_, i) => (
                <View
                  key={`dmid-${i}`}
                  style={[
                    styles.footerDot,
                    i === index
                      ? { width: 32, backgroundColor: MAIN_GREEN }
                      : undefined,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.fullBtn}
              onPress={goNext}
              activeOpacity={0.85}
            >
              <Text style={styles.fullBtnText}>{t("continue")}</Text>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color="#022"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* layout for last slide: dots centered (active wide) + big primary full-width */}
        {slides[index].layout === "last" && (
          <View style={styles.centeredFooter}>
            <View style={styles.dotsCenter}>
              {slides.map((_, i) => (
                <View
                  key={`dlast-${i}`}
                  style={[
                    styles.footerDot,
                    i === index
                      ? { width: 32, backgroundColor: MAIN_GREEN }
                      : undefined,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryFullBtn}
              onPress={goNext}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryFullBtnText}>{t("continue")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#122117", padding: 10 },
  topBar: {
    paddingTop: SAFE_TOP,
    height: SAFE_TOP + 56,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLeftPlaceholder: { width: 48 },
  logoCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#082",
    letterSpacing: 0.4,
  },
  skipWrap: { width: 64, alignItems: "flex-end" },
  skipText: { color: "#fff", opacity: 0.55, fontWeight: "600" },

  slide: { flex: 1, justifyContent: "center" },
  contentInner: { flex: 1, alignItems: "center", justifyContent: "center" },

  imageWrap: {
    width: IMAGE_MAX,
    height: IMAGE_MAX,
    borderRadius: 28,
    overflow: "visible",
    marginBottom: 18,
    alignSelf: "center",
  },
  glowBehind: {
    position: "absolute",
    inset: 0,
    backgroundColor: MAIN_GREEN,
    opacity: 0.05,
    transform: [{ scale: 0.9 }],
    borderRadius: 999,
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
    // blur not available — simulate with opacity
  } as any,
  imageBg: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  imageStyle: { borderRadius: 28, resizeMode: "cover" },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17,33,23,0.35)",
  },

  scanCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBox: {
    width: IMAGE_MAX * 0.58,
    height: IMAGE_MAX * 0.58,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "rgba(54,226,123,0.45)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  scanCornerTopLeft: {
    position: "absolute",
    top: -2,
    left: -2,
    width: 10,
    height: 10,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: MAIN_GREEN,
  },
  scanCornerTopRight: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: MAIN_GREEN,
  },
  scanCornerBottomLeft: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 10,
    height: 10,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: MAIN_GREEN,
  },
  scanCornerBottomRight: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: MAIN_GREEN,
  },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: 3,
    backgroundColor: MAIN_GREEN,
    opacity: 0.95,
    top: "50%",
  },

  floatingCard: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  floatingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MAIN_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  fakeBarLarge: {
    height: 8,
    width: 90,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 6,
    marginBottom: 6,
  },
  fakeBarSmall: {
    height: 8,
    width: 56,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 6,
  },
  plusBadge: { color: MAIN_GREEN, fontWeight: "700", marginLeft: 10 },

  floatingBottomCard: {
    position: "absolute",
    bottom: 22,
    left: 12,
    right: 12,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "rgba(17,33,23,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  bottomCardInner: {},
  bottomCardRow: { flexDirection: "row", alignItems: "center" },
  bottomCardUpper: { fontSize: 10, color: "#9ee0b7", fontWeight: "700" },
  bottomCardTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  bottomCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    alignItems: "center",
  },
  unitText: { color: "#d1d5db", fontSize: 12 },
  unitPrice: { color: "#fff", fontSize: 20, fontWeight: "800" },

  badgeWrap: { position: "absolute", right: 24, bottom: -10 },
  badgeInner: {
    backgroundColor: MAIN_GREEN,
    padding: 12,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: "#f6f8f7",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    elevation: 6,
  },

  textBlock: { paddingHorizontal: 28, alignItems: "center" },
  titleText: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 10,
    color: "#fff",
  },
  subtitleText: {
    fontSize: 14,
    color: "#9aa19d",
    textAlign: "center",
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  footerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dotsLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  footerDot: {
    height: 10,
    width: 10,
    borderRadius: 10,
    backgroundColor: "#E6E6E6",
    marginRight: 8,
  },
  roundBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MAIN_GREEN,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    elevation: 4,
  },

  centeredFooter: { alignItems: "center", gap: 12 },
  dotsCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  fullBtn: {
    width: "100%",
    backgroundColor: MAIN_GREEN,
    paddingVertical: 14,
    borderRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  fullBtnText: { color: "#012", fontSize: 16, fontWeight: "800" },
  primaryFullBtn: {
    width: "100%",
    backgroundColor: MAIN_GREEN,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryFullBtnText: { color: "#fff", fontSize: 16, fontWeight: "900" },

  dot: {
    height: 10,
    borderRadius: 12,
    backgroundColor: "#CFCFCF",
    marginHorizontal: 6,
  },
});
