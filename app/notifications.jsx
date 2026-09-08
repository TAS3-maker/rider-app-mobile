import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { notificationsApi } from '@/api/social';
import { useSocket } from '@/context/SocketContext';

const INK = '#1E2A38';
const SUB = '#6B7480';
const NAVY = '#2C3A4B';
const GREEN = '#3E9E75';
const AMBER = '#E0913C';
const GRAY = '#C5CCD4';

// Amber dot for travel/break alerts; green for other unread; gray once read.
const AMBER_TYPES = new Set(['announcement']);

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const days = Math.floor(h / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshUnread } = useSocket();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await notificationsApi.list(p, 20);
      setTotal(res.total);
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, true); }, [load]));

  const openItem = async (n) => {
    if (!n.read) { try { await notificationsApi.read(n.id); refreshUnread(); } catch { /* ignore */ } }
    const gid = n.data && n.data.groupId;
    if (gid && n.type === 'chat_message') router.push({ pathname: '/group-chat', params: { groupId: gid } });
    else if (gid) router.push({ pathname: '/group', params: { id: gid } });
  };

  const renderItem = ({ item }) => {
    const dotColor = item.read ? GRAY : AMBER_TYPES.has(item.type) ? AMBER : GREEN;
    return (
      <Pressable testID={`notif-${item.id}`} onPress={() => openItem(item)} className="flex-row" style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
        <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: dotColor, marginTop: 5, marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: INK }}>{item.title}</Text>
          {item.body ? <Text style={{ fontSize: 14, color: SUB, marginTop: 2, lineHeight: 19 }}>{item.body}</Text> : null}
          <Text style={{ fontSize: 12, color: '#9AA6B2', marginTop: 4 }}>{timeAgo(item.createdAt)}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center" style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Pressable testID="header-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} hitSlop={10} style={{ marginRight: 8 }}>
          <ArrowLeft size={28} color={INK} />
        </Pressable>
        <Text testID="notifications-header" style={{ fontSize: 32, fontWeight: '800', color: INK }}>Notifications</Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={NAVY} size="large" /></View>
      ) : (
        <FlatList
          testID="notifications-list"
          data={items}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 6, paddingBottom: insets.bottom + 24 }}
          onEndReached={() => { if (!loadingMore && items.length < total) { setLoadingMore(true); load(page + 1, false); } }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E7EDF3', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Bell size={30} color={NAVY} /></View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 4 }}>No notifications</Text>
              <Text style={{ fontSize: 14, color: SUB, textAlign: 'center' }}>Ride matches, group updates and reminders will show up here.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={NAVY} style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}
