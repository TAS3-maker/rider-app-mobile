import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Image, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Search } from 'lucide-react-native';
import { groupsApi } from '@/api/rides';
import { formatTime } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const NAVY = '#2C3A4B';
const CAMPUS = 'UMich';

const CARD_SHADOW = { shadowColor: '#2C3A4B', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 };

function statusPill(status) {
  if (status === 'full') return { label: 'Full', bg: '#FBE6E3', fg: '#C0392B' };
  if (status === 'nearly_full') return { label: 'Nearly Full', bg: '#FBEFDD', fg: '#B9822F' };
  return { label: 'OPEN', bg: '#E4F2EA', fg: '#3E9E75' };
}

function routeLabel(g) {
  const code = g.airport ? g.airport.code : (g.customDestinationName || 'DTW');
  return g.direction === 'airport_to_university' ? `${code}  →  ${CAMPUS}` : `${CAMPUS}  →  ${code}`;
}

function PeopleDots({ count, capacity, color }) {
  return (
    <View className="flex-row items-center" style={{ marginLeft: 8 }}>
      {Array.from({ length: capacity || 4 }).map((_, i) => (
        <User key={i} size={15} color={i < count ? color : '#C5CCD4'} fill={i < count ? color : 'transparent'} style={{ marginLeft: i === 0 ? 0 : -3 }} />
      ))}
    </View>
  );
}

function MemberChip({ m }) {
  return (
    <View className="flex-row items-center rounded-full" style={{ backgroundColor: m.isBooker ? '#F8F1E7' : '#EDF0F3', paddingRight: 10, paddingLeft: 3, paddingVertical: 3, marginRight: 8, marginBottom: 6 }}>
      {m.profileImage ? (
        <Image source={{ uri: m.profileImage }} style={{ width: 24, height: 24, borderRadius: 12 }} />
      ) : (
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#DCE3EA', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: NAVY }}>{m.initials}</Text>
        </View>
      )}
      <Text style={{ fontSize: 13, fontWeight: '700', color: INK, marginLeft: 6 }}>{m.name}</Text>
      {m.isBooker ? <Text style={{ fontSize: 11, fontWeight: '800', color: '#C98A34', marginLeft: 6 }}>BOOKER</Text> : null}
    </View>
  );
}

function Row({ label, value, first }) {
  return (
    <View className="flex-row items-center justify-between" style={{ paddingVertical: 11, borderTopWidth: first ? 0 : 1, borderTopColor: '#F0ECE3' }}>
      <Text style={{ fontSize: 15, color: SUB }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>{value}</Text>
    </View>
  );
}

function GroupCard({ g, rideId }) {
  const router = useRouter();
  const isFull = g.status === 'full';
  const pill = statusPill(g.status);
  const members = g.members || [];
  const flightTimes = members.map((m) => m.flightTime).filter(Boolean);
  const flightText = isFull
    ? `${formatTime(g.flightWindowStart)} – ${formatTime(g.flightWindowEnd || g.flightWindowStart)}`
    : (flightTimes.length ? flightTimes.map((t) => formatTime(t)).join(', ') : '—');

  return (
    <Pressable
      testID={`browse-card-${g.id}`}
      disabled={isFull}
      onPress={() => router.push({ pathname: '/group', params: { id: g.id, ...(rideId ? { rideId } : {}) } })}
      className="rounded-[18px] bg-white p-4"
      style={[{ marginHorizontal: 24, marginBottom: 16 }, CARD_SHADOW, { opacity: isFull ? 0.55 : 1 }]}
    >
      <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: INK }}>{routeLabel(g)}</Text>
        <View className="flex-row items-center">
          <View style={{ backgroundColor: pill.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: pill.fg }}>{pill.label} · {g.memberCount}/{g.capacity}</Text>
          </View>
          <PeopleDots count={g.memberCount} capacity={g.capacity} color={pill.fg} />
        </View>
      </View>

      {!isFull && members.length ? (
        <View className="flex-row flex-wrap" style={{ marginBottom: 6 }}>
          {members.slice(0, 4).map((m) => <MemberChip key={String(m.userId)} m={m} />)}
        </View>
      ) : null}

      <Row label="Flight" value={flightText} first />
      {!isFull ? (
        <>
          <Row label="Depart Campus" value={`~${formatTime(g.suggestedDeparture)}`} />
          <Row label="Vehicle" value={`${g.vehicleSuggestion || 'UberX'} · ${g.totalBags || 0} Bags`} />
          <Row label="Est. per person" value={`$${g.perPerson}`} />
          <Pressable
            testID={`browse-cta-${g.id}`}
            onPress={() => router.push({ pathname: '/group', params: { id: g.id, ...(rideId ? { rideId } : {}) } })}
            className="rounded-[14px] items-center justify-center"
            style={{ backgroundColor: NAVY, paddingVertical: 14, marginTop: 12 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Save ~{g.savingsPct || 0}% vs Riding Solo</Text>
          </Pressable>
        </>
      ) : (
        <Text style={{ textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#C0392B', paddingVertical: 10 }}>This ride is full</Text>
      )}
    </Pressable>
  );
}

export default function RideBrowseList({ rideId, filters = {}, onMeta }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await groupsApi.browse({ page: p, limit: 10, ...filters });
      setTotal(res.total);
      if (onMeta) onMeta(res.total);
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } catch (e) {
      // swallow — empty state handles it
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    setLoading(true);
    load(1, true);
  }, [load]);

  const onEndReached = () => {
    if (loadingMore || loading) return;
    if (items.length >= total) return;
    setLoadingMore(true);
    load(page + 1, false);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={NAVY} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      testID="browse-list"
      className="flex-1 bg-bg"
      data={items}
      keyExtractor={(g) => String(g.id)}
      renderItem={({ item }) => <GroupCard g={item} rideId={rideId} />}
      contentContainerStyle={{ paddingTop: 6, paddingBottom: insets.bottom + 24 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(1, true); }} tintColor={NAVY} />}
      ListEmptyComponent={
        <View className="items-center px-8 py-16">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#E7EBEF' }}>
            <Search size={32} color={NAVY} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 4 }}>No rides available</Text>
          <Text style={{ fontSize: 14, color: SUB, textAlign: 'center', lineHeight: 20 }}>
            No open groups match your filters. Create a ride to start your own group.
          </Text>
        </View>
      }
      ListFooterComponent={loadingMore ? <ActivityIndicator color={NAVY} style={{ marginVertical: 16 }} /> : null}
    />
  );
}
