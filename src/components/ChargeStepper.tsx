import { View } from "react-native";
import { NumericInput } from "@/components/ui/NumericInput";
import { AdjustButtons } from "@/components/ui/AdjustButtons";

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
  return (
    <View>
      <NumericInput
        value={value}
        onChange={onChange}
        label="Charge"
        unit="kg"
        decimal
        min={min}
        max={max}
      />
      <AdjustButtons
        adjustments={[
          {
            label: `−${step}`,
            onPress: () =>
              onChange(Math.max(min, Math.round((value - step) * 10) / 10)),
            accessibilityLabel: `Diminuer la charge de ${step} kg`,
          },
          {
            label: `+${step}`,
            onPress: () =>
              onChange(Math.min(max, Math.round((value + step) * 10) / 10)),
            accessibilityLabel: `Augmenter la charge de ${step} kg`,
          },
        ]}
      />
    </View>
  );
}
