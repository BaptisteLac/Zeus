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