import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, FlatList, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ArrowUp, Pin, ChevronDown, ChevronUp } from 'lucide-react-native';
import { groupsApi } from '@/api/rides';
import { chatApi } from '@/api/social';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { formatTime, countdown } from '@/lib/format';

const INK = '#1E2A38';
const SUB = '#6B7480';
const MUTED = '#9AA6B2';
const NAVY = '#2C3A4B';
const RED = '#D9524A';
const CAMPUS = 'UMich';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function initialsOf(name) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}

export default function GroupChat() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { getSocket } = useSocket();
  const { groupId } = useLocalSearchParams();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(true);
  const ids = useRef(new Set());

  const addMessages = useCallback((arr, toEnd) => {
    setMessages((prev) => {
      const fresh = arr.filter((m) => !ids.current.has(String(m.id)));
      fresh.forEach((m) => ids.current.add(String(m.id)));
      return toEnd ? [...prev, ...fresh] : [...fresh, ...prev];
    });
  }, []);

  const loadPage = useCallback(async (p) => {
    const res = await chatApi.history(groupId, p, 20);
    setTotal(res.total);
    setPage(p);
    addMessages(res.data, true);
  }, [groupId, addMessages]);

  useFocusEffect(useCallback(() => {
    let on = true;
    (async () => {
      try {
        const g = await groupsApi.get(groupId);
        if (on) setGroup(g.data);
        await loadPage(1);
      } catch { /* ignore */ } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [groupId, loadPage]));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('chat:join', groupId);
    const onMsg = (m) => { if (String(m.group) === String(groupId)) addMessages([m], false); };
    socket.on('chat:message', onMsg);
    return () => { socket.emit('chat:leave', groupId); socket.off('chat:message', onMsg); };
  }, [getSocket, groupId, addMessages]);

  const onEndReached = () => {
    if (loadingMore || loading || messages.length >= total) return;
    setLoadingMore(true);
    loadPage(page + 1).finally(() => setLoadingMore(false));
  };

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    try {
      const res = await chatApi.send(groupId, t);
      addMessages([res.data], false);
    } catch { setText(t); }
  };

  const booked = group && ['confirmed', 'in_progress', 'completed'].includes(group.status);
  const cd = group ? countdown(group.bookingDeadline) : { text: '', urgent: false, passed: false };
  const code = group && group.airport ? group.airport.code : (group?.customDestinationName || 'DTW');
  const route = group ? (group.direction === 'airport_to_university' ? `${code}  →  ${CAMPUS}` : `${CAMPUS}  →  ${code}`) : '';
  const dateStr = group && group.travelDate ? `${MONTHS[new Date(group.travelDate).getMonth()]} ${new Date(group.travelDate).getDate()}` : '';

  const onPinnedCTA = () => {
    if (!group) return;
    if (group.isCurrentUserBooker && !booked) groupsApi.book(groupId).then(() => router.push({ pathname: '/fare-split', params: { groupId } }));
    else router.push({ pathname: '/fare-split', params: { groupId } });
  };

  const renderItem = ({ item }) => {
    if (item.isSystemMessage) {
      return (
        <View className="items-center" style={{ marginVertical: 8 }} testID="chat-system-msg">
          <Text style={{ fontSize: 12, color: MUTED }}>{item.text}</Text>
        </View>
      );
    }
    const mine = item.sender && String(item.sender.id) === String(user?.id);
    const senderName = item.sender ? item.sender.name : 'Rider';
    const senderBooker = group && item.sender && String(group.bookerId) === String(item.sender.id);
    const img = item.sender && item.sender.profileImage;

    const AvatarSmall = (
      img ? <Image source={{ uri: img }} style={{ width: 34, height: 34, borderRadius: 17 }} />
        : <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: mine ? '#3A4A5C' : '#E7EBEF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: mine ? '#fff' : NAVY }}>{initialsOf(senderName)}</Text>
          </View>
    );

    return (
      <View className={`flex-row ${mine ? 'justify-end' : 'justify-start'}`} style={{ paddingHorizontal: 16, marginVertical: 6 }}>
        {!mine ? <View style={{ marginRight: 8, marginTop: 2 }}>{AvatarSmall}</View> : null}
        <View style={{ maxWidth: '76%' }}>
          <View
            className="rounded-2xl"
            style={[
              { paddingHorizontal: 14, paddingVertical: 11 },
              mine ? { backgroundColor: NAVY, borderBottomRightRadius: 6 } : { backgroundColor: '#fff', borderBottomLeftRadius: 6, shadowColor: '#2C3A4B', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
            ]}
          >
            {mine ? <View style={{ position: 'absolute', left: -42, top: 0 }}>{AvatarSmall}</View> : null}
            <Text style={{ fontSize: 14.5, lineHeight: 20, color: mine ? '#fff' : INK }}>{item.text}</Text>
            <View className="flex-row items-center justify-end" style={{ marginTop: 5 }}>
              <Text style={{ fontSize: 11, color: mine ? 'rgba(255,255,255,0.65)' : MUTED }}>{senderName}</Text>
              {senderBooker ? (
                <View style={{ backgroundColor: mine ? 'rgba(255,255,255,0.15)' : '#F8F1E7', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: mine ? '#fff' : '#C98A34' }}>BOOKER</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 }}>
        <View className="flex-row items-center">
          <Pressable testID="chat-back" onPress={() => router.back()} style={{ padding: 4, marginRight: 6 }}><ArrowLeft size={26} color={INK} /></Pressable>
          <Text testID="chat-header" style={{ fontSize: 28, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>{route}</Text>
        </View>
        {dateStr ? <Text style={{ textAlign: 'center', fontSize: 14, fontWeight: '700', color: MUTED, marginTop: -2 }}>{dateStr}</Text> : null}
      </View>

      {/* Pinned Ride Details */}
      {group ? (
        <View testID="chat-pinned" className="rounded-[16px]" style={{ marginHorizontal: 16, marginBottom: 4, backgroundColor: '#E7EDF3', borderWidth: 1, borderColor: '#D3DEE8', padding: 14 }}>
          <Pressable className="flex-row items-center justify-between" onPress={() => setExpanded((e) => !e)}>
            <View className="flex-row items-center">
              <Pin size={16} color={INK} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: INK, marginLeft: 8 }}>Ride Details</Text>
            </View>
            {expanded ? <ChevronDown size={20} color={INK} /> : <ChevronUp size={20} color={INK} />}
          </Pressable>
          {expanded ? (
            <View style={{ marginTop: 10 }}>
              <View className="flex-row justify-between" style={{ marginBottom: 5 }}>
                <Text style={{ fontSize: 14, color: SUB }}>Depart</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: INK }}>~{formatTime(group.suggestedDeparture)}</Text>
              </View>
              <View className="flex-row justify-between" style={{ marginBottom: 5 }}>
                <Text style={{ fontSize: 14, color: SUB }}>Book By</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: cd.urgent ? RED : INK }}>{formatTime(group.bookingDeadline)}</Text>
              </View>
              <View className="flex-row justify-between" style={{ marginBottom: 5 }}>
                <Text style={{ fontSize: 14, color: SUB }}>Vehicle</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: INK }}>{group.vehicleSuggestion || 'UberX'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ fontSize: 14, color: SUB }}>Est. fare</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: INK }}>${group.perPerson}/person</Text>
              </View>
              <Pressable testID="chat-book-now" onPress={onPinnedCTA} className="rounded-[12px] items-center justify-center" style={{ backgroundColor: '#fff', paddingVertical: 13, marginTop: 12, shadowColor: '#2C3A4B', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: INK }}>{booked ? 'View Fare Split' : `Save ~${group.savingsPct || 0}% vs $${group.soloFareEstimate} Riding Solo`}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" keyboardVerticalOffset={insets.top + 56}>
        {loading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator color={NAVY} /></View>
        ) : (
          <FlatList
            testID="chat-list"
            inverted
            data={messages}
            keyExtractor={(m) => String(m.id)}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.3}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={NAVY} style={{ marginVertical: 12 }} /> : null}
          />
        )}

        {!booked && cd.text && !cd.passed ? (
          <Text testID="chat-deadline" style={{ textAlign: 'center', fontSize: 13, color: RED, paddingVertical: 8 }}>Booking deadline: {cd.text.replace(' left', '')} remaining</Text>
        ) : null}

        <View className="flex-row items-center" style={{ gap: 10, paddingHorizontal: 16, paddingTop: 8, backgroundColor: 'transparent', paddingBottom: insets.bottom + 10 }}>
          <TextInput
            testID="chat-input"
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={MUTED}
            className="flex-1 rounded-full"
            style={{ paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#EDEEF0', fontSize: 15, color: INK }}
            onSubmitEditing={send}
          />
          <Pressable testID="chat-send" onPress={send} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUp size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
