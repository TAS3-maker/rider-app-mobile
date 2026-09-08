import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

// Sticky, safe-area-aware header with an optional back button and right slot.
export default function ScreenHeader({ title, showBack = true, right = null, testID }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View className="bg-bg border-b border-border" style={{ paddingTop: insets.top }} testID={testID}>
      <View className="flex-row items-center px-4 h-14">
        {showBack ? (
          <Pressable
            testID="header-back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
            className="w-9 h-9 -ml-1.5 items-center justify-center rounded-full active:bg-border"
          >
            <ChevronLeft size={24} color="#1A1A2E" />
          </Pressable>
        ) : (
          <View className="w-9" />
        )}
        <Text className="flex-1 text-center text-[17px] font-bold text-text" numberOfLines={1}>
          {title}
        </Text>
        <View className="w-9 items-end justify-center">{right}</View>
      </View>
    </View>
  );
}
