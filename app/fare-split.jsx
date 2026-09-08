import { useCallback, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, User } from 'lucide-react-native';
import { groupsApi, faresApi } from '@/api/rides';
import { useAuth } from '@/context/AuthContext';
import RovoCar from '@/components/RovoCar';
import RovoCloud from '@/components/RovoCloud';

const INK = '#1E2A38';
const SUB = '#6B7480';
const MUTED = '#9AA6B2';
const NAVY = '#2C3A4B';
const GREEN = '#3E9E75';
const AMBER = '#E0913C';

const CARD_SHADOW = { shadowColor: '#2C3A4B', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 };

export default function FareSplit() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { groupId } = useLocalSearchParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fareInput, setFareInput] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await groupsApi.get(groupId);
      setGroup(res.data);
      if (res.data.fare) setFareInput(String(res.data.fare.totalCost));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading || !group) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          {loading ? <ActivityIndicator color={NAVY} size="large" /> : <Text style={{ color: SUB }}>{error || 'Not found'}</Text>}
        </View>
      </View>
    );
  }

  const fare = group.fare;
  const isBooker = group.isCurrentUserBooker;
  const members = group.members || [];
  const nameOf = (uid) => { const m = members.find((x) => String(x.userId) === String(uid)); return m ? m.name : 'Rider'; };
  const isBookerUid = (uid) => String(group.bookerId) === String(uid);
  const myShare = fare && (fare.shares || []).find((s) => String(s.user) === String(user?.id));

  async function act(fn) {
    setBusy(true); setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message || 'Something went wrong'); } finally { setBusy(false); }
  }
  const saveFare = () => {
    const val = parseFloat(fareInput);
    if (!val || val <= 0) return setError('Enter a valid fare amount');
    act(async () => { await faresApi.enter(groupId, val); });
  };
  const completeRide = () => act(async () => { await groupsApi.complete(groupId); router.push({ pathname: '/rate', params: { groupId } }); });
  const markReceived = (uid) => act(async () => { await faresApi.confirm(groupId, uid); });
  const iPaidContinue = () => act(async () => { await faresApi.confirm(groupId); router.push({ pathname: '/rate', params: { groupId } }); });

  const copyPay = async () => {
    if (!myShare) return;
    await Clipboard.setStringAsync(`$${myShare.amount.toFixed(2)} ${fare.bookerPaymentHandle || 'booker'}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  function Avatar({ m, size = 44 }) {
    if (m && m.profileImage) return <Image source={{ uri: m.profileImage }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
    if (m && m.initials) return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E7EBEF', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: NAVY }}>{m.initials}</Text>
      </View>
    );
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E7EBEF', alignItems: 'center', justifyContent: 'center' }}>
        <User size={20} color={NAVY} />
      </View>
    );
  }

  // ---------- RIDER VIEW (dark "Ride Complete") ----------
  if (!isBooker) {
    return (
      <View className="flex-1" style={{ backgroundColor: NAVY, paddingTop: insets.top }}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ position: 'absolute', top: insets.top + 60, right: 24 }}><RovoCloud width={90} color="#FFFFFF" /></View>
          <View style={{ paddingHorizontal: 24, paddingTop: 18 }}>
            <RovoCar width={200} color="#FFFFFF" />
            <Text style={{ fontSize: 58, lineHeight: 60, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 2 }}>Ride</Text>
            <Text style={{ fontSize: 58, lineHeight: 60, fontWeight: '800', color: '#fff', letterSpacing: -1 }}>Complete</Text>
          </View>

          <Text style={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 12, fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.8 }}>FARE SPLIT</Text>

          {fare ? (
            <View className="rounded-[18px] bg-white p-5" style={[{ marginHorizontal: 24 }, CARD_SHADOW]}>
              <View className="flex-row items-center justify-between" style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0ECE3' }}>
                <Text style={{ fontSize: 15, color: SUB }}>Total Fare</Text>
                <Text testID="fare-total" style={{ fontSize: 16, fontWeight: '800', color: INK }}>${fare.totalCost.toFixed(2)}</Text>
              </View>
              {(fare.shares || []).map((s) => {
                const mine = String(s.user) === String(user?.id);
                const booker = isBookerUid(s.user);
                const label = mine ? `You (${s.percent}%)` : booker ? `${nameOf(s.user)} (Booker · ${s.percent}%)` : `${nameOf(s.user)} (${s.percent}%)`;
                return (
                  <View key={String(s.user)} className="flex-row items-center justify-between" style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0ECE3' }}>
                    <Text style={{ fontSize: 15, fontWeight: mine ? '800' : '500', color: mine ? INK : MUTED }}>{label}</Text>
                    <Text style={{ fontSize: 16, fontWeight: mine ? '800' : '600', color: INK }}>${s.amount.toFixed(2)}</Text>
                  </View>
                );
              })}
              {myShare ? (
                <>
                  <Pressable testID="fare-copy" onPress={copyPay} className="rounded-[12px] items-center justify-center" style={{ backgroundColor: NAVY, paddingVertical: 14, marginTop: 16 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>
                      {copied ? 'Copied!' : `Copy $${myShare.amount.toFixed(2)} Pay ${fare.bookerPaymentHandle || 'booker'}`}
                    </Text>
                  </Pressable>
                  <Text style={{ textAlign: 'center', fontSize: 13, color: MUTED, marginTop: 10 }}>Tap to copy amount and Venmo handle</Text>
                </>
              ) : null}
            </View>
          ) : (
            <View className="rounded-[18px] bg-white p-6 items-center" style={[{ marginHorizontal: 24 }, CARD_SHADOW]}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>Waiting for the booker</Text>
              <Text style={{ fontSize: 13, color: SUB, textAlign: 'center', marginTop: 4 }}>Your share appears once the booker enters the fare.</Text>
            </View>
          )}

          {fare ? (
            <>
              <Text style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 12, fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 0.8 }}>PAYMENT STATUS</Text>
              <View className="rounded-[18px] bg-white" style={[{ marginHorizontal: 24, paddingHorizontal: 16 }, CARD_SHADOW]}>
                {(fare.shares || []).map((s, i) => {
                  const m = members.find((x) => String(x.userId) === String(s.user));
                  const mine = String(s.user) === String(user?.id);
                  return (
                    <View key={String(s.user)} testID={`fare-status-${i}`} className="flex-row items-center" style={{ paddingVertical: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0ECE3' }}>
                      <Avatar m={mine ? { ...m } : m} size={40} />
                      <Text style={{ fontSize: 16, fontWeight: '800', color: INK, marginLeft: 12 }}>{mine ? 'You' : nameOf(s.user)}</Text>
                      {isBookerUid(s.user) ? (
                        <View style={{ backgroundColor: '#F8F1E7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#C98A34' }}>BOOKER</Text>
                        </View>
                      ) : null}
                      <View style={{ flex: 1 }} />
                      {s.paymentConfirmed ? (
                        <Text style={{ fontSize: 13, fontWeight: '800', color: GREEN, letterSpacing: 0.5 }}>PAID</Text>
                      ) : (
                        <View style={{ backgroundColor: '#FBEFDD', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#B9822F', letterSpacing: 0.5 }}>PENDING</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              <Pressable testID="fare-i-paid" onPress={iPaidContinue} disabled={busy} className="rounded-[14px] items-center justify-center" style={{ backgroundColor: '#F4EFE6', paddingVertical: 16, marginHorizontal: 24, marginTop: 24 }}>
                {busy ? <ActivityIndicator color={NAVY} /> : <Text style={{ fontSize: 16, fontWeight: '700', color: INK }}>I&rsquo;ve Paid → Continue to Rating</Text>}
              </Pressable>
            </>
          ) : null}
          {error ? <Text testID="fare-error" style={{ color: '#FF8A80', fontSize: 13, textAlign: 'center', marginTop: 12 }}>{error}</Text> : null}
        </ScrollView>
      </View>
    );
  }

  // ---------- BOOKER VIEW ("Fare Split") ----------
  const val = parseFloat(fareInput) || 0;
  const N = members.length || 1;
  const rows = members.map((m) => {
    const s = fare && (fare.shares || []).find((x) => String(x.user) === String(m.userId));
    return {
      uid: m.userId,
      name: m.name,
      booker: isBookerUid(m.userId),
      percent: s ? s.percent : Math.round(100 / N),
      amount: s ? s.amount : val / N,
      paymentConfirmed: s ? s.paymentConfirmed : false,
    };
  });
  const finalized = fare && fare.finalized;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center" style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 }}>
        <Pressable testID="fare-back" onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}><ArrowLeft size={26} color={INK} /></Pressable>
        <Text testID="fare-header" style={{ fontSize: 30, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>Fare Split</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="rounded-[20px] bg-white overflow-hidden" style={[{ marginHorizontal: 24, marginTop: 6 }, CARD_SHADOW]}>
            <View style={{ backgroundColor: NAVY, paddingVertical: 22, alignItems: 'center' }}>
              <Text style={{ fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 }}>Ride Complete</Text>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: INK, letterSpacing: 0.3 }}>ENTER ACTUAL FARE</Text>
              <Text style={{ fontSize: 13, color: SUB, marginTop: 3 }}>Enter total fare from Uber/Lyft receipt</Text>

              <View className="flex-row items-center justify-center" style={{ marginTop: 18, marginBottom: 18 }}>
                <Text style={{ fontSize: 40, fontWeight: '800', color: INK, marginTop: 8 }}>$</Text>
                <TextInput
                  testID="fare-input"
                  value={fareInput}
                  onChangeText={setFareInput}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#C7CDD4"
                  style={{ fontSize: 64, fontWeight: '800', color: INK, minWidth: 60, textAlign: 'center', padding: 0 }}
                />
              </View>

              {rows.map((r, i) => (
                <View key={String(r.uid)} className="flex-row items-center" style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0ECE3' }}>
                  <Text style={{ fontSize: 15, fontWeight: r.booker ? '800' : '500', color: r.booker ? INK : MUTED }}>
                    {r.booker ? 'You' : r.name} ({r.percent}%)
                  </Text>
                  {r.booker ? (
                    <View style={{ backgroundColor: '#F8F1E7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#C98A34' }}>BOOKER</Text>
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }} />
                  <Text style={{ fontSize: 16, fontWeight: r.booker ? '800' : '600', color: INK }}>${r.amount.toFixed(2)}</Text>
                </View>
              ))}

              <Pressable
                testID={finalized ? 'fare-complete' : 'fare-save'}
                onPress={finalized ? completeRide : saveFare}
                disabled={busy}
                className="rounded-[12px] items-center justify-center"
                style={{ backgroundColor: NAVY, paddingVertical: 15, marginTop: 14 }}
              >
                {busy ? <ActivityIndicator color="#fff" /> : (
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>{finalized ? 'Complete Ride → Rate Riders' : 'Confirm & Send Split to Riders'}</Text>
                )}
              </Pressable>
            </View>
          </View>

          {fare ? (
            <>
              <Text style={{ paddingHorizontal: 24, paddingTop: 26, paddingBottom: 12, fontSize: 15, fontWeight: '800', color: INK, letterSpacing: 0.3 }}>PAYMENT TRACKING</Text>
              <View className="rounded-[16px] bg-white" style={[{ marginHorizontal: 24, paddingHorizontal: 16 }, CARD_SHADOW]}>
                {rows.filter((r) => !r.booker).map((r, i, arr) => {
                  const m = members.find((x) => String(x.userId) === String(r.uid));
                  return (
                    <View key={String(r.uid)} testID={`fare-track-${i}`} className="flex-row items-center" style={{ paddingVertical: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0ECE3' }}>
                      <Avatar m={m} size={40} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>{r.name}</Text>
                        <Text style={{ fontSize: 13, color: SUB, marginTop: 1 }}>Owes ${r.amount.toFixed(2)}</Text>
                      </View>
                      {r.paymentConfirmed ? (
                        <Text style={{ fontSize: 14, fontWeight: '800', color: GREEN }}>Received</Text>
                      ) : (
                        <Pressable testID={`fare-mark-${i}`} onPress={() => markReceived(r.uid)} disabled={busy} className="rounded-[10px] items-center justify-center" style={{ backgroundColor: GREEN, paddingHorizontal: 16, paddingVertical: 11 }}>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Mark Received</Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}
                <Text style={{ textAlign: 'center', fontSize: 12, color: MUTED, paddingVertical: 12 }}>Unpaid riders auto-flagged after 24 hours</Text>
              </View>
            </>
          ) : null}
          {error ? <Text testID="fare-error" style={{ color: '#C0392B', fontSize: 13, textAlign: 'center', marginTop: 12 }}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
