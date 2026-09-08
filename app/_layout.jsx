import '../global.css';
import { Stack } from 'expo-router';
import { LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

// Disable logbox overlays so users/agents see the app cleanly.
LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  // Load the Ionicons font so glyphs render in Expo Go and web.
  const [fontsLoaded] = useFonts({
    Ionicons: require('@react-native-vector-icons/ionicons/fonts/Ionicons.ttf'),
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#F5F5F0' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SocketProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F5F5F0' },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
