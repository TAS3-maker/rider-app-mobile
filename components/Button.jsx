import { Pressable, Text, ActivityIndicator } from 'react-native';

const VARIANTS = {
  primary: 'bg-primary',
  primaryDark: 'bg-primary-dark',
  outline: 'bg-transparent border-[1.5px] border-border',
  white: 'bg-white',
};
const TEXT_VARIANTS = {
  primary: 'text-white',
  primaryDark: 'text-white',
  outline: 'text-text',
  white: 'text-primary-dark',
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  testID,
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      className={`w-full rounded-btn py-4 items-center justify-center ${VARIANTS[variant]} ${
        isDisabled ? 'opacity-60' : ''
      } ${className}`}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'primaryDark' ? '#fff' : '#3AAFA9'} />
      ) : (
        <Text className={`text-base font-semibold ${TEXT_VARIANTS[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
