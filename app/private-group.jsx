import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Copy, Share2, Users } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { groupsApi } from '@/api/rides';
import { useAuth } from '@/context/AuthContext';
import { formatTime, formatDate } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const MUTED = '#9AA6B2';
const NAVY = '#2C3A4B';
const AMBER = '#E0913C';

const CARD_SHADOW = { shadowColor: '#2C3A4B', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 };

// TODO: confirm the real domain/deep-link scheme for invite links before shipping.
const INVITE_BASE_URL = 'https://rovo.app/join';

function Row({ label, value, first }) {
  return (
    <View className="flex-row items-center justify-between" style={{ paddingVertical: 12, borderTopWidth: first ? 0 : 1, borderTopColor: '#F0ECE3' }}>
      <Text style={{ fontSize: 15, color: SUB }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>{value}</Text>
    </View>
  );
}

export default function PrivateGroup() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await groupsApi.get(id);
      setGroup(res.data);
    } catch (e) {
      setError(e.message || 'Could not load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const Header = () => (
    <View className="flex-row items-center" style={{ paddingTop: insets.top + 6, paddingBottom: 12, paddingHorizontal: 20 }}>
      <Pressable testID="privategroup-back" onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
        <ArrowLeft size={26} color={INK} />
      </Pressable>
      <Text testID="privategroup-header" style={{ fontSize: 30, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>Private Group</Text>
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

  const destinationLabel = group.destinationType === 'custom'
    ? group.customDestinationName
    : (group.airport ? `${group.airport.code} - ${group.airport.name}` : 'Destination');

  const me = (group.members || []).find((m) => String(m.userId) === String(user?.id));
  const inviteLink = `${INVITE_BASE_URL}/${group.inviteCode}`;

  async function copyLink() {
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function shareLink() {
    try {
      await Share.share({
        message: `Join my private ride group on Rovo!\n${inviteLink}`,
        url: inviteLink, // iOS uses this; Android falls back to message
      });
    } catch (e) {
      // user cancelled or share failed silently — no need to surface an error
    }
  }

  return (
    <View className="flex-1 bg-bg">
      <Header />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Ride summary card */}
        <View className="rounded-[20px] bg-white p-5" style={[{ marginBottom: 22 }, CARD_SHADOW]}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 4 }}>{destinationLabel}</Text>
          <Row label="Departure" value={`~${formatTime(group.suggestedDeparture)}`} first />
          <Row label="Travel Date" value={formatDate(group.travelDate)} />
          <Row label="Checked Bags" value={`${(me && me.checkedBags) || 0}`} />
        </View>

        {/* Invite card */}
        <View className="rounded-[20px] bg-white p-5" style={[{ marginBottom: 22 }, CARD_SHADOW]}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: INK, marginBottom: 4 }}>Invite friends</Text>
          <Text style={{ fontSize: 13, color: SUB, marginBottom: 16 }}>They'll need to sign in with a verified .edu email to join.</Text>

          <View className="rounded-[14px] items-center" style={{ backgroundColor: '#EBF0F5', paddingVertical: 18, marginBottom: 16 }}>
            <Text testID="privategroup-code" style={{ fontSize: 22, fontWeight: '800', color: NAVY, letterSpacing: 2 }}>{group.inviteCode}</Text>
          </View>

          <Pressable
            testID="privategroup-copy"
            onPress={copyLink}
            className="rounded-[14px] items-center justify-center flex-row"
            style={[{ backgroundColor: NAVY, paddingVertical: 16, marginBottom: 12 }, CARD_SHADOW]}
          >
            <Copy size={18} color="#fff" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginLeft: 8 }}>{copied ? 'Copied!' : 'Copy Invite Link'}</Text>
          </Pressable>

          <Pressable
            testID="privategroup-share"
            onPress={shareLink}
            className="rounded-[14px] items-center justify-center flex-row"
            style={{ backgroundColor: '#EEF1F4', paddingVertical: 16 }}
          >
            <Share2 size={18} color={INK} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: INK, marginLeft: 8 }}>Share</Text>
          </Pressable>
        </View>

        {/* Riders joined so far */}
        <View className="flex-row items-center" style={{ paddingHorizontal: 4, marginBottom: 12 }}>
          <Users size={15} color={SUB} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#8A94A0', letterSpacing: 0.8, marginLeft: 6 }}>
            RIDERS · {group.memberCount}/{group.capacity}
          </Text>
        </View>
        <View className="rounded-[16px] bg-white" style={[{ paddingHorizontal: 16, marginBottom: 22 }, CARD_SHADOW]}>
          {(group.members || []).map((m, i) => (
            <View key={String(m.userId)} className="flex-row items-center" style={{ paddingVertical: 14, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F0ECE3' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E7EBEF', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: NAVY }}>{m.initials}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View className="flex-row items-center">
                  <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>{String(m.userId) === String(user?.id) ? 'You' : m.name}</Text>
                  {m.isBooker ? (
                    <View style={{ backgroundColor: '#F8F1E7', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#C98A34' }}>BOOKER</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>

        {error ? <Text style={{ color: '#C0392B', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</Text> : null}

        <Pressable
          testID="privategroup-continue"
          onPress={() => router.push({ pathname: '/group', params: { id } })}
          className="rounded-[14px] items-center justify-center"
          style={[{ backgroundColor: NAVY, paddingVertical: 17 }, CARD_SHADOW]}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Continue to Group</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}