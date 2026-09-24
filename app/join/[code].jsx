import { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Users } from 'lucide-react-native';
import { groupsApi } from '@/api/rides';
import { useAuth } from '@/context/AuthContext';
import { formatTime, formatDate } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const MUTED = '#9AA6B2';
const NAVY = '#2C3A4B';

const CARD_SHADOW = { shadowColor: '#2C3A4B', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 };
const MIN_MS = 60000;
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINS = ['00', '15', '30', '45'];

function FieldButton({ value, placeholder, onPress, testID }) {
  return (
    <Pressable testID={testID} onPress={onPress} className="rounded-[14px] bg-white px-4" style={[{ paddingVertical: 16 }, CARD_SHADOW]}>
      <Text style={{ fontSize: 16, color: value ? SUB : MUTED }}>{value || placeholder}</Text>
    </Pressable>
  );
}

function TextField({ value, onChangeText, placeholder, testID }) {
  return (
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={MUTED}
      autoCapitalize="words"
      className="rounded-[14px] bg-white px-4"
      style={[{ paddingVertical: 16, fontSize: 16, color: INK }, CARD_SHADOW]}
    />
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

export default function JoinByInvite() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { code } = useLocalSearchParams();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [hour, setHour] = useState(5);
  const [minute, setMinute] = useState('15');
  const [ampm, setAmpm] = useState('PM');
  const [dayOffset, setDayOffset] = useState(0);
  const [bags, setBags] = useState(0);
  const [address, setAddress] = useState('');
  const [picker, setPicker] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await groupsApi.previewInvite(code);
      setPreview(res.data);
    } catch (e) {
      setError(e.message || 'This invite link is invalid or has expired');
    } finally {
      setLoading(false);
    }
  }, [code]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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

  const Header = () => (
    <View className="flex-row items-center" style={{ paddingTop: insets.top + 6, paddingBottom: 12, paddingHorizontal: 20 }}>
      <Pressable testID="join-back" onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
        <ArrowLeft size={26} color={INK} />
      </Pressable>
      <Text style={{ fontSize: 26, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>Join Ride Group</Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-bg">
        <Header />
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={NAVY} size="large" /></View>
      </View>
    );
  }

  if (error || !preview) {
    return (
      <View className="flex-1 bg-bg">
        <Header />
        <Text style={{ textAlign: 'center', color: SUB, marginTop: 40, paddingHorizontal: 32 }}>{error || 'Invite not found'}</Text>
      </View>
    );
  }

  // Must be signed in (and .edu-verified, enforced by requireAuth) before joining.
  if (!user) {
    return (
      <View className="flex-1 bg-bg">
        <Header />
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <Text style={{ fontSize: 16, color: SUB, marginBottom: 20, textAlign: 'center' }}>
            Sign in with your verified .edu email to join this ride group.
          </Text>
          <Pressable
            testID="join-signin"
            onPress={() => router.push({ pathname: '/(auth)/signin', params: { redirect: `/join/${code}` } })}
            className="rounded-[14px] items-center justify-center"
            style={{ backgroundColor: NAVY, paddingVertical: 16 }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (preview.full) {
    return (
      <View className="flex-1 bg-bg">
        <Header />
        <Text style={{ textAlign: 'center', color: SUB, marginTop: 40, paddingHorizontal: 32 }}>This ride group is already full.</Text>
      </View>
    );
  }

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      await groupsApi.joinInvite(code, {
        flightTime: flightDate.toISOString(),
        checkedBags: bags,
        pickupLocation: address,
      });
      router.replace({ pathname: '/group', params: { id: preview.id } });
    } catch (e) {
      setError(e.message || 'Could not join this group');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <Header />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="rounded-[20px] bg-white p-5" style={[{ marginBottom: 24 }, CARD_SHADOW]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 8 }}>{preview.destination}</Text>
            <Text style={{ fontSize: 14, color: SUB, marginBottom: 4 }}>{formatDate(preview.travelDate)}</Text>
            <Text style={{ fontSize: 14, color: SUB, marginBottom: 12 }}>~{formatTime(preview.suggestedDeparture)} suggested departure</Text>
            <View className="flex-row items-center">
              <Users size={14} color={SUB} />
              <Text style={{ fontSize: 13, color: SUB, marginLeft: 6 }}>{preview.memberCount}/{preview.capacity} riders so far</Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 0.4, marginBottom: 10 }}>YOUR FLIGHT TIME</Text>
          <View style={{ marginBottom: 20 }}>
            <FieldButton value={formatTime(flightDate)} onPress={() => setPicker('time')} testID="join-time" />
          </View>

          <Text style={{ fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 0.4, marginBottom: 10 }}>TRAVEL DATE</Text>
          <View style={{ marginBottom: 20 }}>
            <FieldButton value={formatDate(flightDate)} onPress={() => setPicker('date')} testID="join-date" />
          </View>

          <View className="flex-row items-center justify-between" style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 0.4 }}>CHECKED BAGS</Text>
            <Stepper value={bags} onChange={setBags} testID="join-bags" />
          </View>

          <Text style={{ fontSize: 13, fontWeight: '700', color: INK, letterSpacing: 0.4, marginBottom: 10 }}>PICKUP ADDRESS (PRIVATE — VISIBLE TO BOOKER ONLY)</Text>
          <View style={{ marginBottom: 24 }}>
            <TextField value={address} onChangeText={setAddress} placeholder="123 State St, Ann Arbor" testID="join-address" />
          </View>

          {error ? <Text style={{ color: '#C0392B', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</Text> : null}

          <Pressable
            testID="join-submit"
            onPress={submit}
            disabled={submitting}
            className="rounded-[14px] items-center justify-center"
            style={[{ backgroundColor: NAVY, paddingVertical: 17, opacity: submitting ? 0.7 : 1 }, CARD_SHADOW]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Join Group</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent visible={!!picker} animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setPicker(null)}>
          <Pressable className="bg-bg rounded-t-[24px] px-6" style={{ paddingTop: 20, paddingBottom: insets.bottom + 20 }} onPress={() => {}}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 16 }}>{picker === 'time' ? 'Select time' : 'Select date'}</Text>
            {picker === 'time' ? (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
                  {HOURS.map((h) => <Chip key={h} label={String(h)} active={hour === h} onPress={() => setHour(h)} testID={`join-pick-hour-${h}`} />)}
                </ScrollView>
                <View className="flex-row" style={{ gap: 8, marginBottom: 8 }}>
                  {MINS.map((m) => <Chip key={m} label={`:${m}`} active={minute === m} onPress={() => setMinute(m)} testID={`join-pick-min-${m}`} />)}
                  <View style={{ width: 8 }} />
                  {['AM', 'PM'].map((p) => <Chip key={p} label={p} active={ampm === p} onPress={() => setAmpm(p)} testID={`join-pick-ampm-${p}`} />)}
                </View>
              </>
            ) : (
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {days.map((d, i) => (
                    <Chip key={i} label={`${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getMonth() + 1}/${d.getDate()}`} active={dayOffset === i} onPress={() => setDayOffset(i)} testID={`join-pick-day-${i}`} />
                  ))}
                </View>
              </ScrollView>
            )}
            <Pressable testID="join-pick-done" onPress={() => setPicker(null)} className="rounded-[14px] items-center" style={{ backgroundColor: NAVY, paddingVertical: 15, marginTop: 18 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}