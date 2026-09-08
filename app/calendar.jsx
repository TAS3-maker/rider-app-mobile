import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { CalendarDays, Users, Plus } from 'lucide-react-native';
import { calendarApi } from '@/api/social';
import { useAuth } from '@/context/AuthContext';
import { shortDate } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const NAVY = '#2C3A4B';
const AMBER = '#D9822B';
const CARD_SHADOW = { boxShadow: '0px 6px 16px rgba(30,42,56,0.06)', elevation: 2 };

function termLabel() {
  const d = new Date();
  const m = d.getMonth();
  const y = d.getFullYear();
  if (m >= 7 && m <= 11) return `Fall ${y}`;
  if (m >= 0 && m <= 4) return `Spring ${y}`;
  return `Summer ${y}`;
}

function EventCard({ ev }) {
  const range = ev.endDate ? `${shortDate(ev.startDate)}–${shortDate(ev.endDate)}` : shortDate(ev.startDate);
  const start = new Date(ev.startDate);
  const hi = ev.highDemand;
  return (
    <View testID={`calendar-card-${ev.id}`} className="rounded-[16px] bg-white" style={[{ marginHorizontal: 20, marginBottom: 16, padding: 16 }, CARD_SHADOW]}>
      <View className="flex-row items-center">
        <View style={{ width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: hi ? '#FBE7DA' : '#E7EDF3' }}>
          <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: hi ? AMBER : NAVY }}>{start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</Text>
          <Text style={{ fontSize: 20, fontWeight: '800', color: hi ? AMBER : NAVY }}>{start.getDate()}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: INK }}>{ev.title}</Text>
          <Text style={{ fontSize: 13, color: SUB, marginTop: 2 }}>{range}{ev.subtitle ? ` · ${ev.subtitle}` : ''}</Text>
          <View className="flex-row items-center" style={{ marginTop: 6 }}>
            <Users size={14} color={hi ? AMBER : INK} />
            {hi ? (
              <Text style={{ fontSize: 13, color: AMBER, marginLeft: 6 }}>
                <Text style={{ fontWeight: '800' }}>{ev.demandCount} students looking</Text> — Very High demand
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: SUB, marginLeft: 6 }}>
                <Text style={{ fontWeight: '800', color: INK }}>{ev.demandCount} student{ev.demandCount === 1 ? '' : 's'}</Text> looking
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await calendarApi.list(p, 15);
      setTotal(res.total);
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, true); }, [load]));

  const uni = user?.universityName || 'UMich';

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}>
        <Text testID="calendar-header" style={{ fontSize: 34, fontWeight: '800', color: INK }}>Travel Calendar</Text>
        <Text style={{ fontSize: 15, color: SUB, marginTop: 4 }}>{uni} · {termLabel()}</Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={NAVY} size="large" /></View>
      ) : (
        <FlatList
          testID="calendar-list"
          data={items}
          keyExtractor={(e) => String(e.id)}
          renderItem={({ item }) => <EventCard ev={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
          onEndReached={() => { if (!loadingMore && items.length < total) { setLoadingMore(true); load(page + 1, false); } }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E7EDF3', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><CalendarDays size={30} color={NAVY} /></View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 4 }}>No breaks scheduled</Text>
              <Text style={{ fontSize: 14, color: SUB, textAlign: 'center' }}>Upcoming campus breaks will appear here.</Text>
            </View>
          }
          ListFooterComponent={
            items.length ? (
              <Pressable testID="calendar-post" onPress={() => router.push('/(tabs)/create')} className="rounded-[14px] items-center justify-center flex-row" style={[{ backgroundColor: NAVY, paddingVertical: 17, marginHorizontal: 20, marginTop: 8 }, CARD_SHADOW]}>
                <Plus size={17} color="#fff" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 }}>Post a Ride for a Break</Text>
              </Pressable>
            ) : (loadingMore ? <ActivityIndicator color={NAVY} style={{ marginVertical: 16 }} /> : null)
          }
        />
      )}
    </View>
  );
}
