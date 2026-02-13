import { Exercise, WorkoutEntry, ProgressionResult } from './types';

export function calculateProgression(
  exercise: Exercise,
  history: WorkoutEntry[]
): ProgressionResult | null {
  if (history.length === 0) return null;

  const last = history[history.length - 1];
  const allSetsAtMax = last.sets.every((reps) => reps >= exercise.repsMax);
  const goodRir = last.rir <= 2;
  const progressionValidated = allSetsAtMax && goodRir;

  // P0-1: Check if reps at max but RIR too high
  if (allSetsAtMax && !goodRir) {
    return {
      type: 'increase_reps',
      nextCharge: last.charge,
      targetTotalReps: last.totalReps,
      message: `⚠️ Reps au max mais RIR trop bas — Reprends la même charge en contrôlant mieux`,
    };
  }

  // P0-2: Check progression BEFORE stagnation
  if (progressionValidated) {
    const nextCharge = last.charge + 2.5;
    const targetTotalReps = exercise.sets * exercise.repsMin;
    return {
      type: 'increase_charge',
      nextCharge,
      targetTotalReps,
      message: `📈 AUGMENTE LA CHARGE → ${nextCharge} kg | Objectif: ${targetTotalReps} reps total`,
    };
  }

  // Check stagnation: last 2 sessions same charge & same total
  if (history.length >= 2) {
    const prev = history[history.length - 2];
    if (
      prev.charge === last.charge &&
      prev.totalReps === last.totalReps
    ) {
      return {
        type: 'stagnation',
        nextCharge: last.charge,
        targetTotalReps: last.totalReps,
        message: `⚠️ STAGNATION : Réduis volume de 1 série ou deload`,
      };
    }
  }

  return {
    type: 'increase_reps',
    nextCharge: last.charge,
    targetTotalReps: last.totalReps + 1,
    message: `🔥 AUGMENTE LES REPS → Objectif: battre ${last.totalReps} reps total`,
  };
}
