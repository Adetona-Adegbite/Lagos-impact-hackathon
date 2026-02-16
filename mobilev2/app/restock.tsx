import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Filter, AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

type Item = {
  id: number;
  status: 'Critical' | 'Warning';
  title: string;
  subtitle: string;
  sold: number;
  lastSale: string;
  image: string;
};

const items: Item[] = [
  {
    id: 1,
    status: 'Critical',
    title: 'Indomie Chicken (Carton)',
    subtitle: '₦ 8,500 / carton',
    sold: 0,
    lastSale: '45d ago',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCM-zu4xZRVeQTTPH-NItVEeDkM6xODjab444Ub48AACls6aMrniAiY9ba97nMN4-Fjp1rAqU-Nav1MZYO9rIl28Ek_U7MsGOB0E7BjwezDdSzPER7NV61E8Y8ouLV0iTEibzW9rGZzrEILTXJ3D03uJfvzFJ5LDKCaNAP1SZeDSU-5j1GM3S-1ciub221hX27B_WpNRmG01ls2eVol4XcqCpFws6gmsGWPYCydeyx54KsUqxpkecrTy_38ilzoExA34aamNh68Fnk',
  },
  {
    id: 2,
    status: 'Warning',
    title: 'Peak Milk Powder (Tin)',
    subtitle: '₦ 4,200 / tin',
    sold: 2,
    lastSale: '32d ago',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBkWqCLPRkc9GqJWOHE0foc0p2AJint6fp-yTeK9t1gV14pRunq-6wqgu0Rvg6xEcizBWoRBaaR5DwU4hafzLcv2QtTY_zidvPdIpW_0wICIJQBDMvBYBl6iNoBYx4Ho8jLqOQrs60Vp8cxMpyXr5PncewhvvYmY-QuYu1Gzoic4_qQPQk1rl22at49jwvGqyTdy8WhxbWYe52HMiYK0dCDtHP6xO4KNGrKdQH8HBZhYZdU35c5nYvCBRwjg-VlO1DjwcYzru_aeL4',
  },
  {
    id: 3,
    status: 'Warning',
    title: 'Dangote Sugar (50kg)',
    subtitle: '₦ 28,000 / bag',
    sold: 1,
    lastSale: '28d ago',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuArUYTom9gUIouLZP2BYUjRWLRNyW9oygQXUpc-c9tjzHYj7sOtF9yrYwF63C4aTkcKSHj0kCFCrCRAF-QyqbGqYBMR0wTFUBXfg0uY5AyewBs1kMptkgrcooP1DgbJ7IAmivOIKPkaZ8jh-533uRLE7q6-5ScCHXSLkH-V-FVhPVNyV3N_4Qyq6bzn9xpuSeh7eKUwjhSk_hRjJsjCTQxUSb73qGOrvVWbFzaQ0mPeUUTzyP7HzQjAUXbJ6rUfpiwejZ1l8KHeczo',
  },
];

export default function SlowMovingProducts() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-secondary"
            onPress={() => router.back()}>
            <ArrowLeft size={22} color="white" />
          </Button>
          <View>
            <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>
              Items Stuck on Shelf
            </Text>
            <Text style={styles.headerSubtitle}>Inventory health check</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.headerButton, isDarkMode && styles.headerButtonDark]}>
          <Filter size={20} color={isDarkMode ? '#fff' : '#111827'} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Chart */}
        <View style={[styles.summaryCard, isDarkMode && styles.cardDark]}>
          <Text style={styles.summaryLabel}>Slowest Categories</Text>
          <Text style={[styles.summaryTitle, isDarkMode && styles.textWhite]}>Last 30 Days</Text>

          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Canned Goods</Text>
            <View style={[styles.chartBarBackground, isDarkMode && styles.chartBarBgDark]}>
              <View style={[styles.chartBarPrimary, { width: '75%' }]} />
            </View>
          </View>

          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Toiletries</Text>
            <View style={[styles.chartBarBackground, isDarkMode && styles.chartBarBgDark]}>
              <View style={[styles.chartBarWarning, { width: '50%' }]} />
            </View>
          </View>

          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Snacks</Text>
            <View style={[styles.chartBarBackground, isDarkMode && styles.chartBarBgDark]}>
              <View style={[styles.chartBarPrimaryLight, { width: '30%' }]} />
            </View>
          </View>
        </View>

        {/* Item List */}
        <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Critical Items</Text>

        {items.map((item) => (
          <View key={item.id} style={[styles.itemCard, isDarkMode && styles.cardDark]}>
            <View style={styles.itemHeader}>
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'Critical' ? styles.statusCritical : styles.statusWarning,
                  ]}>
                  {item.status === 'Critical' ? (
                    <AlertCircle size={14} color="#b91c1c" />
                  ) : (
                    <AlertTriangle size={14} color="#f59e0b" />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'Critical'
                        ? styles.statusTextCritical
                        : styles.statusTextWarning,
                    ]}>
                    {item.status} • {item.status === 'Critical' ? 'Very Slow' : 'Slow'}
                  </Text>
                </View>
                <Text style={[styles.itemTitle, isDarkMode && styles.textWhite]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
              </View>

              <Image source={{ uri: item.image }} style={styles.itemImage} />
            </View>

            <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

            <View style={styles.itemStats}>
              <View>
                <Text style={styles.statsLabel}>Sold (30d)</Text>
                <Text style={[styles.statsValue, isDarkMode && styles.textWhite]}>
                  {item.sold} Units
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statsLabel}>Last Sale</Text>
                <Text
                  style={[
                    styles.statsValue,
                    item.status === 'Critical' ? styles.statsCritical : styles.statsWarning,
                  ]}>
                  {item.lastSale}
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity style={styles.ctaButton}>
          <Lightbulb size={20} color="#000" />
          <Text style={styles.ctaText}>How to Clear Stock?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  containerDark: { backgroundColor: '#122117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDark: {
    backgroundColor: '#1a2c22',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDark: {
    backgroundColor: '#1a2c22',
  },
  scrollContent: { paddingHorizontal: 16 },
  summaryCard: {
    marginVertical: 16,
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardDark: {
    backgroundColor: '#1a2c22',
    borderColor: '#2f4538',
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  chartLabel: { width: 100, fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
  chartBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
  },
  chartBarBgDark: {
    backgroundColor: '#122117',
  },
  chartBarPrimary: { height: '100%', backgroundColor: '#36e27b', borderRadius: 5 },
  chartBarWarning: { height: '100%', backgroundColor: '#facc15', borderRadius: 5 },
  chartBarPrimaryLight: {
    height: '100%',
    backgroundColor: 'rgba(54, 226, 123, 0.6)',
    borderRadius: 5,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginVertical: 12 },
  itemCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusCritical: { backgroundColor: '#fee2e2' },
  statusWarning: { backgroundColor: '#fef9c3' },
  statusText: { fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  statusTextCritical: { color: '#b91c1c' },
  statusTextWarning: { color: '#b45309' },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  itemSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  itemImage: { width: 80, height: 80, borderRadius: 16, marginLeft: 12 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 12 },
  dividerDark: { backgroundColor: '#2f4538' },
  itemStats: { flexDirection: 'row', justifyContent: 'space-between' },
  statsLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  statsValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  statsCritical: { color: '#b91c1c' },
  statsWarning: { color: '#b45309' },
  textWhite: { color: '#fff' },
  bottomCTA: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#36e27b',
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: { fontSize: 16, fontWeight: 'bold', color: '#000', marginLeft: 4 },
});
