import { useState, useMemo, useEffect } from 'react';
import { Exercise, WorkoutEntry, ExerciseInput } from '@/lib/types';
import { calculateProgression } from '@/lib/progression';
import RestTimer from './RestTimer';

interface ExerciseCardProps {
  index: number;
  exercise: Exercise;
  history: WorkoutEntry[];
  onSave: (input: ExerciseInput) => void;
  onUpdate?: (input: ExerciseInput) => void;
  onStartTimer?: (seconds: number) => void;
  saved: boolean;
}

export default function ExerciseCard({
  index,
  exercise,
  history,
  onSave,
  onUpdate,
  onStartTimer,
  saved,
}: ExerciseCardProps) {
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;
  const progression = useMemo(
    () => calculateProgression(exercise, history),
    [exercise, history]
  );

  const defaultCharge = progression
    ? progression.nextCharge
    : lastEntry
      ? lastEntry.charge
      : 0;

  const [charge, setCharge] = useState(defaultCharge);
  const [sets, setSets] = useState<number[]>(
    Array.from({ length: exercise.sets }, (_, i) =>
      lastEntry && lastEntry.sets[i] !== undefined ? lastEntry.sets[i] : 0
    )
  );
  const [rir, setRir] = useState(1);
  const [modified, setModified] = useState(false);
  const [savedValues, setSavedValues] = useState<ExerciseInput | null>(null);

  const totalReps = sets.reduce((a, b) => a + b, 0);

  // Track when inputs change after save
  useEffect(() => {
    if (saved && savedValues) {
      const hasChanged =
        charge !== savedValues.charge ||
        rir !== savedValues.rir ||
        sets.some((s, i) => s !== savedValues.sets[i]);
      setModified(hasChanged);
    }
  }, [charge, sets, rir, saved, savedValues]);

  const handleSetChange = (i: number, value: string) => {
    const n = Math.max(0, parseInt(value) || 0);
    setSets((prev) => {
      const next = [...prev];
      next[i] = n;
      return next;
    });
  };

  const canSave = charge > 0 && sets.some((s) => s > 0);

  const progressionBadge = () => {
    if (!progression) return null;
    if (progression.type === 'increase_charge')
      return (
        <span className="rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-accent">
          ↑ Charge
        </span>
      );
    if (progression.type === 'stagnation')
      return (
        <span className="rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">
          Stagnation
        </span>
      );
    return (
      <span className="rounded-full bg-warning/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-warning">
        ↑ Reps
      </span>
    );
  };

  const progressionBlock = () => {
    if (!progression) return null;

    if (progression.type === 'increase_charge') {
      return (
        <div className="mt-5 rounded-lg bg-gradient-to-br from-accent/15 via-accent/8 to-accent/5 p-5 border border-accent/20">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">🏆</span>
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-accent">
              Progression validée !
            </span>
          </div>
          <p className="text-base font-medium text-foreground">
            Passe à <span className="font-mono text-lg font-bold text-accent">{progression.nextCharge} kg</span>
          </p>
          <p className="mt-1 text-[12px] text-stone">
            Nouvelle charge → Objectif minimum : {progression.targetTotalReps} reps total ({exercise.sets}×{exercise.repsMin})
          </p>
        </div>
      );
    }

    if (progression.type === 'stagnation') {
      return (
        <div className="mt-5 rounded-lg bg-gradient-to-br from-primary/12 via-primary/6 to-transparent p-5 border border-primary/20">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">⚡</span>
            <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-primary">
              Stagnation détectée
            </span>
          </div>
          <p className="text-sm text-foreground/80">
            Réduis le volume d'1 série ou envisage un deload
          </p>
        </div>
      );
    }

    // increase_reps
    return (
      <div className="mt-5 rounded-lg bg-gradient-to-br from-warning/12 via-warning/6 to-transparent p-5 border border-warning/20">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xl">🔥</span>
          <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-warning">
            Pousse tes reps !
          </span>
        </div>
        <p className="text-base font-medium text-foreground">
          Objectif : battre <span className="font-mono text-lg font-bold text-warning">{progression.targetTotalReps} reps</span> total
        </p>
      </div>
    );
  };

  return (
    <div className="bg-linen rounded-xl shadow-sm p-6 md:p-8 mb-6 border border-sand relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-sans font-semibold text-lg uppercase tracking-wider text-charcoal">
            {index + 1}. {exercise.name}
          </h3>
          <p className="font-sans text-sm text-stone mt-1">
            Plage : {exercise.repsMin}-{exercise.repsMax} reps · RIR {exercise.rir}
          </p>
        </div>
        {lastEntry && (
          <div className="text-right text-sm">
            <p className="font-sans text-stone uppercase tracking-wide text-xs mb-1">Dernière séance</p>
            <p className="font-mono text-graphite">{lastEntry.charge}kg ({lastEntry.sets.join('-')})</p>
          </div>
        )}
      </div>

      {/* Objectif du Jour */}
      {progression && (
        <div className="bg-terracotta/10 border-l-4 border-terracotta p-4 mb-6 rounded-r-md flex items-center gap-3">
          <span className="text-xl">
            {progression.type === 'increase_charge' ? '🏆' : progression.type === 'stagnation' ? '⚡' : '📈'}
          </span>
          <div>
            {progression.type === 'increase_charge' && (
              <>
                <p className="font-sans font-medium text-charcoal">Objectif : {progression.nextCharge} kg</p>
                <p className="font-sans text-sm text-graphite">Battre {progression.targetTotalReps} reps au total</p>
              </>
            )}
            {progression.type === 'stagnation' && (
              <>
                <p className="font-sans font-medium text-charcoal">Stagnation détectée</p>
                <p className="font-sans text-sm text-graphite">Réduis le volume ou deload</p>
              </>
            )}
            {progression.type === 'increase_reps' && (
              <>
                <p className="font-sans font-medium text-charcoal">Objectif : {progression.nextCharge} kg</p>
                <p className="font-sans text-sm text-graphite">Battre {progression.targetTotalReps} reps au total</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Inputs - Horizontal Grid Layout */}
      <div className="space-y-4">
        {/* Ligne 1: Charge et RIR */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-sans text-xs uppercase tracking-wider text-stone block mb-2">
              Charge (kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              value={charge || ''}
              onChange={(e) => setCharge(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-warm-white border border-sand rounded-md focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all px-4 py-3 font-mono text-lg text-charcoal text-center outline-none min-h-[44px]"
              placeholder="0"
            />
          </div>
          <div>
            <label className="font-sans text-xs uppercase tracking-wider text-stone block mb-2">
              RIR Senti
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={4}
              value={rir}
              onChange={(e) => setRir(parseInt(e.target.value) || 0)}
              className="w-full bg-warm-white border border-sand rounded-md focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all px-4 py-3 font-mono text-lg text-charcoal text-center outline-none min-h-[44px]"
              placeholder="1"
            />
          </div>
        </div>

        {/* Ligne 2: Les Séries en ligne */}
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label className="font-sans text-xs uppercase tracking-wider text-stone">
              Répétitions par série
            </label>
            <span className="font-sans text-xs text-graphite font-medium">
              Total: <span className="font-mono text-terracotta">{totalReps}</span>
            </span>
          </div>
          <div className={`grid ${exercise.sets > 4 ? 'grid-cols-4 md:grid-cols-5' : 'grid-cols-4'} gap-3`}>
            {sets.map((val, i) => (
              <input
                key={i}
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={val || ''}
                onChange={(e) => handleSetChange(i, e.target.value)}
                className="w-full bg-warm-white border border-sand rounded-md focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all px-2 py-3 font-mono text-lg text-charcoal text-center outline-none shadow-sm min-h-[44px]"
                placeholder="-"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={() => {
          if (!canSave) return;
          const input = { charge, sets, rir };
          if (modified && onUpdate) {
            onUpdate(input);
            setSavedValues(input);
            setModified(false);
          } else {
            onSave(input);
            setSavedValues(input);
            // Start timer after save
            if (onStartTimer) {
              onStartTimer(exercise.rest);
            }
          }
        }}
        disabled={!canSave}
        className={`w-full mt-6 rounded-md transition-all active:scale-[0.98] ${saved && !modified
            ? 'bg-sage text-warm-white font-sans font-medium text-sm uppercase tracking-wider py-4'
            : canSave
              ? 'bg-charcoal hover:bg-black text-warm-white font-sans font-medium text-sm uppercase tracking-wider py-4'
              : 'bg-stone/20 text-stone cursor-not-allowed font-sans font-medium text-sm uppercase tracking-wider py-4'
          }`}
      >
        {saved && !modified ? 'Enregistré ✓' : modified ? 'Modifier' : 'Enregistrer & Lancer le repos'}
      </button>
    </div>
  );
}
