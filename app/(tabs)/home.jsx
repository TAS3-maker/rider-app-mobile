import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, Users } from 'lucide-react-native';
import { ridesApi } from '@/api/rides';
import { calendarApi } from '@/api/social';
import { useSocket } from '@/context/SocketContext';
import { shortDate, formatTime } from '@/lib/format';
import RovoCar from '@/components/RovoCar';
import RovoCloud from '@/components/RovoCloud';

const INK = '#1E2A38';
const INK2 = '#2C3E50';

const LABEL = '#8A94A0';
const SUB = '#6B7480';
const GREEN = '#3E9E75';
const AMBER = '#E0913C';

const CARD_SHADOW = {
  shadowColor: '#2C3A4B',
  shadowOpacity: 0.07,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function ampm(value) {
  return formatTime(value).replace(' ', '').toLowerCase();
}

function DateBadge({ value }) {
  const d = value ? new Date(value) : new Date();
  return (
    <View style={{ width: 54, height: 58, borderRadius: 14, backgroundColor: '#EDF0F3', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: SUB, letterSpacing: 0.5 }}>{MONTHS[d.getMonth()]}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: INK, lineHeight: 26 }}>{d.getDate()}</Text>
    </View>
  );
}

function TravelCard({ ev, onPress }) {
  return (
    <Pressable
      testID={`home-break-${ev.id}`}
      onPress={onPress}
      className="rounded-[16px] bg-white p-4 flex-row items-center"
      style={[{ marginHorizontal: 24, marginBottom: 14 }, CARD_SHADOW, ev.highDemand ? { borderWidth: 1.5, borderColor: '#F0C48A' } : null]}
    >
      <DateBadge value={ev.startDate} />
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>{ev.title}</Text>
        <Text style={{ fontSize: 13, color: SUB, marginTop: 2 }}>
          {shortDate(ev.startDate)}{ev.endDate ? `–${shortDate(ev.endDate)}` : ''}{ev.subtitle ? ` · ${ev.subtitle}` : ''}
        </Text>
        <View className="flex-row items-center" style={{ marginTop: 6 }}>
          <Users size={14} color={AMBER} />
          <Text style={{ fontSize: 13, color: AMBER, fontWeight: '700', marginLeft: 5 }}>{ev.demandCount} students</Text>
          <Text style={{ fontSize: 13, color: SUB }}> looking for rides</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount } = useSocket();
  const [upcoming, setUpcoming] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let on = true;
    (async () => {
      try {
        const [h, c] = await Promise.all([ridesApi.history(1, 10), calendarApi.list(1, 3)]);
        if (!on) return;
        const active = (h.data || []).find((x) => !['cancelled', 'completed'].includes(x.status));
        setUpcoming(active || null);
        setEvents(c.data || []);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []));

  const renderRideCard = () => {
    const airport = (upcoming.airport && upcoming.airport.code) || upcoming.airportCode || 'Airport';
    const toAirport = upcoming.direction !== 'airport_to_university';
    const title = toAirport ? `Campus → ${airport}` : `${airport} → Campus`;

    const statusMap = { open: 'OPEN', nearly_full: 'NEARLY FULL', full: 'FULL', confirmed: 'BOOKED', in_progress: 'BOOKED', completed: 'COMPLETED', cancelled: 'CANCELLED' };
    const statusText = statusMap[upcoming.status] || (upcoming.status || '').toUpperCase();
    const count = upcoming.memberCount != null && upcoming.capacity != null ? ` · ${upcoming.memberCount}/${upcoming.capacity}` : '';
    const warn = upcoming.status === 'nearly_full';
    const danger = upcoming.status === 'full' || upcoming.status === 'cancelled';
    const pillBg = danger ? '#FBE6E3' : warn ? '#FBEFDD' : '#E4F2EA';
    const pillFg = danger ? '#C0392B' : warn ? AMBER : GREEN;

    const rows = [];
    if (upcoming.travelDate || upcoming.flightTime) {
      rows.push({ label: 'Flight', value: `${shortDate(upcoming.travelDate)}${upcoming.flightTime ? ` · ${ampm(upcoming.flightTime)}` : ''}` });
    }
    if (upcoming.departTime) rows.push({ label: 'Depart Campus', value: `~${ampm(upcoming.departTime)}` });
    if (upcoming.bookingDeadline) rows.push({ label: 'Book by', value: ampm(upcoming.bookingDeadline).toUpperCase(), accent: true });
    if (upcoming.estPerPerson != null) rows.push({ label: 'Est. per person', value: `$${Number(upcoming.estPerPerson).toFixed(0)}` });

    const pct = upcoming.savingsPercent;
    const btnLabel = pct ? `Save ~${pct}% vs Riding Solo` : upcoming.saved != null ? `You saved $${upcoming.saved.toFixed(2)}` : 'View Ride Details';

    return (
      <>
        <Text style={{ paddingHorizontal: 24, paddingTop: 6, paddingBottom: 12, fontSize: 13, fontWeight: '700', color: LABEL, letterSpacing: 0.8 }}>YOUR UPCOMING RIDE</Text>
        <Pressable
          testID="home-upcoming"
          onPress={() => router.push({ pathname: '/group', params: { id: upcoming.id } })}
          className="rounded-[20px] bg-white p-5"
          style={[{ marginHorizontal: 24 }, CARD_SHADOW]}
        >
          <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: INK }}>{title}</Text>
            <View className="flex-row items-center">
              <View style={{ backgroundColor: pillBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: pillFg }}>{statusText}{count}</Text>
              </View>
              <View style={{ marginLeft: 8 }}><Users size={18} color={GREEN} /></View>
            </View>
          </View>

          {rows.map((r, i) => (
            <View key={r.label} className="flex-row items-center justify-between" style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0ECE3' }}>
              <Text style={{ fontSize: 15, color: SUB }}>{r.label}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: r.accent ? AMBER : INK }}>{r.value}</Text>
            </View>
          ))}

          <Pressable
            testID="home-save-cta"
            onPress={() => router.push({ pathname: '/group', params: { id: upcoming.id } })}
            className="rounded-[14px] items-center justify-center"
            style={{ backgroundColor: '#2C3A4B', paddingVertical: 15, marginTop: 12 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{btnLabel}</Text>
          </Pressable>
        </Pressable>
      </>
    );
  };

  const renderEmpty = () => (
    <View testID="home-empty">
      <View className="items-center" style={{ paddingTop: 18, paddingBottom: 26 }}>
        <RovoCar width={200} color="#2C3A4B" />
        <Text style={{ fontSize: 15, fontWeight: '800', color: INK, letterSpacing: 1, marginTop: 4 }}>NO RIDES YET</Text>
        <View style={{ marginTop: 22, marginBottom: 22 }}>
          <RovoCloud width={92} color="#2C3A4B" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: INK }}>Be the first!</Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: SUB, textAlign: 'center', marginTop: 6, maxWidth: 290 }}>
          Post your trip and we&rsquo;ll notify you when someone matches your flight time.
        </Text>
        <Pressable
          testID="home-create-ride"
          onPress={() => router.push('/(tabs)/create')}
          className="rounded-[14px] items-center justify-center"
          style={[
            { backgroundColor: '#2C3A4B', paddingVertical: 16, marginTop: 24, alignSelf: 'stretch', marginHorizontal: 24 },
            { shadowColor: '#2C3A4B', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
          ]}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Create a Ride</Text>
        </Pressable>
      </View>
      <View style={{ height: 1, backgroundColor: '#EAE5DB', marginHorizontal: 24, marginBottom: 8 }} />
    </View>
  );

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10 }}>
        <Text testID="home-title" style={{ fontSize: 32, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>Home</Text>
        <Pressable testID="home-notifications" onPress={() => router.push('/notifications')} style={{ padding: 4 }}>
          <Bell size={24}  color={INK2} />
          {unreadCount > 0 ? (
            <View style={{ position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 5, backgroundColor: '#E0483D' }} testID="home-unread-badge" />
          ) : null}
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#2C3A4B" size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
          {upcoming ? renderRideCard() : renderEmpty()}

          <Text style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 14, fontSize: 13, fontWeight: '700', color: LABEL, letterSpacing: 0.8 }}>UPCOMING TRAVEL</Text>
          {events.map((ev) => (
            <TravelCard key={ev.id} ev={ev} onPress={() => router.push('/calendar')} />
          ))}

          {!upcoming ? (
            <View className="items-center" style={{ marginTop: 6 }}>
              <Pressable
                testID="home-notify-me"
                onPress={() => router.push('/calendar')}
                className="flex-row items-center justify-center rounded-[14px] bg-white"
                style={[{ paddingVertical: 16, alignSelf: 'stretch', marginHorizontal: 24 }, CARD_SHADOW]}
              >
                <Bell size={17} color={INK} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: INK, marginLeft: 8 }}>Notify Me</Text>
              </Pressable>
              <Text style={{ fontSize: 13, color: SUB, marginTop: 10 }}>when rides are posted</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
