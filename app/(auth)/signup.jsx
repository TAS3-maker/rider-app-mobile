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

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    paymentHandle: '',
    pickupAddress: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Email and password are required');
    setLoading(true);
    try {
      const res = await register({
        username: form.username.trim(),
        name: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        paymentHandle: form.paymentHandle.trim(),
        pickupAddress: form.pickupAddress.trim(),
      });
      router.push({
        pathname: '/(auth)/verify',
        params: { email: form.email.trim(), devCode: res.devVerificationCode || '' },
      });
    } catch (e) {
      setError(e.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
          <View style={{ paddingTop: 40, marginBottom: 24 }}>
            <Text style={{ fontSize: 34, lineHeight: 40, fontWeight: '800', color: '#1E2A38', letterSpacing: -0.5 }}>Create Account</Text>
            <Text style={{ fontSize: 16, color: '#6B7480', marginTop: 8 }}>Only verified .edu emails accepted</Text>
          </View>

          <Field label="USERNAME" value={form.username} onChangeText={set('username')} placeholder="JDoe" autoCapitalize="none" testID="signup-username" />
          <Field label="UNIVERSITY EMAIL" value={form.email} onChangeText={set('email')} placeholder="You@umich.edu" keyboardType="email-address" autoCapitalize="none" testID="signup-email" />
          <Field label="PASSWORD" value={form.password} onChangeText={set('password')} placeholder="••••••••••" secureTextEntry testID="signup-password" />
          <Field label="VENMO OR ZELLE HANDLE" value={form.paymentHandle} onChangeText={set('paymentHandle')} placeholder="@yourhandle" autoCapitalize="none" testID="signup-payment" />
          <Field label="PICKUP ADDRESS (PRIVATE)" value={form.pickupAddress} onChangeText={set('pickupAddress')} placeholder="123 State st, Ann Arbor" autoCapitalize="words" testID="signup-pickup" />

          {error ? (
            <Text testID="signup-error" style={{ textAlign: 'center', marginBottom: 8, fontSize: 14, color: '#C0392B' }}>
              {error}
            </Text>
          ) : null}

          <Pressable
            testID="signup-submit"
            onPress={onSubmit}
            disabled={loading}
            className="rounded-[14px] items-center justify-center"
            style={[
              { backgroundColor: '#2C3A4B', paddingVertical: 18, marginTop: 8, marginHorizontal: 24, opacity: loading ? 0.7 : 1 },
              { shadowColor: '#2C3A4B', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
            ]}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#FFFFFF' }}>{loading ? 'Creating…' : 'Create Account'}</Text>
          </Pressable>

          <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 12, lineHeight: 18, color: '#A0A8B0' }}>
            By signing up, you agree to our{'\n'}Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
