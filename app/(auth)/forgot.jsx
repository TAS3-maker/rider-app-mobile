import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { authApi } from '@/api/auth';

export default function Forgot() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stage, setStage] = useState('request'); // request | reset
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async () => {
    setError('');
    setMessage('');
    if (!email) return setError('Enter your email');
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setMessage(res.message);
      if (res.devResetToken) setToken(res.devResetToken); // dev mode
      setStage('reset');
    } catch (e) {
      setError(e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const doReset = async () => {
    setError('');
    if (!token || !newPassword) return setError('Enter the reset token and a new password');
    setLoading(true);
    try {
      await authApi.resetPassword(email.trim(), token.trim(), newPassword);
      router.replace('/(auth)/signin');
    } catch (e) {
      setError(e.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <Pressable testID="forgot-back" onPress={() => router.back()} className="px-5 pt-3">
        <Ionicons name="chevron-back" size={26} color="#1A1A2E" />
      </Pressable>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-4 pb-6">
          <Text className="text-[26px] font-extrabold text-text mb-1">Reset password</Text>
          <Text className="text-sm text-text-3">We&rsquo;ll help you get back in</Text>
        </View>

        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@university.edu" keyboardType="email-address" testID="forgot-email" />

        {stage === 'reset' ? (
          <>
            {message ? (
              <View className="mx-5 mb-4 rounded-[12px] bg-primary-light border border-primary/20 p-3">
                <Text className="text-[12px] text-text-2">{message}</Text>
              </View>
            ) : null}
            <Input label="Reset Token" value={token} onChangeText={setToken} placeholder="paste token" testID="forgot-token" />
            <Input label="New Password" value={newPassword} onChangeText={setNewPassword} placeholder="••••••••" secureTextEntry testID="forgot-newpassword" />
          </>
        ) : null}

        {error ? (
          <Text testID="forgot-error" className="px-5 mb-3 text-sm text-accent">
            {error}
          </Text>
        ) : null}

        <View className="px-5 mt-2">
          {stage === 'request' ? (
            <Button title="Send reset instructions" onPress={requestReset} loading={loading} testID="forgot-request" />
          ) : (
            <Button title="Set new password" onPress={doReset} loading={loading} testID="forgot-reset" />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
