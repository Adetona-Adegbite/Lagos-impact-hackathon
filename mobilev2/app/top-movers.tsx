import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';

type TopBar = {
  name: string;
  value: number;
  highlight?: boolean;
};

type LeaderboardItem = {
  rank: number;
  name: string;
  subtitle: string;
  value: number;
  trend: number;
  image: string;
};

const topBars: TopBar[] = [
  { name: 'Gala', value: 40 },
  { name: 'Indomie', value: 90, highlight: true },
  { name: 'Coke', value: 60 },
  { name: 'Peak', value: 35 },
  { name: 'Soap', value: 25 },
];

const leaderboard: LeaderboardItem[] = [
  {
    rank: 1,
    name: 'Indomie Super Pack',
    subtitle: 'High Stock Level',
    value: 142,
    trend: 12,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBHwoABBE1solrnb37eTOT2Qh4-zl7lB_7ts-HH6nXtIEaZvuA18AUSm5o7KL9dM--Ce9ss-HVgumRftmQNfOU_I2okrf2VeWdU_vmZK0dZ1w5mjfo2QF7wuqxiiYXyyVHsVjdhVAVbdqDcqUVk6xGCTUpreU3WQTQpi3crrJrMRSM8syVSE0iN0RMqFl8x-kMdTbX24TX1-4IqQ3rztXbhjoP18KmKyJkjIFszo2wAku9RMrTizHZv1PyOf97WDFBpQe_qXDsSIw0',
  },
  {
    rank: 2,
    name: 'Coca-Cola 50cl',
    subtitle: 'Low Stock',
    value: 98,
    trend: 5,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAgIhNNb8JRR2VtBo3sfblkYnIX7nna63ATECuhEOEqeeUt0WFbDoKaJgeadEqFc0qdEY44r-ZBRnST0urcgSQ7dV-tlkLDvbRJlD4qBLr4n1om46eRu13qbTDb_OLQnXgtmqR4C911FI7bJVpJwHnnfH8MNmqAETFbqtPSNFvyenPUV-_sfboeuflby51S1xcOGnwJmC3bIXT2SWmg9mWHpl3G09aCQhKLWvl-ONeyM95NiMKlsZeufsRJ_HgbH9Wr4AGX1oqVLqU',
  },
  {
    rank: 3,
    name: 'Peak Milk Powder',
    subtitle: 'In Stock',
    value: 76,
    trend: 2,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDLJq4MafhaoOk8Ky1mALbacUHKvszta2UwogQE-mVH16L8-RiO5u38AbLrNBUtjcgd4NXSaMRPlhYVPXw8zyhA40M6YdYzVBzQN_lA6yHWCdWcKtr486-r7M-ruELRckNVjlnfLu9gWvYnYMgAYipxcYPWx5kygyBkAm-OJ4_VnqovF_wd3kEsMN22ap7gX8T12iE0aRP-rw6K6Ccv0TWp6Vh8Y_fgxUQZpqtkpA1YxoaevmRJ6sPuzCijeP2lVRpbjhYoVAHPwe4',
  },
  {
    rank: 4,
    name: 'Dangote Sugar',
    subtitle: 'In Stock',
    value: 50,
    trend: -1,
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAXqTOs4KH8K9E_c-aqig3APSaFUdTFjbNlspFGt5snvea6iQ93UZU-g7wARiEyD4kG6HVqf06K3hp0n_FUizZYU7Snbq58miL21BqCMXqr0OJN4LYsXG_f7XVD2k6WAMSOXXwHNc9lFTdLa6KH_eEnahByn-uvtV8eZktK0t48pQdh_AUZvtxTQwfmOM-03j2bKpr_4ZZ6VyDzQuhHf0Omya_lnbZ2QYU_9-W-TQ_f7UPCDfirI5MMJt2QBrKPBcAd2lWtRqTdJPg',
  },
];

export default function TopSellers() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [selectedPeriod, setSelectedPeriod] = useState<'Today' | 'This Week' | 'This Month'>(
    'This Week'
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-secondary"
          onPress={() => router.back()}>
          <ArrowLeft size={22} color="white" />
        </Button>
        <Text style={[styles.headerTitle, isDarkMode && styles.textWhite]}>Top Sellers</Text>
        <TouchableOpacity style={[styles.iconBtn, isDarkMode && styles.iconBtnDark]}>
          <Calendar size={22} color={isDarkMode ? '#fff' : '#1f2937'} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['Today', 'This Week', 'This Month'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              isDarkMode && styles.periodButtonDark,
              selectedPeriod === period && styles.periodButtonSelected,
            ]}
            onPress={() => setSelectedPeriod(period as any)}>
            <Text
              style={[
                styles.periodText,
                isDarkMode && styles.textMuted,
                selectedPeriod === period && styles.periodTextSelected,
              ]}>
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Bar Chart */}
        <View style={styles.barChartContainer}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>Top 5 Items</Text>
          <Text style={styles.sectionSubtitle}>Total volume this week: 450 units</Text>
          <View style={styles.barChart}>
            {topBars.map((bar, idx) => (
              <View key={idx} style={styles.barItem}>
                <View
                  style={[
                    styles.bar,
                    { height: `${bar.value}%` },
                    bar.highlight && styles.barHighlight,
                  ]}>
                  {bar.highlight && <Text style={styles.badge}>#1</Text>}
                </View>
                <Text style={styles.barLabel}>{bar.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Leaderboard */}
        <View style={styles.leaderboard}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>
            Sales Leaderboard
          </Text>
          {leaderboard.map((item) => (
            <View
              key={item.rank}
              style={[
                styles.card,
                isDarkMode && styles.cardDark,
                item.rank === 1 && styles.cardHighlight,
              ]}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={[styles.cardName, isDarkMode && styles.textWhite]}>{item.name}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              </View>
              <View style={styles.cardValue}>
                <Text style={[styles.cardNumber, isDarkMode && styles.textWhite]}>
                  {item.value}
                </Text>
                <View
                  style={[
                    styles.trendContainer,
                    item.trend >= 0 ? styles.trendUp : styles.trendDown,
                  ]}>
                  {item.trend >= 0 ? (
                    <TrendingUp size={12} color="#2ab562" />
                  ) : (
                    <TrendingDown size={12} color="#ef4444" />
                  )}
                  <Text
                    style={[
                      styles.trendText,
                      item.trend >= 0 ? styles.trendTextUp : styles.trendTextDown,
                    ]}>
                    {Math.abs(item.trend)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8f7' },
  containerDark: { backgroundColor: '#122117' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDark: {
    backgroundColor: '#1a2c22',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  periodSelector: { flexDirection: 'row', justifyContent: 'center', padding: 16, gap: 8 },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  periodButtonDark: { backgroundColor: '#1a2c22' },
  periodButtonSelected: { backgroundColor: '#36e27b' },
  periodText: { fontSize: 13, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' },
  periodTextSelected: { color: '#112117' },
  barChartContainer: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 20 },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  barItem: { alignItems: 'center' },
  bar: { width: 32, backgroundColor: '#36e27b', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  barHighlight: { backgroundColor: '#facc15' },
  badge: {
    position: 'absolute',
    top: -20,
    width: 32,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#36e27b',
  },
  barLabel: { fontSize: 10, marginTop: 8, color: '#6b7280', fontWeight: 'bold' },
  leaderboard: { paddingHorizontal: 16, marginTop: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
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
  cardHighlight: { borderWidth: 2, borderColor: '#36e27b' },
  cardImage: { width: 52, height: 52, borderRadius: 16 },
  cardContent: { flex: 1, paddingHorizontal: 12 },
  cardName: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  cardSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  cardValue: { alignItems: 'flex-end' },
  cardNumber: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  trendUp: { backgroundColor: '#d1fae5' },
  trendDown: { backgroundColor: '#fee2e2' },
  trendText: { fontSize: 10, fontWeight: 'bold', marginLeft: 2 },
  trendTextUp: { color: '#2ab562' },
  trendTextDown: { color: '#ef4444' },
  textWhite: { color: '#fff' },
  textMuted: { color: '#9ca3af' },
});
