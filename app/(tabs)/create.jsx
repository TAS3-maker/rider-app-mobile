import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Send, SlidersHorizontal } from 'lucide-react-native';
import { ridesApi, groupsApi, refApi } from '@/api/rides';
import { formatTime, formatDate } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const MUTED = '#9AA6B2';
const AMBER = '#E0913C';
const NAVY = '#2C3A4B';
const MIN_MS = 60000;
const CAMPUS = 'UMich';

const CARD_SHADOW = { shadowColor: '#2C3A4B', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 };

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINS = ['00', '15', '30', '45'];

function SectionLabel({ children, hint }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 0.4, marginBottom: 10 }}>
      {children}
      {hint ? <Text style={{ fontSize: 11, fontWeight: '600', color: MUTED, letterSpacing: 0 }}>  {hint}</Text> : null}
    </Text>
  );
}

function FieldButton({ value, placeholder, onPress, testID }) {
  return (
    <Pressable testID={testID} onPress={onPress} className="rounded-[14px] bg-white px-4" style={[{ paddingVertical: 16 }, CARD_SHADOW]}>
      <Text style={{ fontSize: 16, color: value ? SUB : MUTED }}>{value || placeholder}</Text>
    </Pressable>
  );
}

function TextField({ value, onChangeText, placeholder, testID, autoCapitalize = 'none' }) {
  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={MUTED}
      autoCapitalize={autoCapitalize}
      className="rounded-[14px] bg-white px-4"
      style={[{ paddingVertical: 16, fontSize: 16, color: INK }, CARD_SHADOW]}
    />
  );
}

function SegButton({ label, active, onPress, testID }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
        active ? { backgroundColor: '#DFE6EE', borderColor: NAVY } : { backgroundColor: '#FFFFFF', borderColor: '#E4DFD5' },
      ]}
    >
      <Text style={{ fontSize: 15, fontWeight: '700', color: active ? INK : MUTED }}>{label}</Text>
    </Pressable>
  );
}

function Stepper({ value, onChange, testID }) {
  return (
    <View className="flex-row items-center bg-white rounded-[14px]" style={[{ paddingHorizontal: 6, paddingVertical: 6 }, CARD_SHADOW]}>
      <Pressable testID={`${testID}-minus`} onPress={() => onChange(Math.max(0, value - 1))} style={{ width: 34, alignItems: 'center' }}>
        <Text style={{ fontSize: 22, color: SUB, marginTop: -2 }}>–</Text>
      </Pressable>
      <Text style={{ fontSize: 17, fontWeight: '800', color: INK, minWidth: 26, textAlign: 'center' }}>{value}</Text>
      <Pressable testID={`${testID}-plus`} onPress={() => onChange(value + 1)} style={{ width: 34, alignItems: 'center' }}>
        <Text style={{ fontSize: 20, color: SUB }}>+</Text>
      </Pressable>
    </View>
  );
}

function Switch({ value, onValueChange, testID }) {
  return (
    <Pressable testID={testID} onPress={() => onValueChange(!value)}>
      <View style={{ width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center', backgroundColor: value ? NAVY : '#CBD2DA' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: value ? 'flex-end' : 'flex-start' }} />
      </View>
    </Pressable>
  );
}

function Chip({ label, active, onPress, testID }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        { paddingHorizontal: 16, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
        active ? { backgroundColor: '#DFE6EE', borderColor: NAVY } : { backgroundColor: '#fff', borderColor: '#E4DFD5' },
      ]}
    >
      <Text style={{ fontSize: 14, fontWeight: '700', color: active ? INK : MUTED }}>{label}</Text>
    </Pressable>
  );
}

export default function CreateRide() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mode, setMode] = useState('public'); // public = Find Riders, private = Invite Friends
  const [direction, setDirection] = useState('university_to_airport');
  const [terminal, setTerminal] = useState('mcnamara');
  const [destType, setDestType] = useState('airport'); // private only
  const [customName, setCustomName] = useState('');

  const [airports, setAirports] = useState([]);
  const [airportId, setAirportId] = useState(null);

  const [hour, setHour] = useState(5);
  const [minute, setMinute] = useState('15');
  const [ampm, setAmpm] = useState('PM');
  const [dayOffset, setDayOffset] = useState(1);
  const [bags, setBags] = useState(0);
  const [flexible, setFlexible] = useState(false);
  const [flightInfo, setFlightInfo] = useState('');
  const [address, setAddress] = useState('');

  const [picker, setPicker] = useState(null); // 'time' | 'date' | null
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    refApi.airports().then((r) => {
      setAirports(r.data || []);
      if (r.data && r.data[0]) setAirportId(r.data[0].id);
    }).catch(() => {});
  }, []);

  const days = useMemo(() => {
    const out = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    for (let i = 0; i < 21; i++) out.push(new Date(base.getTime() + i * 86400000));
    return out;
  }, []);

  const flightDate = useMemo(() => {
    const d = new Date(days[dayOffset]);
    let h = hour % 12;
    if (ampm === 'PM') h += 12;
    d.setHours(h, parseInt(minute, 10), 0, 0);
    return d;
  }, [days, dayOffset, hour, minute, ampm]);

  const toAirport = direction === 'university_to_airport';
  const airport = airports.find((a) => a.id === airportId);
  const code = airport ? airport.code : 'DTW';
  const isCustom = mode === 'private' && destType === 'custom';

  const departure = new Date(flightDate.getTime() - 165 * MIN_MS);
  const bookBy = new Date(departure.getTime() - 120 * MIN_MS);
  const readyPickup = new Date(flightDate.getTime() + 45 * MIN_MS);

  async function submit() {
    setError('');
    if (isCustom && !customName.trim()) return setError('Enter a destination name');
    if (!isCustom && !airportId) return setError('Please select an airport');
    setSubmitting(true);
    try {
      const y = flightDate.getFullYear();
      const mo = String(flightDate.getMonth() + 1).padStart(2, '0');
      const da = String(flightDate.getDate()).padStart(2, '0');
      const res = await ridesApi.create({
        direction,
        airport: isCustom ? undefined : airportId,
        destinationType: isCustom ? 'custom' : 'airport',
        customDestinationName: isCustom ? customName.trim() : '',
        terminal: !toAirport ? terminal : undefined,
        travelDate: `${y}-${mo}-${da}`,
        flightTime: flightDate.toISOString(),
        checkedBags: bags,
        flightInfo,
        pickupLocation: address,
        flexibleTiming: flexible,
        mode,
      });
      if (mode === 'private') {
        router.push({ pathname: '/private-group', params: { id: res.group.id } });
      } else if (res.matchCount > 0) {
        router.push({ pathname: '/browse', params: { rideId: res.ride.id } });
      } else {
        const g = await groupsApi.create(res.ride.id);
        router.push({ pathname: '/group', params: { id: g.data.id } });
      }
    } catch (e) {
      setError(e.message || 'Could not post your ride');
    } finally {
      setSubmitting(false);
    }
  }

  const timeLabel = toAirport ? (mode === 'private' ? 'FLIGHT DEPARTURE TIME' : 'FLIGHT DEPARTURE TIME') : 'FLIGHT LANDING TIME';

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Text testID="create-title" style={{ fontSize: 32, fontWeight: '800', color: INK, textAlign: 'center', paddingTop: 14, paddingBottom: 18, letterSpacing: -0.5 }}>
        {mode === 'private' ? 'Private Group' : 'Create Ride'}
      </Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Tabs */}
          <View className="flex-row rounded-[14px] p-1" style={{ backgroundColor: '#E7EBEF', marginBottom: 24 }}>
            {[{ k: 'public', label: 'Find Riders' }, { k: 'private', label: 'Invite Friends' }].map(({ k, label }) => (
              <Pressable
                key={k}
                testID={`create-mode-${k}`}
                onPress={() => setMode(k)}
                className="flex-1 items-center justify-center rounded-[11px]"
                style={[{ paddingVertical: 11 }, mode === k ? { backgroundColor: '#fff', ...CARD_SHADOW } : null]}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: mode === k ? INK : MUTED }}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'private' ? (
            <>
              <SectionLabel>DESTINATION</SectionLabel>
              <Pressable
                testID="dest-airport"
                onPress={() => setDestType('airport')}
                className="rounded-[14px] px-4 mb-3"
                style={[{ paddingVertical: 14, borderWidth: 1.5 }, destType === 'airport' ? { backgroundColor: '#DFE6EE', borderColor: NAVY } : { backgroundColor: '#fff', borderColor: '#E4DFD5' }]}
              >
                <View className="flex-row items-center" style={{ marginBottom: 3 }}>
                  <Send size={16} color={INK} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: INK, marginLeft: 8 }}>{code} - {airport?.name || 'Airport'}</Text>
                </View>
                <Text style={{ fontSize: 13, color: SUB }}>Full Smart Features · Auto Computed Times</Text>
              </Pressable>
              <Pressable
                testID="dest-custom"
                onPress={() => setDestType('custom')}
                className="rounded-[14px] px-4"
                style={[{ paddingVertical: 14, borderWidth: 1.5, marginBottom: 24 }, destType === 'custom' ? { backgroundColor: '#DFE6EE', borderColor: NAVY } : { backgroundColor: '#fff', borderColor: '#E4DFD5' }]}
              >
                <View className="flex-row items-center" style={{ marginBottom: 3 }}>
                  <SlidersHorizontal size={16} color={INK} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: INK, marginLeft: 8 }}>Custom Destination</Text>
                </View>
                <Text style={{ fontSize: 13, color: SUB }}>Type any destination · Manual Times</Text>
              </Pressable>

              {isCustom ? (
                <View style={{ marginBottom: 24 }}>
                  <SectionLabel>DESTINATION NAME</SectionLabel>
                  <TextField value={customName} onChangeText={setCustomName} placeholder="e.g. Chicago O'Hare" testID="create-customname" autoCapitalize="words" />
                </View>
              ) : null}

              <View style={{ marginBottom: 24 }}>
                <SectionLabel>{isCustom ? 'DEPARTURE TIME' : 'FLIGHT DEPARTURE TIME'}</SectionLabel>
                <FieldButton value={formatTime(flightDate)} onPress={() => setPicker('time')} testID="create-time" />
              </View>
              <View style={{ marginBottom: 24 }}>
                <SectionLabel>TRAVEL DATE</SectionLabel>
                <FieldButton value={formatDate(flightDate)} onPress={() => setPicker('date')} testID="create-date" />
              </View>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 24 }}>
                <SectionLabel>CHECKED BAGS</SectionLabel>
                <Stepper value={bags} onChange={setBags} testID="create-bags" />
              </View>
            </>
          ) : (
            <>
              <SectionLabel>DIRECTION</SectionLabel>
              <View className="flex-row" style={{ gap: 12, marginBottom: 24 }}>
                <SegButton label={`${CAMPUS}  →  ${code}`} active={toAirport} onPress={() => setDirection('university_to_airport')} testID="create-dir-out" />
                <SegButton label={`${code}  →  ${CAMPUS}`} active={!toAirport} onPress={() => setDirection('airport_to_university')} testID="create-dir-in" />
              </View>

              {!toAirport ? (
                <>
                  <SectionLabel>DTW TERMINAL</SectionLabel>
                  <View className="flex-row" style={{ gap: 12, marginBottom: 24 }}>
                    <SegButton label="McNamara" active={terminal === 'mcnamara'} onPress={() => setTerminal('mcnamara')} testID="create-term-mcnamara" />
                    <SegButton label="North" active={terminal === 'north'} onPress={() => setTerminal('north')} testID="create-term-north" />
                  </View>
                </>
              ) : null}

              <View style={{ marginBottom: 24 }}>
                <SectionLabel>{timeLabel}</SectionLabel>
                <FieldButton value={formatTime(flightDate)} onPress={() => setPicker('time')} testID="create-time" />
              </View>
              <View style={{ marginBottom: 24 }}>
                <SectionLabel>TRAVEL DATE</SectionLabel>
                <FieldButton value={formatDate(flightDate)} onPress={() => setPicker('date')} testID="create-date" />
              </View>
              <View style={{ marginBottom: 24 }}>
                <SectionLabel hint="(OPTIONAL)">AIRLINE & FLIGHT #</SectionLabel>
                <TextField value={flightInfo} onChangeText={setFlightInfo} placeholder={toAirport ? 'Delta DL 1234' : 'Delta DL 5678'} testID="create-flightinfo" />
              </View>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 24 }}>
                <SectionLabel>CHECKED BAGS</SectionLabel>
                <Stepper value={bags} onChange={setBags} testID="create-bags" />
              </View>
              <View style={{ marginBottom: 24 }}>
                <SectionLabel hint="(PRIVATE — VISIBLE TO BOOKER ONLY)">{toAirport ? 'PICKUP ADDRESS' : 'DROP-OFF ADDRESS'}</SectionLabel>
                <TextField value={address} onChangeText={setAddress} placeholder={toAirport ? '123 State st, Ann Arbor' : '456 S University Ave, Ann Arbor, MI'} testID="create-address" autoCapitalize="words" />
              </View>
              <View className="flex-row items-center justify-between" style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 0.4 }}>I&rsquo;M FLEXIBLE ON TIMING</Text>
                <Switch value={flexible} onValueChange={setFlexible} testID="create-flexible" />
              </View>
            </>
          )}

          {/* Auto-calculated box (airport destinations only) */}
          {!isCustom ? (
            <View className="rounded-[16px] p-4" style={{ backgroundColor: '#EBF0F5', marginBottom: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: INK, marginBottom: 10 }}>Auto-calculate</Text>
              {toAirport ? (
                <>
                  <View className="flex-row justify-between" style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, color: SUB }}>Suggested departure</Text>
                    <Text testID="create-departure" style={{ fontSize: 14, fontWeight: '700', color: INK }}>~{formatTime(departure)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text style={{ fontSize: 14, color: SUB }}>Book by</Text>
                    <Text testID="create-bookby" style={{ fontSize: 14, fontWeight: '700', color: AMBER }}>~{formatTime(bookBy)}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View className="flex-row justify-between" style={{ marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, color: SUB }}>Ready for pickup</Text>
                    <Text testID="create-readypickup" style={{ fontSize: 14, fontWeight: '700', color: INK }}>~{formatTime(readyPickup)}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text style={{ fontSize: 14, color: SUB }}>Includes</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: INK }}>Deplane + bags + walk</Text>
                  </View>
                </>
              )}
            </View>
          ) : null}

          {error ? <Text testID="create-error" style={{ color: '#C0392B', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</Text> : null}

          <Pressable
            testID="create-submit"
            onPress={submit}
            disabled={submitting}
            className="rounded-[14px] items-center justify-center"
            style={[{ backgroundColor: NAVY, paddingVertical: 17, marginHorizontal: 4, opacity: submitting ? 0.7 : 1 }, { shadowColor: '#2C3A4B', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{mode === 'private' ? 'Create & Get Invite Link' : 'Post Ride'}</Text>
            )}
          </Pressable>
          {mode === 'private' ? (
            <Text style={{ textAlign: 'center', fontSize: 13, color: MUTED, marginTop: 16, lineHeight: 19 }}>
              Share the link with friends.{'\n'}They&rsquo;ll need an .edu email to join.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Time / Date picker */}
      <Modal transparent visible={!!picker} animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setPicker(null)}>
          <Pressable className="bg-bg rounded-t-[24px] px-6" style={{ paddingTop: 20, paddingBottom: insets.bottom + 20 }} onPress={() => {}}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 16 }}>{picker === 'time' ? 'Select time' : 'Select date'}</Text>
            {picker === 'time' ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
                  {HOURS.map((h) => <Chip key={h} label={String(h)} active={hour === h} onPress={() => setHour(h)} testID={`pick-hour-${h}`} />)}
                </ScrollView>
                <View className="flex-row" style={{ gap: 8, marginBottom: 8 }}>
                  {MINS.map((m) => <Chip key={m} label={`:${m}`} active={minute === m} onPress={() => setMinute(m)} testID={`pick-min-${m}`} />)}
                  <View style={{ width: 8 }} />
                  {['AM', 'PM'].map((p) => <Chip key={p} label={p} active={ampm === p} onPress={() => setAmpm(p)} testID={`pick-ampm-${p}`} />)}
                </View>
              </>
            ) : (
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {days.map((d, i) => (
                    <Chip key={i} label={`${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getMonth() + 1}/${d.getDate()}`} active={dayOffset === i} onPress={() => setDayOffset(i)} testID={`pick-day-${i}`} />
                  ))}
                </View>
              </ScrollView>
            )}
            <Pressable testID="pick-done" onPress={() => setPicker(null)} className="rounded-[14px] items-center" style={{ backgroundColor: NAVY, paddingVertical: 15, marginTop: 18 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
