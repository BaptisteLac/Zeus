import { View, Text, Pressable } from "react-native";

interface RIRSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

const OPTIONS = [0, 1, 2, 3, 4] as const;

export function RIRSelector({ value, onChange }: RIRSelectorProps) {
  return (
    <View>
      <Text className="text-foreground-muted text-xs uppercase tracking-wider mb-2 text-center">
        RIR Senti
      </Text>
      <View className="flex-row bg-surface rounded-xl h-12 p-1 gap-1">
        {OPTIONS.map((val) => {
          const active = val === 4 ? value >= 4 : value === val;
          return (
            <Pressable
              key={val}
              onPress={() => onChange(val)}
              className={`flex-1 h-full rounded-lg items-center justify-center ${active ? "bg-primary" : ""
                }`}
            >
              <Text
                className={`text-sm font-mono ${active ? "text-white font-semibold" : "text-foreground-muted"
                  }`}
              >
                {val === 4 ? "4+" : String(val)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
