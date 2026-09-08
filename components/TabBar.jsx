import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const ICONS = {
  home: { on: 'home', off: 'home-outline' },
  find: { on: 'search', off: 'search-outline' },
  chat: { on: 'chatbubble', off: 'chatbubble-outline' },
  profile: { on: 'person', off: 'person-outline' },
};
const ORDER = ['home', 'find', 'create', 'chat', 'profile'];

const ACTIVE = '#2C3A4B';
const INACTIVE = '#98A2AE';

// Bottom tab bar matching the Rovo mockups: 4 icon-only tabs + a raised navy "+" FAB.
export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  const routeByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));
  const activeName = state.routes[state.index]?.name;

  const go = (name) => {
    const route = routeByName[name];
    const isFocused = activeName === name;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(name);
  };

  return (
    <View
      className="flex-row items-center justify-around bg-[#FAF9F6] px-2"
      style={{
        height: 62 + insets.bottom,
        paddingBottom: insets.bottom,
        borderTopWidth: 1,
        borderTopColor: '#EAE5DB',
      }}
    >
      {ORDER.map((name) => {
        if (name === 'create') {
          return (
            <Pressable
              key="create"
              testID="tab-create-button"
              onPress={() => go('create')}
              className="items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: ACTIVE,
                marginTop: -22,
                shadowColor: '#2C3A4B',
                shadowOpacity: 0.3,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </Pressable>
          );
        }
        const focused = activeName === name;
        return (
          <Pressable
            key={name}
            testID={`tab-${name}`}
            onPress={() => go(name)}
            className="items-center justify-center"
            style={{ width: 56, height: 48 }}
          >
            <Ionicons name={focused ? ICONS[name].on : ICONS[name].off} size={25} color={focused ? ACTIVE : INACTIVE} />
          </Pressable>
        );
      })}
    </View>
  );
}
