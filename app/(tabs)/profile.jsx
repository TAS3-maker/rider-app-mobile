
import { useCallback, useState } from 'react';
import { View, Text, Pressable, Image, ScrollView, Alert,Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Settings, Mail, Wallet, Home, MapPin, Clock, FileText } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { ridesApi } from '@/api/rides';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch ,getToken } from '@/api/client';
import { storage } from '@/src/utils/storage';
import { File } from 'expo-file-system';
const INK = '#1E2A38';
const SUB = '#6B7480';
const NAVY = '#2C3A4B';
const RED = '#C0392B';
const LINE = '#E7E2D8';

function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return '?';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

function Row({
  Icon,
  label,
  value,
  valueMuted,
  link,
  onPress,
  testID,
}) {
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      className="flex-row items-center"
      style={{
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: LINE,
      }}
    >
      <Icon size={18} color={INK} />

      <Text
        style={{
          fontSize: 16,
          color: INK,
          marginLeft: 12,
          flex: 1,
        }}
      >
        {label}
      </Text>

      {link ? (
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: INK,
            textDecorationLine: 'underline',
          }}
        >
          View →
        </Text>
      ) : (
        <Text
          style={{
            fontSize: 15,
            color: valueMuted ? '#A9B0B8' : SUB,
            fontStyle: valueMuted ? 'italic' : 'normal',
          }}
        >
          {value}
        </Text>
      )}
    </Pressable>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { user, logout,setUser } = useAuth();

  const [summary, setSummary] = useState({
    completedRides: 0,
    totalSaved: 0,
  });

  const [uploadingImage, setUploadingImage] = useState(false);
const [imageError, setImageError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let on = true;

      ridesApi
        .history(1, 1)
        .then((r) => {
          if (on) {
            setSummary(
              r.summary || {
                completedRides: 0,
                totalSaved: 0,
              }
            );
          }
        })
        .catch(() => {});

      return () => {
        on = false;
      };
    }, [])
  );

const pickProfileImage = async () => {
  try {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission required',
        'Please allow photo library access to select a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const image = result.assets[0];

    if (!image?.uri) {
      throw new Error('Image URI is missing');
    }

    if (!image?.mimeType) {
      throw new Error('Image type is missing');
    }

    setUploadingImage(true);

    // ---------------------------------------
    // STEP 1: Get S3 presigned upload URL
    // ---------------------------------------

    const uploadData = await apiFetch(
      '/users/profile-image/upload-url',
      {
        method: 'POST',
        body: {
          contentType: image.mimeType,
        },
      }
    );

    console.log('S3 upload data:', uploadData.key);

    // ---------------------------------------
    // STEP 2: Upload image directly to S3
    // ---------------------------------------

   const file = new File(image.uri);

const arrayBuffer = await file.arrayBuffer();

const s3Response = await fetch(
  uploadData.uploadUrl,
  {
    method: 'PUT',
    headers: {
      'Content-Type': image.mimeType,
    },
    body: arrayBuffer,
  }
);

if (!s3Response.ok) {
  const errorText = await s3Response.text();

  console.log('S3 upload failed:', {
    status: s3Response.status,
    body: errorText,
  });

  throw new Error('Failed to upload image to S3');
}

    if (!s3Response.ok) {
      throw new Error('Failed to upload image to S3');
    }

    // ---------------------------------------
    // STEP 3: Save S3 key to user's profile
    // ---------------------------------------

    const saveData = await apiFetch(
      '/users/profile-image',
      {
        method: 'PATCH',
        body: {
          key: uploadData.key,
        },
      }
    );

   const imageData = await apiFetch(
  '/users/profile-image',
  {
    method: 'GET',
  }
);

console.log('Profile image URL received');

setUser(prev => ({
  ...prev,
  profileImage: imageData.imageUrl,
}));
    Alert.alert(
      'Success',
      'Profile picture updated successfully.'
    );

    // Refresh user here if your AuthContext supports it.
  } catch (error) {
    console.error(
      'Profile image upload error:',
      error
    );

    Alert.alert(
      'Upload failed',
      error.message || 'Could not upload profile picture.'
    );
  } finally {
    setUploadingImage(false);
  }
};



// const pickProfileImageForDev = async () => {
//   try {
//     const permission =
//       await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (!permission.granted) {
//       Alert.alert(
//         'Permission required',
//         'Please allow photo library access to select a profile picture.'
//       );
//       return;
//     }

//     const result =
//       await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ['images'],
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//     if (result.canceled) {
//       return;
//     }

//     const image = result.assets[0];

//     await uploadProfileImageToDisk(image);

//   } catch (error) {
//     console.error('Pick image error:', error);
//   }
// };
// const uploadProfileImageToDisk = async (image) => {
//   try {
//     if (!image?.uri) {
//       throw new Error('Image URI is missing');
//     }

//     if (!user?.id) {
//       throw new Error('User ID is missing');
//     }

//     setUploadingImage(true);

//     const formData = new FormData();

//     if (Platform.OS === 'web') {
//       // WEB
//       const imageResponse = await fetch(image.uri);

//       if (!imageResponse.ok) {
//         throw new Error('Could not read selected image');
//       }

//       const blob = await imageResponse.blob();

//       formData.append(
//         'profileImage',
//         blob,
//         image.fileName || `profile-${Date.now()}.jpg`
//       );
//     } else {
//       // ANDROID / IOS
//       const file = new File(image.uri);

//   formData.append('profileImage', file);
//     }

//     console.log('Platform:', Platform.OS);
//     console.log('Image URI:', image.uri);
//     console.log('FormData prepared');

//     const token = await getToken();

//     const response = await fetch(
//       `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/profile-image/${user.id}`,
//       {
//         method: 'POST',
//         headers: {
//           ...(token
//             ? { Authorization: `Bearer ${token}` }
//             : {}),
//         },
//         body: formData,
//       }
//     );

//     const data = await response.json().catch(() => ({}));

//     console.log('Upload response:', data);

//     if (!response.ok) {
//       throw new Error(
//         data.message || data.error || 'Upload failed'
//       );
//     }
// setUser(prev => ({
//   ...prev,
//   profileImage: data.profileImage,
// }));
//     setImageError(false);

//     Alert.alert(
//       'Success',
//       'Profile picture updated successfully.'
//     );

//   } catch (error) {
//     console.error(
//       'Disk profile image upload error:',
//       error
//     );

//     Alert.alert(
//       'Upload failed',
//       error.message || 'Could not upload profile picture.'
//     );

//   } finally {
//     setUploadingImage(false);
//   }
// };

  const onLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const name =
    user?.name ||
    user?.username ||
    'Student';

  const domain =
    (user?.email || '').split('@')[1] || '';

  const uniLabel =
    user?.universityName ||
    (
      domain
        ? domain
            .split('.')[0]
            .replace(/^\w/, (c) => c.toUpperCase())
        : 'University'
    );

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: insets.top }}
    >
      <View
        className="flex-row relative items-center justify-center"
        style={{
          paddingHorizontal: 24,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <Text
          testID="profile-title"
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: INK,
          }}
        >
          Profile
        </Text>

        <Pressable
          testID="profile-settings"
          onPress={() => {}}
          hitSlop={10}
        />

        <View className="absolute right-3">
          <Settings size={24} color={INK} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View
          className="items-center"
          style={{
            paddingTop: 20,
            paddingBottom: 8,
          }}
        >
          <Pressable
            onPress={pickProfileImage}
            disabled={uploadingImage}
            style={{
              alignItems: 'center',
              opacity: uploadingImage ? 0.6 : 1,
            }}
          >
            {user?.profileImage ? (
              <Image
                source={{
                  uri: user.profileImage,
                }}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                }}
              />
            ) : (
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  backgroundColor: '#E7EDF3',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '800',
                    color: NAVY,
                  }}
                >
                  {initialsOf(name)}
                </Text>
              </View>
            )}

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: SUB,
              }}
            >
              {uploadingImage
                ? 'Uploading...'
                : 'Change photo'}
            </Text>
          </Pressable>

          <Text
            testID="profile-name"
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: INK,
              marginTop: 12,
            }}
          >
            {name}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: SUB,
              marginTop: 2,
            }}
          >
            {uniLabel} · Class of 2027
          </Text>

          <View
            className="flex-row"
            style={{
              marginTop: 18,
              gap: 40,
            }}
          >
            {[
              {
                n: Number(
                  user?.reliabilityScore ?? 5
                ).toFixed(1),
                l: 'Rating',
              },
              {
                n: String(
                  summary.completedRides
                ),
                l: 'Rides',
              },
              {
                n: `$${Math.max(
                  0,
                  Math.round(summary.totalSaved)
                )}`,
                l: 'Saved',
              },
            ].map((s) => (
              <View
                key={s.l}
                className="items-center"
              >
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: INK,
                  }}
                >
                  {s.n}
                </Text>

                <Text
                  style={{
                    fontSize: 13,
                    color: SUB,
                    marginTop: 2,
                  }}
                >
                  {s.l}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View
          style={{
            marginTop: 22,
            borderTopWidth: 1,
            borderTopColor: LINE,
          }}
        >
          <Row
            Icon={Mail}
            label="Email"
            value={user?.email || '—'}
            testID="profile-email"
          />

          <Row
            Icon={Wallet}
            label="Payment"
            value={
              user?.paymentHandle || 'Not set'
            }
            testID="profile-payment"
          />

          <Row
            Icon={Home}
            label="Pickup area"
            value={
              user?.pickupPreferences || 'Not set'
            }
            testID="profile-pickup-area"
          />

          <Row
            Icon={MapPin}
            label="Address"
            value="Visible to booker only"
            valueMuted
            testID="profile-address"
          />

          <Row
            Icon={Clock}
            label="Ride History"
            link
            onPress={() =>
              router.push('/ride-history')
            }
            testID="profile-ride-history"
          />

          <Row
            Icon={FileText}
            label="Terms & Privacy"
            link
            onPress={() => {}}
            testID="profile-terms"
          />
        </View>

        <Pressable
          testID="profile-logout"
          onPress={onLogout}
          style={{
            paddingHorizontal: 24,
            paddingVertical: 18,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: RED,
            }}
          >
            Sign Out →
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
