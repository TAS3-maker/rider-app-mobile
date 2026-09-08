import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const CARD_SHADOW = {
  shadowColor: '#2C3A4B',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

function Field({ label, ...props }) {
  return (
    <View className="mb-5">
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E2A38', letterSpacing: 0.4, marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#A9B0B8"
        className="w-full px-4 rounded-[14px] bg-white"
        style={[{ paddingVertical: 16, fontSize: 16, color: '#1E2A38' }, CARD_SHADOW]}
        {...props}
      />
    </View>
  );
}

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Enter your email and password');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: insets.bottom + 96 }}>
          <View style={{ paddingTop: 56, marginBottom: 28 }}>
            <Text style={{ fontSize: 48, lineHeight: 52, fontWeight: '800', color: '#1E2A38', letterSpacing: -1 }}>Welcome</Text>
            <Text style={{ fontSize: 48, lineHeight: 52, fontWeight: '800', color: '#1E2A38', letterSpacing: -1 }}>Back</Text>
            <Text style={{ fontSize: 16, color: '#6B7480', marginTop: 14 }}>Sign in with your university email</Text>
          </View>

          <Field
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            placeholder="You@umich.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            testID="signin-email"
          />
          <Field
            label="PASSWORD"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••••"
            secureTextEntry
            testID="signin-password"
          />

          <Pressable testID="signin-forgot" onPress={() => router.push('/(auth)/forgot')} className="mb-6 mt-1">
            <Text style={{ textAlign: 'right', fontSize: 16, color: '#8A94A0' }}>Forgot Password</Text>
          </Pressable>

          <View className="flex-row justify-center">
            <Text style={{ fontSize: 15, color: '#4A5763' }}>Don&rsquo;t have an account? </Text>
            <Pressable testID="signin-goto-signup" onPress={() => router.replace('/(auth)/signup')}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E2A38' }}>Sign up</Text>
            </Pressable>
          </View>

          {error ? (
            <Text testID="signin-error" style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#C0392B' }}>
              {error}
            </Text>
          ) : null}

          <View className="mt-12" />

          <Pressable
            testID="signin-submit"
            onPress={onSubmit}
            disabled={loading}
            className="rounded-[14px] items-center justify-center"
            style={[
              { backgroundColor: '#2C3A4B', paddingVertical: 12, marginTop: 40, marginHorizontal: 4, opacity: loading ? 0.7 : 1 },
              { shadowColor: '#2C3A4B', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
            ]}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>{loading ? 'Signing in…' : 'Log In'}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
