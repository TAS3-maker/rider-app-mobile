import { View, Text, Pressable, StatusBar,Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import RovoCar from '@/components/RovoCar';
import RovoCloud from '@/components/RovoCloud';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-navy" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" />

      {/* decorative clouds */}
      <View style={{ position: 'absolute', top: insets.top + 60, right: -112 }}>
        <Image
  source={require('../../assets/images/Vector-cloud2.png')}
  style={{
    width: 300,


    resizeMode: 'contain',
  }}
/>
      </View>
      <View style={{ position: 'absolute', top: insets.top + 400, right: -75 }}>
          <Image
  source={require('../../assets/images/Vector-cloud.png')}
  style={{
    width: 300,


    resizeMode: 'contain',
  }}
/>
      </View>
      <View style={{ position: 'absolute', top: insets.top + 455, left:-75 }}>
    <Image
  source={require('../../assets/images/Vector.png')}
  style={{
    width: 300,


    resizeMode: 'contain',
  }}
/>
      </View>

      <View className="flex-1 relative px-7 ml-7 justify-center">
          <Image
  source={require('../../assets/images/Vector-logo-img.png')}
  style={{
    width: 300,
position: 'absolute',
top:160,
left:-19,

    resizeMode: 'contain',
  }}
/>
        <Text className="text-white" style={{ fontSize: 92, lineHeight: 96, fontWeight: '800', letterSpacing: -2, marginTop: -8 }}>
          Rovo
        </Text>
        <View style={{ marginTop: 28 }}>
          <Text style={{ fontSize: 18, lineHeight: 26, color: '#9AA6B2' }}>Same place. Same time.</Text>
          <Text style={{ fontSize: 18, lineHeight: 26, color: '#9AA6B2' }}>Find people going your way.</Text>
          <Text style={{ fontSize: 18, lineHeight: 26, fontWeight: '700', color: '#FFFFFF', marginTop: 4 }}>Save up to 65%.</Text>
        </View>
      </View>

      <View className="px-7" style={{ paddingBottom: insets.bottom + 28 }}>
        <View className="self-center px-5 py-2.5 mb-5 rounded-full border" style={{ borderColor: '#E0913C', borderWidth: 1.5 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#E0913C' }}>Verified .edu Students Only</Text>
        </View>
        <Pressable
          testID="welcome-getstarted"
          onPress={() => router.push('/(auth)/signup')}
          className="rounded-[14px] py-4 items-center mb-3.5"
          style={{ backgroundColor: '#F4EFE6' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E2A38' }}>Get Started</Text>
        </Pressable>
        <Pressable
          testID="welcome-signin"
          onPress={() => router.push('/(auth)/signin')}
          className="rounded-[14px] py-4 items-center"
          style={{ backgroundColor: '#3A4A5C' }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}
