import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Star, User, MapPin, UserCheck, Receipt } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { groupsApi } from '@/api/rides';
import { useAuth } from '@/context/AuthContext';
import { formatTime, formatDate, countdown } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const MUTED = '#9AA6B2';
const NAVY = '#2C3A4B';
const AMBER = '#E0913C';
const CAMPUS = 'UMich';

const CARD_SHADOW = { shadowColor: '#2C3A4B', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 };

function statusPill(status, mc, cap) {
  let s = { label: 'OPEN', bg: '#E4F2EA', fg: '#3E9E75' };
  if (status === 'nearly_full') s = { label: 'Nearly Full', bg: '#FBEFDD', fg: '#B9822F' };
  else if (status === 'full') s = { label: 'Full', bg: '#FBE6E3', fg: '#C0392B' };
  else if (['confirmed', 'in_progress'].includes(status)) s = { label: 'Booked', bg: '#E4F2EA', fg: '#3E9E75' };
  else if (status === 'completed') s = { label: 'Completed', bg: '#E4F2EA', fg: '#3E9E75' };
  else if (status === 'cancelled') s = { label: 'Cancelled', bg: '#FBE6E3', fg: '#C0392B' };
  return { ...s, count: `${mc}/${cap}` };
}

function Row({ label, value, valueColor = INK, first }) {
  return (
    <View className="flex-row items-center justify-between" style={{ paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: '#F0ECE3' }}>
      <Text style={{ fontSize: 15, color: SUB }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: valueColor }}>{value}</Text>
    </View>
  );
}

export default function GroupDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id, rideId } = useLocalSearchParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [pickupMode, setPickupMode] = useState('shared');
  const [addrCopied, setAddrCopied] = useState(false);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await groupsApi.get(id);
      setGroup(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const Header = () => (
    <View className="flex-row items-center" style={{ paddingTop: insets.top + 6, paddingBottom: 12, paddingHorizontal: 20 }}>
      <Pressable testID="group-back" onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
        <ArrowLeft size={26} color={INK} />
      </Pressable>
      <Text testID="group-header" style={{ fontSize: 30, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>Ride Group</Text>
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
  if (!group) {
    return (
      <View className="flex-1 bg-bg">
        <Header />
        <Text style={{ textAlign: 'center', color: SUB, marginTop: 40 }}>{error || 'Group not found'}</Text>
      </View>
    );
  }

  const code = group.airport ? group.airport.code : (group.customDestinationName || 'DTW');
  const route = group.direction === 'airport_to_university' ? `${code}  →  ${CAMPUS}` : `${CAMPUS}  →  ${code}`;
  const pill = statusPill(group.status, group.memberCount, group.capacity);
  const isMember = (group.members || []).some((m) => String(m.userId) === String(user?.id));
  const isBooker = group.isCurrentUserBooker;
  const booked = ['confirmed', 'in_progress', 'completed'].includes(group.status);
  const cd = countdown(group.bookingDeadline);

  async function act(fn) {
    setBusy(true);
    setError('');
    try { await fn(); await load(); } catch (e) { setError(e.message || 'Something went wrong'); } finally { setBusy(false); }
  }
  const doJoin = () => act(async () => { await groupsApi.join(id, rideId); });
  const doLeave = () => { setConfirmLeave(false); act(async () => { await groupsApi.leave(id); router.back(); }); };
  const doAcceptBooker = () => act(async () => { await groupsApi.setBooker(id, user.id); });
  const doBook = () => act(async () => { await groupsApi.book(id); router.push({ pathname: '/fare-split', params: { groupId: id } }); });
  const copyAllAddresses = async () => {
    const lines = (group.members || []).map((m) => `${m.name}: ${m.pickupAddress || 'No address provided'}`).join('\n');
    await Clipboard.setStringAsync(lines);
    setAddrCopied(true);
    setTimeout(() => setAddrCopied(false), 1800);
  };

  return (
    <View className="flex-1 bg-bg">
      <Header />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View className="rounded-[20px] bg-white p-5" style={[{ marginHorizontal: 20, marginBottom: 22, borderLeftWidth: 4, borderLeftColor: NAVY }, CARD_SHADOW]}>
          <View className="flex-row items-center justify-between" style={{ marginBottom: 8 }}>
            <Text testID="group-route" style={{ fontSize: 18, fontWeight: '800', color: INK }}>{route}</Text>
            <View className="flex-row items-center">
              <View style={{ backgroundColor: pill.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: pill.fg }} testID="group-status">{pill.label} · {pill.count}</Text>
              </View>
              <View className="flex-row items-center" style={{ marginLeft: 8 }}>
                {Array.from({ length: group.capacity || 4 }).map((_, i) => (
                  <User key={i} size={15} color={i < group.memberCount ? pill.fg : '#C5CCD4'} fill={i < group.memberCount ? pill.fg : 'transparent'} style={{ marginLeft: i === 0 ? 0 : -3 }} />
                ))}
              </View>
            </View>
          </View>
          <Row label="Date" value={formatDate(group.travelDate)} first />
          <Row label="Suggested Departure" value={`~${formatTime(group.suggestedDeparture)}`} />
          <Row
            label="Book By"
            value={`${formatTime(group.bookingDeadline)}${cd.text ? ` (${cd.text})` : ''}`}
            valueColor={cd.urgent ? '#C0392B' : INK}
          />
          <Row label="Vehicle" value={`${group.vehicleSuggestion || 'UberX'} recommended`} />
          <Row label="Total Bags" value={`${group.totalBags || 0} checked`} />
          <Row label="Est. fare" value={`$${group.estimatedTotalFare} total · ~$${group.perPerson}/person`} />
          <Pressable
            testID="group-save-cta"
            onPress={() => (isMember ? null : rideId ? doJoin() : null)}
            className="rounded-[14px] items-center justify-center"
            style={{ backgroundColor: NAVY, paddingVertical: 15, marginTop: 14 }}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Save ~{group.savingsPct || 0}% vs ${group.soloFareEstimate} Riding Solo</Text>
          </Pressable>
        </View>

        {isBooker ? (
          <>
            {/* Pickup Mode */}
            <View className="rounded-[16px] bg-white p-4" style={[{ marginHorizontal: 20, marginBottom: 22 }, CARD_SHADOW]}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: INK, marginBottom: 12 }}>Pickup Mode</Text>
              <View className="flex-row" style={{ gap: 12 }}>
                {[
                  { k: 'shared', title: 'Shared Pickup', sub: 'Fastest & Cheapest' },
                  { k: 'multi', title: 'Multi-stop', sub: 'Most Convenient' },
                ].map((o) => {
                  const active = pickupMode === o.k;
                  return (
                    <Pressable key={o.k} testID={`group-pickup-${o.k}`} onPress={() => setPickupMode(o.k)} style={[{ flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: 'center' }, active ? { backgroundColor: '#DFE6EE', borderColor: NAVY } : { backgroundColor: '#fff', borderColor: '#E4DFD5' }]}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: active ? INK : MUTED }}>{o.title}</Text>
                      <Text style={{ fontSize: 12, color: active ? SUB : MUTED, marginTop: 2 }}>{o.sub}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Text style={{ paddingHorizontal: 24, paddingBottom: 12, fontSize: 13, fontWeight: '700', color: '#8A94A0', letterSpacing: 0.8 }}>RIDERS · ADDRESSES VISIBLE TO YOU ONLY</Text>
            <View className="rounded-[16px] bg-white" style={[{ marginHorizontal: 20, marginBottom: 22, paddingHorizontal: 16 }, CARD_SHADOW]} testID="group-pickups">
              {(group.members || []).map((m, i) => {
                const me = String(m.userId) === String(user?.id);
                return (
                  <View key={String(m.userId)} testID={`group-rider-${i}`} className="flex-row items-center" style={{ paddingVertical: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0ECE3' }}>
                    {m.profileImage ? (
                      <Image source={{ uri: m.profileImage }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                    ) : (
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E7EBEF', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: NAVY }}>{m.initials}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <View className="flex-row items-center">
                        <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>{me ? 'You' : m.name}</Text>
                        {m.isBooker ? (
                          <View style={{ backgroundColor: '#F8F1E7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#C98A34' }}>BOOKER</Text>
                          </View>
                        ) : null}
                      </View>
                      <View className="flex-row items-center" style={{ marginTop: 3 }}>
                        <Text style={{ fontSize: 13, color: SUB }}>Flight {formatTime(m.flightTime)} · {m.checkedBags} bag{m.checkedBags === 1 ? '' : 's'}</Text>
                        {m.reliabilityScore != null ? (
                          <View className="flex-row items-center" style={{ marginLeft: 6 }}>
                            <Text style={{ color: SUB }}> · </Text>
                            <Star size={13} color={AMBER} fill={AMBER} />
                            <Text style={{ fontSize: 13, color: SUB, marginLeft: 2 }}>{m.reliabilityScore}</Text>
                          </View>
                        ) : null}
                      </View>
                      <View className="flex-row items-center" style={{ marginTop: 3 }}>
                        <MapPin size={13} color={AMBER} />
                        <Text style={{ fontSize: 13, color: me ? AMBER : SUB, marginLeft: 4 }}>{m.pickupAddress || 'No address provided'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              <Pressable testID="group-copy-addresses" onPress={copyAllAddresses} className="rounded-[12px] items-center justify-center" style={{ backgroundColor: '#EEF1F4', paddingVertical: 14, marginVertical: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>{addrCopied ? 'Copied!' : 'Copy All Addresses'}</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={{ paddingHorizontal: 24, paddingBottom: 12, fontSize: 13, fontWeight: '700', color: '#8A94A0', letterSpacing: 0.8 }}>RIDERS</Text>
            <View className="rounded-[16px] bg-white" style={[{ marginHorizontal: 20, marginBottom: 22, paddingHorizontal: 16 }, CARD_SHADOW]}>
              {(group.members || []).map((m, i) => (
                <View key={String(m.userId)} testID={`group-rider-${i}`} className="flex-row items-center" style={{ paddingVertical: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0ECE3' }}>
                  {m.profileImage ? (
                    <Image source={{ uri: m.profileImage }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E7EBEF', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: NAVY }}>{m.initials}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <View className="flex-row items-center">
                      <Text style={{ fontSize: 16, fontWeight: '800', color: INK }}>{m.name}</Text>
                      {m.isBooker ? (
                        <View style={{ backgroundColor: '#F8F1E7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: '#C98A34' }}>BOOKER</Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="flex-row items-center" style={{ marginTop: 3 }}>
                      <Text style={{ fontSize: 13, color: SUB }}>Flight {formatTime(m.flightTime)} · {m.checkedBags} bag{m.checkedBags === 1 ? '' : 's'}</Text>
                      {m.reliabilityScore != null ? (
                        <View className="flex-row items-center" style={{ marginLeft: 6 }}>
                          <Text style={{ color: SUB }}> · </Text>
                          <Star size={13} color={AMBER} fill={AMBER} />
                          <Text style={{ fontSize: 13, color: SUB, marginLeft: 2 }}>{m.reliabilityScore}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {error ? <Text testID="group-error" style={{ paddingHorizontal: 24, marginBottom: 10, color: '#C0392B', fontSize: 13 }}>{error}</Text> : null}

        {/* Actions */}
        <View style={{ paddingHorizontal: 20 }}>
          {isBooker ? (
            <>
              {!booked ? (
                <Pressable testID="group-book-now" onPress={doBook} disabled={busy} className="rounded-[14px] items-center justify-center" style={[{ backgroundColor: NAVY, paddingVertical: 17 }, CARD_SHADOW]}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Book Ride Now</Text>}
                </Pressable>
              ) : (
                <Pressable testID="group-fare-split" onPress={() => router.push({ pathname: '/fare-split', params: { groupId: id } })} className="rounded-[14px] items-center justify-center flex-row" style={[{ backgroundColor: NAVY, paddingVertical: 17 }, CARD_SHADOW]}>
                  <Receipt size={18} color="#fff" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 }}>Fare Split</Text>
                </Pressable>
              )}
              <Pressable testID="group-chat" onPress={() => router.push({ pathname: '/group-chat', params: { groupId: id } })} style={{ alignSelf: 'center', paddingVertical: 14, marginTop: 8 }}>
                <Text style={{ fontSize: 15, color: SUB }}>or <Text style={{ fontWeight: '800', color: INK }}>Open Group Chat →</Text></Text>
              </Pressable>
            </>
          ) : (
            <>
              {group.noBookerFlag && isMember ? (
                <Pressable testID="group-accept-booker" onPress={doAcceptBooker} disabled={busy} className="rounded-[14px] items-center justify-center flex-row" style={{ backgroundColor: '#F0C24B', paddingVertical: 15, marginBottom: 12 }}>
                  <UserCheck size={18} color={INK} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: INK, marginLeft: 8 }}>Accept Booker Role</Text>
                </Pressable>
              ) : null}

              {isMember ? (
                <>
                  {booked ? (
                    <Pressable testID="group-fare-split" onPress={() => router.push({ pathname: '/fare-split', params: { groupId: id } })} className="rounded-[14px] items-center justify-center flex-row" style={[{ backgroundColor: NAVY, paddingVertical: 16, marginBottom: 12 }, CARD_SHADOW]}>
                      <Receipt size={18} color="#fff" />
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 }}>Fare Split</Text>
                    </Pressable>
                  ) : null}
                  <Pressable testID="group-chat" onPress={() => router.push({ pathname: '/group-chat', params: { groupId: id } })} className="rounded-[14px] items-center justify-center" style={[{ backgroundColor: NAVY, paddingVertical: 16 }, CARD_SHADOW]}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Group Chat</Text>
                  </Pressable>
                  <Pressable testID="group-leave" onPress={() => setConfirmLeave(true)} style={{ alignSelf: 'center', paddingVertical: 14, marginTop: 6 }}>
                    <Text style={{ fontSize: 15, color: SUB }}>Leave →</Text>
                  </Pressable>
                </>
              ) : rideId ? (
                <Pressable testID="group-join" onPress={doJoin} disabled={busy || group.status === 'full'} className="rounded-[14px] items-center justify-center" style={[{ backgroundColor: NAVY, paddingVertical: 16, opacity: group.status === 'full' ? 0.5 : 1 }, CARD_SHADOW]}>
                  {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{group.status === 'full' ? 'Group Full' : 'Join This Ride'}</Text>}
                </Pressable>
              ) : (
                <Pressable testID="group-create-to-join" onPress={() => router.push('/(tabs)/create')} className="rounded-[14px] items-center justify-center" style={[{ backgroundColor: NAVY, paddingVertical: 16 }, CARD_SHADOW]}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Create a Ride to Join</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal transparent visible={confirmLeave} animationType="fade" onRequestClose={() => setConfirmLeave(false)}>
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <View className="w-full bg-white rounded-[16px] p-5">
            <Text style={{ fontSize: 17, fontWeight: '800', color: INK, marginBottom: 6 }}>Leave this group?</Text>
            <Text style={{ fontSize: 14, color: SUB, lineHeight: 20, marginBottom: 16 }}>
              {booked ? 'The cab is already booked — you may still owe your share.' : 'Your spot will be freed up for another rider.'}
            </Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <Pressable testID="leave-cancel" onPress={() => setConfirmLeave(false)} className="flex-1 rounded-[12px] items-center" style={{ backgroundColor: '#EEF1F4', paddingVertical: 13 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>Stay</Text>
              </Pressable>
              <Pressable testID="leave-confirm" onPress={doLeave} className="flex-1 rounded-[12px] items-center" style={{ backgroundColor: '#C0392B', paddingVertical: 13 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#fff' }}>Leave</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
