import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Colors, BorderRadius } from '@/theme/colors';
import { Typography } from '@/theme/typography';

export interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  onSubmit?: () => void;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  decimal?: boolean;
}

export function NumericInput({
  value,
  onChange,
  onSubmit,
  label,
  unit,
  min = 0,
  max = 9999,
  decimal = false,
}: NumericInputProps) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');
  const inputRef = useRef<TextInput>(null);

  const commit = (text: string) => {
    const parsed = decimal
      ? parseFloat(text.replace(',', '.'))
      : parseInt(text, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
  };

  const displayValue = value > 0 ? String(value) : '';

  return (
    <View>
      {label && (
        <Text
          style={[
            Typography.label,
            { marginBottom: 8, textAlign: 'center' },
          ]}
        >
          {label.toUpperCase()}
        </Text>
      )}

      <Pressable onPress={() => inputRef.current?.focus()} hitSlop={8}>
        <View
          style={{
            minHeight: 64,
            borderRadius: BorderRadius.input,
            borderWidth: 1,
            borderColor: focused ? Colors.accent : Colors.border,
            backgroundColor: Colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          <TextInput
            ref={inputRef}
            value={focused ? raw : displayValue}
            onChangeText={setRaw}
            keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
            returnKeyType="done"
            selectTextOnFocus
            onFocus={() => {
              setFocused(true);
              setRaw(displayValue);
            }}
            onBlur={() => {
              setFocused(false);
              commit(raw);
            }}
            onSubmitEditing={() => {
              commit(raw);
              onSubmit?.();
            }}
            placeholder="—"
            placeholderTextColor={Colors.foregroundSubtle}
            style={[
              Typography.dataLarge,
              {
                flex: 1,
                textAlign: 'center',
                color: focused ? Colors.accent : Colors.foreground,
                paddingVertical: 0,
              },
            ]}
          />

          {unit && !focused && value > 0 && (
            <Text style={[Typography.label, { marginLeft: 6 }]}>
              {unit}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}
