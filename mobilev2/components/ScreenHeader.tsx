import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface ScreenHeaderProps {
  title: string;
  rightAdornment?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export function ScreenHeader({
  title,
  rightAdornment,
  onBack,
  className,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      className={cn(
        'flex-row items-center justify-between border-b border-border/10 px-5 py-3',
        className
      )}>
      <View className="flex-row items-center gap-4">
        <Button
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-secondary"
          onPress={handleBack}>
          <ArrowLeft size={22} color="white" />
        </Button>
        <Text variant="h3" className="font-black text-foreground" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightAdornment || <View className="w-10" />}
    </View>
  );
}
