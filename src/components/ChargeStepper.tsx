import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";

interface ChargeStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export function ChargeStepper({
  value,
  onChange,
  step = 0.5,
  min = 0,
  max = 500,
}: ChargeStepperProps) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");

  const decrement = () => onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  const increment = () => onChange(Math.min(max, Math.round((value + step) * 10) / 10));

  return (
    <View>
      <Text className="text-foreground-muted text-xs uppercase tracking-wider mb-2 text-center">
        Charge
      </Text>
      <View className="flex-row items-center bg-surface rounded-xl h-12 overflow-hidden">
        <Pressable
          onPress={decrement}
          className="w-11 h-full items-center justify-center active:bg-white/5"
        >
          <Text className="text-foreground text-xl font-light">−</Text>
        </Pressable>

        <Pressable
          className="flex-1 h-full items-center justify-center"
          onPress={() => {
            setRaw(value === 0 ? "" : String(value));
            setEditing(true);
          }}
        >
          {editing ? (
            <TextInput
              className="text-primary text-lg font-mono text-center w-full"
              value={raw}
              onChangeText={setRaw}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              onBlur={() => {
                const parsed = parseFloat(raw.replace(",", "."));
                if (!isNaN(parsed)) {
                  onChange(Math.min(max, Math.max(min, parsed)));
                }
                setEditing(false);
              }}
              onSubmitEditing={() => {
                const parsed = parseFloat(raw.replace(",", "."));
                if (!isNaN(parsed)) {
                  onChange(Math.min(max, Math.max(min, parsed)));
                }
                setEditing(false);
              }}
            />
          ) : (
            <Text className="text-primary text-lg font-mono">
              {value === 0 ? "—" : `${value} kg`}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={increment}
          className="w-11 h-full items-center justify-center active:bg-white/5"
        >
          <Text className="text-foreground text-xl font-light">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
