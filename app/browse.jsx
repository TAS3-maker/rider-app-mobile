import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ScreenHeader from '@/components/ScreenHeader';
import RideBrowseList from '@/components/RideBrowseList';

export default function Browse() {
  const { rideId } = useLocalSearchParams();
  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title="Available Rides" testID="browse-header" />
      <RideBrowseList rideId={rideId} />
    </View>
  );
}
