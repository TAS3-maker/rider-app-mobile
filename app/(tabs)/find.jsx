import { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown } from 'lucide-react-native';
import RideBrowseList from '@/components/RideBrowseList';

const INK = '#1E2A38';
const SUB = '#8A94A0';
const NAVY = '#2C3A4B';

function shortDate(d) {
  return `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`;
}
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function FilterChip({ label, active, onPress, testID }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      className="flex-row items-center rounded-full"
      style={[{ paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 }, active ? { backgroundColor: NAVY } : { backgroundColor: '#E7EBEF' }]}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? '#fff' : '#5A6572' }}>{label}</Text>
      <ChevronDown size={14} color={active ? '#fff' : '#5A6572'} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

export default function Find() {
  const insets = useSafeAreaInsets();
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(null); // which filter menu is open
  const [direction, setDirection] = useState(null);
  const [date, setDate] = useState(null); // Date object
  const [timeWindow, setTimeWindow] = useState(null);
  const [bags, setBags] = useState(null); // minBags number

  const dates = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => new Date(base.getTime() + i * 86400000));
  }, []);

  const filters = useMemo(() => {
    const f = {};
    if (direction) f.direction = direction;
    if (date) f.date = ymd(date);
    if (timeWindow) f.timeWindow = timeWindow;
    if (bags != null) f.minBags = bags;
    return f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, date, timeWindow, bags]);

  const dirLabel = direction === 'university_to_airport' ? 'UMich → DTW' : direction === 'airport_to_university' ? 'DTW → UMich' : 'All routes';
  const dateLabel = date ? shortDate(date) : 'Any date';
  const timeLabel = timeWindow ? timeWindow[0].toUpperCase() + timeWindow.slice(1) : 'Any time';
  const bagsLabel = bags == null ? 'Any bags' : bags === 0 ? '0 bags' : `${bags}+ bags`;

  const MENUS = {
    direction: {
      title: 'Direction',
      options: [
        { label: 'All routes', value: null },
        { label: 'UMich → DTW', value: 'university_to_airport' },
        { label: 'DTW → UMich', value: 'airport_to_university' },
      ],
      current: direction,
      set: setDirection,
    },
    date: {
      title: 'Travel date',
      options: [{ label: 'Any date', value: null }, ...dates.map((d) => ({ label: `${d.toLocaleDateString('en-US', { weekday: 'short' })} · ${shortDate(d)}`, value: d }))],
      current: date,
      set: setDate,
    },
    time: {
      title: 'Flight time',
      options: [
        { label: 'Any time', value: null },
        { label: 'Morning (5a–12p)', value: 'morning' },
        { label: 'Afternoon (12p–5p)', value: 'afternoon' },
        { label: 'Evening (5p–12a)', value: 'evening' },
      ],
      current: timeWindow,
      set: setTimeWindow,
    },
    bags: {
      title: 'Checked bags',
      options: [
        { label: 'Any bags', value: null },
        { label: '0 bags', value: 0 },
        { label: '1+ bags', value: 1 },
        { label: '2+ bags', value: 2 },
        { label: '3+ bags', value: 3 },
      ],
      current: bags,
      set: setBags,
    },
  };

  const menu = open ? MENUS[open] : null;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
        <Text testID="find-title" style={{ fontSize: 34, fontWeight: '800', color: INK, letterSpacing: -0.5 }}>Find Rides</Text>
        <Text style={{ fontSize: 15, color: SUB, marginTop: 2 }}>{total} ride{total === 1 ? '' : 's'} match your filters</Text>
      </View>

      <View style={{ paddingBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
          <FilterChip label={dirLabel} active={!!direction} onPress={() => setOpen('direction')} testID="filter-direction" />
          <FilterChip label={dateLabel} active={!!date} onPress={() => setOpen('date')} testID="filter-date" />
          <FilterChip label={timeLabel} active={!!timeWindow} onPress={() => setOpen('time')} testID="filter-time" />
          <FilterChip label={bagsLabel} active={bags != null} onPress={() => setOpen('bags')} testID="filter-bags" />
        </ScrollView>
      </View>

      <RideBrowseList filters={filters} onMeta={setTotal} />

      <Modal transparent visible={!!menu} animationType="slide" onRequestClose={() => setOpen(null)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(null)}>
          <Pressable className="bg-bg rounded-t-[24px] px-6" style={{ paddingTop: 20, paddingBottom: insets.bottom + 20 }} onPress={() => {}}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: INK, marginBottom: 14 }}>{menu?.title}</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {menu?.options.map((o, i) => {
                const selected = String(o.value) === String(menu.current);
                return (
                  <Pressable
                    key={i}
                    testID={`filter-opt-${open}-${i}`}
                    onPress={() => { menu.set(o.value); setOpen(null); }}
                    className="rounded-[12px] px-4 flex-row items-center justify-between"
                    style={[{ paddingVertical: 14, marginBottom: 8 }, selected ? { backgroundColor: '#DFE6EE' } : { backgroundColor: '#fff' }]}
                  >
                    <Text style={{ fontSize: 16, fontWeight: selected ? '700' : '500', color: INK }}>{o.label}</Text>
                    {selected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: NAVY }} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
