import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View testID="app-loading" className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#3AAFA9" size="large" />
      </View>
    );
  }
  return <Redirect href={user ? '/(tabs)/home' : '/(auth)/welcome'} />;
}
