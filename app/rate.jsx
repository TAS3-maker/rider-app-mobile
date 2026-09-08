import { useCallback, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Star } from 'lucide-react-native';
import { ratingsApi } from '@/api/social';
import { groupsApi } from '@/api/rides';

const INK = '#1E2A38';
const SUB = '#8A94A0';
const NAVY = '#2C3A4B';
const EMPTY = '#D3D9DF';

const CARD_SHADOW = { shadowColor: '#2C3A4B', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 };

function Stars({ value, onChange, testIDPrefix }) {
  return (
    <View className="flex-row items-center justify-center" style={{ gap: 10 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} testID={`${testIDPrefix}-${n}`} onPress={() => onChange(n)} hitSlop={6}>
          <Star size={34} color={n <= value ? NAVY : EMPTY} fill={n <= value ? NAVY : EMPTY} />
        </Pressable>
      ))}
    </View>
  );
}

export default function Rate() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let on = true;
    if (!groupId) { setLoading(false); return () => { on = false; }; }
    ratingsApi.pending(groupId)
      .then(async (r) => {
        if (!on) return;
        // Enrich with booker flag + avatar from the group (ratings/pending doesn't provide them).
        let meta = {};
        try {
          const g = await groupsApi.get(groupId);
          const bookerId = g?.data?.bookerId;
          (g?.data?.members || []).forEach((m) => {
            meta[String(m.userId)] = { isBooker: String(bookerId) === String(m.userId), profileImage: m.profileImage };
          });
        } catch { /* ignore */ }
        if (!on) return;
        const list = (r.data || []).filter((m) => !m.alreadyRated).map((m) => ({ ...m, ...(meta[String(m.userId)] || {}) }));
        setMembers(list);
        const init = {};
        list.forEach((m) => { init[m.userId] = { reliability: 5, punctuality: 5 }; });
        setForm(init);
      })
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [groupId]));

  const setField = (uid, key, val) => setForm((f) => ({ ...f, [uid]: { ...f[uid], [key]: val } }));

  const submit = async () => {
    setBusy(true); setError('');
    try {
      for (const m of members) {
        const v = form[m.userId];
        await ratingsApi.submit({ groupId, toUser: m.userId, reliabilityStars: v.reliability, punctualityStars: v.punctuality, confirmed: true });
      }
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e.message || 'Could not submit ratings');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View style={{ paddingTop: 14, paddingBottom: 14, alignItems: 'center' }}>
        <Text testID="rate-header" style={{ fontSize: 32, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>Rate Riders</Text>
        <Text style={{ fontSize: 15, color: SUB, marginTop: 4 }}>How was your ride with</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color={NAVY} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          {members.length === 0 ? (
            <View className="items-center px-8 py-16">
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#E7EBEF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Star size={30} color={NAVY} fill={NAVY} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 4 }}>All set</Text>
              <Text style={{ fontSize: 14, color: SUB, textAlign: 'center' }}>You&rsquo;ve rated everyone in this group.</Text>
            </View>
          ) : (
            members.map((m) => {
              const v = form[m.userId];
              return (
                <View key={m.userId} testID={`rate-card-${m.userId}`} className="rounded-[20px] bg-white p-5 items-center" style={[{ marginBottom: 22 }, CARD_SHADOW]}>
                  {m.profileImage ? (
                    <Image source={{ uri: m.profileImage }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                  ) : (
                    <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#E7EBEF', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: NAVY }}>{m.initials}</Text>
                    </View>
                  )}
                  <Text style={{ fontSize: 16, fontWeight: '800', color: INK, marginTop: 10 }}>{m.name}</Text>
                  {m.isBooker ? (
                    <View style={{ backgroundColor: '#F8F1E7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 3, marginTop: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#C98A34' }}>BOOKER</Text>
                    </View>
                  ) : null}

                  <Text style={{ fontSize: 13, fontWeight: '700', color: SUB, letterSpacing: 0.8, marginTop: 22, marginBottom: 12 }}>RELIABILITY</Text>
                  <Stars value={v.reliability} onChange={(n) => setField(m.userId, 'reliability', n)} testIDPrefix={`rate-rel-${m.userId}`} />

                  <Text style={{ fontSize: 13, fontWeight: '700', color: SUB, letterSpacing: 0.8, marginTop: 24, marginBottom: 12 }}>PUNCTUALITY</Text>
                  <Stars value={v.punctuality} onChange={(n) => setField(m.userId, 'punctuality', n)} testIDPrefix={`rate-pun-${m.userId}`} />
                </View>
              );
            })
          )}
          {error ? <Text testID="rate-error" style={{ color: '#C0392B', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>{error}</Text> : null}
          {members.length ? (
            <Pressable testID="rate-submit" onPress={submit} disabled={busy} className="rounded-[14px] items-center justify-center" style={[{ backgroundColor: NAVY, paddingVertical: 17, marginTop: 4 }, CARD_SHADOW]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Submit Ratings</Text>}
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
