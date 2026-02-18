import React, { useState } from 'react';
import { View, ScrollView, Linking, Alert, ActivityIndicator, Pressable } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Smartphone, Store as StoreIcon } from 'lucide-react-native';
import { authApi } from '@/services/api';
import { t, localizationService } from '@/utils/localization';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui/icon';

const LANGUAGES = [
  { label: 'english', code: 'en' },
  { label: 'hausa', code: 'hausa' },
  { label: 'yoruba', code: 'yoruba' },
  { label: 'igbo', code: 'igbo' },
  { label: 'pidgin', code: 'pcm' },
];

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(localizationService.getCurrentLanguage());

  const handleSetLanguage = async (lang: string) => {
    await localizationService.setLanguage(lang);
    setLanguage(lang);
  };

  const handleGetCode = async () => {
    if (!phone) {
      Alert.alert(t('requiredTitle'), t('phoneNumberRequired'));
      return;
    }
    setIsLoading(true);
    try {
      await authApi.requestOtp(phone);
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone },
      });
    } catch (error: any) {
      Alert.alert(t('errorTitle'), error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openLink = (url: string) => Linking.openURL(url).catch((e) => console.warn(e));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          className="flex-1 px-5 pt-2"
          keyboardShouldPersistTaps="handled">
          {/* Top Bar */}
          <View className="mb-4 flex-row items-center justify-between">
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-secondary"
              onPress={() => router.back()}>
              <Icon as={ArrowLeft} size={22} className="text-foreground" />
            </Button>

            <View className="flex-row items-center gap-1.5">
              <View className="h-2 w-2 rounded-full bg-primary" />
              <View className="h-2 w-2 rounded-full bg-primary/30" />
              <View className="h-2 w-2 rounded-full bg-primary/30" />
            </View>
          </View>

          {/* Hero Section */}
          <View className="mb-6 px-0.5 py-2">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20">
              <Icon as={StoreIcon} size={28} color="#122117" strokeWidth={2.5} />
            </View>
            <Text variant="h1" className="mb-2">
              {t('welcomeOga')}
            </Text>
            <Text variant="p" className="max-w-[520px] leading-relaxed text-muted-foreground">
              {t('loginSubtitle')}
            </Text>
          </View>

          {/* Language Selector */}
          <View className="mb-6">
            <Text className="mb-3 text-sm font-bold text-foreground">{t('selectLanguage')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => handleSetLanguage(lang.code)}
                  className={cn(
                    'rounded-xl border border-transparent bg-secondary px-4 py-2',
                    language === lang.code && 'border-primary/20 bg-primary'
                  )}>
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      language === lang.code
                        ? 'font-bold text-primary-foreground'
                        : 'text-foreground'
                    )}>
                    {t(lang.label)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Form */}
          <View className="gap-5">
            {/* Phone Number Field */}
            <View>
              <Text className="mb-2 text-sm font-bold text-foreground">{t('phoneNumber')}</Text>
              <View className="h-14 flex-row items-center overflow-hidden rounded-full border border-border bg-secondary">
                <View className="h-full flex-row items-center border-r border-border bg-secondary pl-4 pr-3">
                  <Text className="mr-2 text-lg">🇳🇬</Text>
                  <Text className="text-base font-semibold text-foreground">+234</Text>
                </View>
                <Input
                  className="h-full flex-1 border-0 bg-transparent px-4 text-lg"
                  placeholder="8012345678"
                  placeholderTextColor="#9AA0A6"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
                <View className="pr-4">
                  <Icon as={Smartphone} size={20} color="#9AA0A6" />
                </View>
              </View>
            </View>

            {/* Primary Action Button */}
            <Button
              onPress={handleGetCode}
              disabled={isLoading}
              className={cn(
                'mt-2 h-14 rounded-full bg-primary shadow-lg shadow-primary/20',
                isLoading && 'opacity-70'
              )}>
              {isLoading ? (
                <ActivityIndicator color="#062" />
              ) : (
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-black uppercase tracking-tight text-primary-foreground">
                    {t('getCode')}
                  </Text>
                  <Icon as={ArrowRight} size={18} color="#062" strokeWidth={3} />
                </View>
              )}
            </Button>
          </View>

          {/* Footer */}
          <View className="mt-8 items-center px-4">
            <Text className="text-center text-xs leading-5 text-muted-foreground">
              {t('termsAgreement')}{' '}
              <Text
                className="font-bold text-primary"
                onPress={() => openLink('https://example.com/terms')}>
                {t('terms')}
              </Text>{' '}
              and{' '}
              <Text
                className="font-bold text-primary"
                onPress={() => openLink('https://example.com/privacy')}>
                {t('privacyPolicy')}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
