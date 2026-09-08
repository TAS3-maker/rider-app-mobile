import { View, Text } from 'react-native';
import { statusMeta } from '@/lib/format';

export default function StatusTag({ status, memberCount, capacity, testID }) {
  const m = statusMeta(status, memberCount, capacity);
  return (
    <View className={`px-2.5 py-1 rounded-full ${m.bg}`} testID={testID}>
      <Text className={`text-[11px] font-bold ${m.text}`}>{m.label}</Text>
    </View>
  );
}
