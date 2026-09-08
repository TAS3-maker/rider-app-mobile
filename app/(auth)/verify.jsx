import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';

export default function Verify() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { verifyEmail } = useAuth();
  const params = useLocalSearchParams();

  const [code, setCode] = useState(params.devCode ? String(params.devCode) : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!code) return setError('Enter the 6-digit code');
    setLoading(true);
    try {
      await verifyEmail(String(params.email), code.trim());
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Pressable testID="verify-back" onPress={() => router.back()} className="px-5 pt-3">
        <Ionicons name="chevron-back" size={26} color="#1A1A2E" />
      </Pressable>

      <View className="px-5 pt-4 pb-6">
        <Text className="text-[26px] font-extrabold text-text mb-1">Verify your email</Text>
        <Text className="text-sm text-text-3">
          Enter the 6-digit code we sent to {String(params.email || 'your email')}
        </Text>
      </View>

      {params.devCode ? (
        <View className="mx-5 mb-4 rounded-[12px] bg-maize-light border border-maize/40 p-3">
          <Text className="text-[12px] text-text-2">
            Dev mode: your code is <Text className="font-bold">{String(params.devCode)}</Text>
          </Text>
        </View>
      ) : null}

      <Input
        label="Verification Code"
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        keyboardType="number-pad"
        testID="verify-code"
      />

      {error ? (
        <Text testID="verify-error" className="px-5 mb-3 text-sm text-accent">
          {error}
        </Text>
      ) : null}

      <View className="px-5 mt-2">
        <Button title="Verify & Continue" onPress={onSubmit} loading={loading} testID="verify-submit" />
      </View>
    </View>
  );
}
