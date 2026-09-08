import { View, Text, TextInput } from 'react-native';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  autoComplete,
  testID,
  className = '',
}) {
  return (
    <View className={`px-5 mb-4 ${className}`}>
      {label ? (
        <Text className="text-xs font-semibold text-text-2 mb-1.5 uppercase tracking-wide">
          {label}
        </Text>
      ) : null}
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8A9A"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        className="w-full px-4 py-3.5 rounded-[12px] border-[1.5px] border-border bg-white text-[15px] text-text"
      />
    </View>
  );
}
