import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';

// Reusable placeholder screen for routes that are filled in during later phases.
export default function Placeholder({ title, subtitle, icon = 'construct-outline', showBack = true }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-5 py-3">
        {showBack ? (
          <Pressable testID="placeholder-back" onPress={() => router.back()} className="w-8">
            <Ionicons name="chevron-back" size={26} color="#1A1A2E" />
          </Pressable>
        ) : (
          <View className="w-8" />
        )}
        <Text className="text-[22px] font-extrabold text-text">{title}</Text>
        <View className="w-8" />
      </View>
      <View className="flex-1 items-center justify-center px-10">
        <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4">
          <Ionicons name={icon} size={36} color="#2B8A85" />
        </View>
        <Text className="text-lg font-bold text-text mb-2 text-center">{title}</Text>
        <Text className="text-sm text-text-3 text-center leading-5">
          {subtitle || 'This screen arrives in an upcoming build phase.'}
        </Text>
      </View>
    </View>
  );
}
