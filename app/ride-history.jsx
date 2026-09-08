import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Car, Star, Check } from 'lucide-react-native';
import { ridesApi } from '@/api/rides';
import { formatDate } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const NAVY = '#2C3A4B';
const GREEN = '#3E9E75';
const RED = '#C0392B';
const AMBER = '#E0913C';
const LINE = '#F0ECE3';
const CARD_SHADOW = { boxShadow: '0px 6px 16px rgba(30,42,56,0.06)', elevation: 2 };

function Row({ label, value, valueColor = INK, bold = false, node, first }) {
  return (
    <View className="flex-row justify-between" style={{ paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: LINE }}>
      <Text style={{ fontSize: 14, color: SUB }}>{label}</Text>
      {node || <Text style={{ fontSize: 14, fontWeight: bold ? '800' : '600', color: valueColor }}>{value}</Text>}
    </View>
  );
}

function HistoryCard({ item }) {
  const cancelled = item.cancelled;
  const code = (item.airport && item.airport.code) || 'Airport';
  const route = item.direction === 'airport_to_university' ? `${code} → UMich` : `UMich → ${code}`;
  const pill = cancelled ? { label: 'CANCELLED', bg: '#FBE6E3', fg: RED } : { label: 'COMPLETED', bg: '#E4F2EA', fg: GREEN };
  const savedPct = item.yourPercent != null ? 100 - item.yourPercent : null;
  const riders = item.riders || [];
  return (
    <View
      testID={`history-card-${item.id}`}
      className="rounded-[16px] bg-white"
      style={[{ marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 14 }, cancelled ? { borderLeftWidth: 4, borderLeftColor: RED } : null, CARD_SHADOW]}
    >
      <View className="flex-row items-center justify-between" style={{ marginBottom: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>{route}</Text>
        <View style={{ backgroundColor: pill.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: pill.fg }}>{pill.label}</Text>
        </View>
      </View>
      <Row label="Date" value={formatDate(item.travelDate)} first />
      {cancelled ? (
        <Row label="Reason" value={item.cancelReason || 'Cancelled'} valueColor={RED} />
      ) : (
        <>
          {riders.length ? (
            <Row label="Riders" node={
              <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 16 }}>
                {riders.map((r, i) => (
                  <Text key={i} style={{ fontSize: 14, fontWeight: '600', color: INK }}>{r.name}{r.isBooker ? ' (Booker)' : ''}</Text>
                ))}
              </View>
            } />
          ) : null}
          {item.totalFare != null ? <Row label="Total fare" value={`$${item.totalFare.toFixed(2)}`} /> : null}
          {item.yourShare != null ? <Row label="You paid" value={`$${item.yourShare.toFixed(2)}${item.yourPercent != null ? ` (${item.yourPercent}%)` : ''}`} /> : null}
          {item.saved != null ? <Row label="You saved" value={`$${item.saved.toFixed(2)}${savedPct != null ? ` (${savedPct}%)` : ''}`} bold /> : null}
          <Row label="Payment" node={
            <View className="flex-row items-center">
              <Text style={{ fontSize: 14, fontWeight: '800', color: item.paymentConfirmed ? INK : AMBER }}>{item.paymentConfirmed ? 'Confirmed' : 'Pending'}</Text>
              {item.paymentConfirmed ? <Check size={15} color={GREEN} style={{ marginLeft: 4 }} /> : null}
            </View>
          } />
          {!cancelled ? (
            <Row label="Your rating given" node={
              <View className="flex-row items-center">
                <Star size={14} color={AMBER} fill={AMBER} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: INK, marginLeft: 4 }}>{(item.ratingGiven || 4.5).toFixed(1)} avg</Text>
              </View>
            } />
          ) : null}
        </>
      )}
    </View>
  );
}

export default function RideHistory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ completedRides: 0, totalSaved: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p, replace) => {
    try {
      const res = await ridesApi.history(p, 10);
      setTotal(res.total);
      setSummary(res.summary || { completedRides: 0, totalSaved: 0 });
      setItems((prev) => (replace ? res.data : [...prev, ...res.data]));
      setPage(p);
    } catch { /* empty */ } finally {
      setLoading(false); setLoadingMore(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(1, true); }, [load]));

  const onEndReached = () => {
    if (loadingMore || loading || items.length >= total) return;
    setLoadingMore(true);
    load(page + 1, false);
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <View className="flex-row items-center">
          <Pressable testID="header-back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} hitSlop={10} style={{ marginRight: 8 }}>
            <ArrowLeft size={28} color={INK} />
          </Pressable>
          <Text testID="history-header" style={{ fontSize: 32, fontWeight: '800', color: INK }}>Ride History</Text>
        </View>
        <Text style={{ fontSize: 14, color: SUB, marginTop: 2, marginLeft: 36 }}>
          {summary.completedRides} completed ride{summary.completedRides === 1 ? '' : 's'} · ${Math.max(0, Math.round(summary.totalSaved))} saved total
        </Text>
      </View>
      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={NAVY} size="large" /></View>
      ) : (
        <FlatList
          testID="history-list"
          data={items}
          keyExtractor={(x) => String(x.id)}
          renderItem={({ item }) => <HistoryCard item={item} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: insets.bottom + 24 }}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="items-center px-8 py-16">
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E7EDF3', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><Car size={30} color={NAVY} /></View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 4 }}>No rides yet</Text>
              <Text style={{ fontSize: 14, color: SUB, textAlign: 'center', lineHeight: 20 }}>Your completed and cancelled rides will show up here.</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator color={NAVY} style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </View>
  );
}
