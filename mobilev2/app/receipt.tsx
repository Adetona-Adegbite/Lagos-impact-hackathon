import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Banknote,
  Sparkles,
  Landmark,
  TrendingUp,
  Package,
  CreditCard,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';

const { width } = Dimensions.get('window');
const PRIMARY = '#36e27b';

type LineItem = {
  id: string;
  qty: number;
  title: string;
  category: string;
  price: number;
};

const SAMPLE_ITEMS: LineItem[] = [
  {
    id: 'i1',
    qty: 1,
    title: 'Peak Milk Sachet',
    category: 'Dairy',
    price: 150,
  },
  { id: 'i2', qty: 2, title: 'Dangote Sugar', category: 'Pantry', price: 1600 },
  { id: 'i3', qty: 5, title: 'Other Items', category: 'Various', price: 12750 },
];

export default function SalesReceiptScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const total = SAMPLE_ITEMS.reduce((s, it) => s + it.price, 0);
  const dateStr = 'Oct 12, 2:30 PM';

  return (
    <SafeAreaView style={[styles.safe, isDarkMode && styles.safeDark]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {/* Top bar */}
      <View style={[styles.topBar, isDarkMode && styles.topBarDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.topBtn, isDarkMode && styles.topBtnDark]}>
          <ArrowLeft size={22} color={isDarkMode ? '#fff' : '#111'} />
        </TouchableOpacity>
        <Text style={[styles.title, isDarkMode && styles.textWhite]}>Receipt #1024</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Receipt card */}
        <View style={[styles.receiptCard, isDarkMode && styles.cardDark]}>
          <View style={[styles.receiptHeader, isDarkMode && styles.borderDark]}>
            <View style={styles.checkWrap}>
              <View style={styles.checkCircle}>
                <Check size={24} color={PRIMARY} strokeWidth={3} />
              </View>
              <Text style={styles.successText}>Payment Successful</Text>
              <Text style={[styles.totalText, isDarkMode && styles.textWhite]}>
                ₦{total.toLocaleString()}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{dateStr}</Text>
              <View style={styles.metaRight}>
                <Banknote size={16} color="#6b7280" />
                <Text style={styles.metaText}> Cash Payment</Text>
              </View>
            </View>
          </View>

          <View style={styles.itemsList}>
            {SAMPLE_ITEMS.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <View style={[styles.qtyBox, isDarkMode && styles.qtyBoxDark]}>
                    <Text style={[styles.qtyText, isDarkMode && styles.textWhite]}>{it.qty}x</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={[styles.itemTitle, isDarkMode && styles.textWhite]}>
                      {it.title}
                    </Text>
                    <Text style={styles.itemCategory}>{it.category}</Text>
                  </View>
                </View>
                <Text style={[styles.itemPrice, isDarkMode && styles.textWhite]}>
                  ₦{it.price.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Analysis header */}
        <View style={styles.sectionHeader}>
          <Sparkles size={20} color={PRIMARY} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, isDarkMode && styles.textWhite]}>AI Analysis</Text>
        </View>

        {/* Insights */}
        <View style={styles.insights}>
          <View
            style={[styles.insightCard, styles.insightBlue, isDarkMode && styles.insightBlueDark]}>
            <View style={styles.accentBarBlue} />
            <View style={styles.insightLeft}>
              <View style={[styles.insightIcon, isDarkMode && styles.insightIconDark]}>
                <Landmark size={18} color="#1e3a8a" />
              </View>
            </View>
            <View style={styles.insightBody}>
              <Text style={[styles.insightTitle, isDarkMode && styles.insightTitleDark]}>
                VAT Eligible
              </Text>
              <Text style={[styles.insightText, isDarkMode && styles.insightTextDark]}>
                This sale contains VAT-eligible items. Estimated tax on this receipt:{' '}
                <Text style={styles.insightHighlight}>₦1,120</Text>.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.insightCard,
              styles.insightYellow,
              isDarkMode && styles.insightYellowDark,
            ]}>
            <View style={styles.accentBarYellow} />
            <View style={styles.insightLeft}>
              <View style={[styles.insightIcon, isDarkMode && styles.insightIconDark]}>
                <TrendingUp size={18} color="#92400e" />
              </View>
            </View>
            <View style={styles.insightBody}>
              <Text style={[styles.insightTitle, isDarkMode && styles.insightTitleDark]}>
                Notable Transaction
              </Text>
              <Text style={[styles.insightText, isDarkMode && styles.insightTextDark]}>
                High-value transaction compared to store average (3× normal). Flagged as notable.
              </Text>
            </View>
          </View>

          <View
            style={[styles.insightCard, styles.insightRed, isDarkMode && styles.insightRedDark]}>
            <View style={styles.accentBarRed} />
            <View style={styles.insightLeft}>
              <View style={[styles.insightIcon, isDarkMode && styles.insightIconDark]}>
                <Package size={18} color="#7f1d1d" />
              </View>
            </View>
            <View style={styles.insightBody}>
              <Text style={[styles.insightTitle, isDarkMode && styles.insightTitleDark]}>
                Low Inventory Risk
              </Text>
              <Text style={[styles.insightText, isDarkMode && styles.insightTextDark]}>
                Stock levels after this sale put <Text style={styles.bold}>‘Peak Milk Sachet’</Text>{' '}
                into low-inventory risk.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtnPrimary, isDarkMode && styles.footerBtnPrimaryDark]}
          activeOpacity={0.9}
          onPress={() => {
            console.log('Include in credit history');
          }}>
          <CreditCard size={20} color={PRIMARY} />
          <Text style={[styles.footerBtnText, isDarkMode && styles.textWhite]}>
            Include in Credit History
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f8f7' },
  safeDark: { backgroundColor: '#122117' },
  topBar: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 0.25,
    borderBottomColor: '#e6e9e8',
  },
  topBarDark: {
    backgroundColor: '#122117',
    borderBottomColor: '#2f4538',
  },
  topBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBtnDark: {
    backgroundColor: '#1a2c22',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
  },
  content: { padding: 16 },
  receiptCard: {
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#eef2f4',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1a2c22',
    borderColor: '#2f4538',
  },
  receiptHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  borderDark: {
    borderBottomColor: '#2f4538',
  },
  checkWrap: { alignItems: 'center' },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  totalText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 8,
  },
  metaRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemsList: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  qtyBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBoxDark: {
    backgroundColor: '#122117',
  },
  qtyText: { color: '#374151', fontWeight: '800' },
  itemTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  itemCategory: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  itemPrice: { fontWeight: '800', color: '#0f172a' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  insights: { paddingVertical: 8 },
  insightCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eef2f4',
    alignItems: 'flex-start',
  },
  insightLeft: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightIconDark: {
    backgroundColor: '#1a2c22',
  },
  insightBody: { flex: 1, padding: 16, paddingLeft: 0 },
  insightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  insightTitleDark: { color: '#fff' },
  insightText: { fontSize: 13, color: '#64748b', lineHeight: 20 },
  insightTextDark: { color: '#9ca3af' },
  insightHighlight: {
    fontWeight: '900',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    borderRadius: 6,
    color: '#1e3a8a',
  },
  accentBarBlue: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#2563eb',
  },
  accentBarYellow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#f59e0b',
  },
  accentBarRed: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#ef4444',
  },
  insightBlue: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
  insightBlueDark: { backgroundColor: '#1e3a8a20', borderColor: '#1e3a8a40' },
  insightYellow: { backgroundColor: '#fffbeb', borderColor: '#fef3c7' },
  insightYellowDark: { backgroundColor: '#92400e20', borderColor: '#92400e40' },
  insightRed: { backgroundColor: '#fff1f2', borderColor: '#fee2e2' },
  insightRedDark: { backgroundColor: '#7f1d1d20', borderColor: '#7f1d1d40' },
  bold: { fontWeight: '800' },
  textWhite: { color: '#fff' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerBtnPrimary: {
    width: width - 32,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eef2f4',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  footerBtnPrimaryDark: {
    backgroundColor: '#1a2c22',
    borderColor: '#2f4538',
  },
  footerBtnText: { color: '#064e3b', fontWeight: '900', fontSize: 16 },
});
