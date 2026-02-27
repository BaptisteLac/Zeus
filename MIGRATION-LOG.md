# Migration Log
## Phase 1 — Rattrapage ✅
- [x] emotionalPressed ajouté dans colors.ts
- [x] borderRadius sémantiques ajoutés dans tailwind.config.js
- [ ] Button.tsx — remplacer PRIMARY_PRESSED_BG par Colors.emotionalPressed (Phase 2 ou 10)

## Identifié lors de Phase 3 (Typography)
- [ ] app/design-system.tsx — aligner dataMassive → dataLarge, etc.
- [ ] src/components/RestTimer.tsx — remplacer tabular-nums inline → Typography.dataLarge

## Identifié lors de Phase 2 (Buttons)
- [ ] src/theme/colors.ts — ajouter `emotionalPressed: '#C24D29'`
- [ ] tailwind.config.js — ajouter borderRadius: card (16px), input (12px), action (9999px)

## Identifié lors de Phase 4 (ExerciseCard)
- [ ] app/(tabs)/index.tsx — vérifier les couleurs hardcodées (opacity-70, #1C1C1E) → remplacer par tokens (Phase 10)

## Identifié lors de Phase 5 (Numeric Input)
- [ ] ChargeStepper.tsx → remplacer par NumericInput + AdjustButtons (Phase 10)
- [ ] RIRSelector.tsx → évaluer migration vers RIRPicker (optionnel, les deux peuvent coexister)
- [ ] app/_layout.tsx → ajouter BottomSheetModalProvider si migration vers @gorhom/bottom-sheet

## Identifié lors de Phase 6 (Timer)
- [ ] app/(tabs)/index.tsx — remplacer state local timer + <RestTimer /> par useTimer().startTimer() (Phase 10)
- [ ] ExerciseCard.tsx — évaluer appel direct useTimer() vs prop onStartTimer (Phase 10)

## Identifié lors de Phase 7 (Système émotionnel)
- [ ] ExerciseCard.tsx → remplacer badge inline par <PRBadge /> + <PRGlow />, supprimer prBadgeScale/prBadgeStyle/prGlowOpacity (Phase 10)
- [ ] Button, AdjustButtons, RIRPicker, DynamicIslandPill, TimerContext → remplacer Haptics.* direct par useHaptics() (Phase 10, composant par composant)
- [ ] app/(tabs)/index.tsx → ajouter MilestoneToast halfway quand 50% exercices terminés (Phase 10)

### Cascade accumulée pour Phase 10
- [ ] index.tsx → useTimer().startTimer() + supprimer <RestTimer />
- [ ] index.tsx → MilestoneToast halfway
- [ ] ExerciseCard → <PRBadge /> + <PRGlow /> au lieu du badge inline
- [ ] ExerciseCard → useTimer() direct vs prop onStartTimer
- [ ] ChargeStepper → remplacer par NumericInput + AdjustButtons
- [ ] RIRSelector → évaluer migration vers RIRPicker
- [ ] Tous composants → Haptics.* direct → useHaptics()
- [ ] index.tsx → couleurs hardcodées → tokens
- [ ] _layout.tsx → BottomSheetModalProvider (si besoin)

## Identifié lors de Phase 9 (Auto-save)
- [ ] index.tsx → remplacer saveState() par saveImmediate() dans handleSaveExercise/handleUpdateExercise
- [ ] index.tsx → ajouter saveDebounced sur inputs charge/reps
- [ ] index.tsx → bottom sheet "Reprendre / Abandonner" si pendingSession !== null
- [ ] index.tsx → appeler dismissPending() après handleReset (fin de séance)
- [ ] ExerciseCard.tsx → passer saveDebounced comme prop aux NumericInput onChange

## Identifié lors de Phase 10a (Logic)
- [ ] ExerciseCard.tsx → ajouter prop onInputChange pour brancher saveDebounced (Phase 10b)
- [ ] RestTimer.tsx → supprimer (`grep -r "RestTimer" src/` pour confirmer orphelin)
- [ ] ExerciseCard.tsx → changer signature onStartTimer: (seconds: number) → (seconds: number, nextSet: string) pour alimenter la DynamicIslandPill

## Identifié lors de Phase 10b (UI)
- [ ] Double haptic swipe → supprimer haptics.medium() de handleValidateSet, garder uniquement dans SwipeableSerieRow (Phase 10c)
- [ ] onStartTimer nextSet vide → déjà identifié en 10a, confirmer le fix de signature (Phase 10c)
- [ ] SwipeableSerieRow → ajouter prop style?: ViewStyle si besoin d'état visuel externe (10c)


### Cascade restante (Phase 10d ou backlog)
- [ ] 🗑️ Supprimer RestTimer.tsx (orphelin confirmé)
- [ ] Button.tsx → '#FFFFFF' et #C24D29 → Colors.emotionalPressed (noté depuis Phase 2)
- [ ] RestTimer.tsx → #DC2626 / #22C55E → créer tokens `error` / `success` si pertinent
- [ ] RIRPicker.tsx → '#FFFFFF' → token foreground
- [ ] placeholderTextColor → créer token `foregroundSubtle` (existe déjà : #555B6A !)