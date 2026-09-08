import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MessageCircle, ChevronRight } from 'lucide-react-native';
import { ridesApi } from '@/api/rides';
import { formatDate } from '@/lib/format';
import StatusTag from '@/components/StatusTag';

export default function Chat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await ridesApi.history(p, 10);
      setTotal(res.total);
      const chats = (res.data || []).filter((x) => x.status !== 'cancelled');
      setItems((prev) => (replace ? chats : [...prev, ...chats]));
      setPage(p);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, true); }, [load]));

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="px-5 py-3 border-b border-border">
        <Text testID="chat-tab-title" className="text-[22px] font-extrabold text-text">Chats</Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#3AAFA9" size="large" /></View>
      ) : (
        <FlatList
          testID="chat-groups-list"
          data={items}
          keyExtractor={(g) => String(g.id)}
          renderItem={({ item }) => (
            <Pressable testID={`chat-group-${item.id}`} onPress={() => router.push({ pathname: '/group-chat', params: { groupId: item.id } })} className="flex-row items-center gap-3 mx-4 mb-2 bg-white rounded-[14px] p-3.5 border border-border">
              <View className="w-11 h-11 rounded-full bg-primary-light items-center justify-center"><MessageCircle size={20} color="#3AAFA9" /></View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-text">{item.direction === 'airport_to_university' ? 'Airport → Campus' : 'Campus → Airport'}</Text>
                <Text className="text-[12px] text-text-3 mt-0.5">{formatDate(item.travelDate)}</Text>
              </View>
              <StatusTag status={item.status} />
              <ChevronRight size={18} color="#8A8A9A" />
            </Pressable>
          )}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
          onEndReached={() => { if (!loadingMore && items.length < total) { setLoadingMore(true); load(page + 1, false); } }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center mb-4"><MessageCircle size={30} color="#3AAFA9" /></View>
              <Text className="text-lg font-bold text-text mb-1">No conversations yet</Text>
              <Text className="text-sm text-text-3 text-center">Join or create a ride group to start chatting.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#3AAFA9" style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}
