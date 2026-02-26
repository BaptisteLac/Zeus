/**
 * NumericInput — Mode A de saisie numérique
 * Phase 5: Saisie numérique
 *
 * Usage :
 *   <NumericInput value={charge} onChange={setCharge} label="Charge" unit="kg" decimal onSubmit={startTimer} />
 *   <NumericInput value={reps}   onChange={setReps}   label="Reps" />
 *
 * Règle des 3 secondes : selectTextOnFocus → l'utilisateur tape immédiatement
 * sans avoir à effacer la valeur précédente.
 */

import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Colors, BorderRadius } from '@/theme/colors';
import { Typography } from '@/theme/typography';

export interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  /** Appelé sur returnKeyType="done" — typiquement pour lancer le timer de repos */
  onSubmit?: () => void;
  /** Label au-dessus du champ. Ex: "Charge", "Reps" */
  label?: string;
  /** Unité affichée à droite. Ex: "kg", "reps" */
  unit?: string;
  min?: number;
  max?: number;
  /** true → decimal-pad (poids), false → number-pad (reps) */
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
    // Si texte vide ou invalide : on garde la valeur courante (pas de reset à 0)
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

      {/* Pressable wrapper pour agrandir la zone de tap au-delà du TextInput */}
      <Pressable onPress={() => inputRef.current?.focus()} hitSlop={8}>
        <View
          style={{
            minHeight: 64,
            borderRadius: BorderRadius.input,
            borderWidth: 1,
            // Bordure accent au focus — affordance visuelle (spec Phase 3)
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
            // Affiche la valeur réelle hors focus, le brouillon en cours de saisie au focus
            value={focused ? raw : displayValue}
            onChangeText={setRaw}
            // decimal-pad pour les poids (102.5), number-pad pour les reps
            keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
            returnKeyType="done"
            // Sélectionne tout au focus → remplacement direct sans effacer (< 3s)
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
              // dataLarge : 32pt bold tabular-nums (Phase 3)
              Typography.dataLarge,
              {
                flex: 1,
                textAlign: 'center',
                // Couleur accent au focus — signale l'état actif
                color: focused ? Colors.accent : Colors.foreground,
                // Annule les marges iOS du TextInput
                paddingVertical: 0,
              },
            ]}
          />

          {/* Unité affichée uniquement quand il y a une valeur, hors focus */}
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
