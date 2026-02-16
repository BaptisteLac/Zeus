import { useState, useMemo, useEffect, useRef } from 'react';
import { Exercise, WorkoutEntry, ExerciseInput } from '@/lib/types';
import { calculateProgression } from '@/lib/progression';
import { ChevronDown, ChevronUp, History, Info } from 'lucide-react';

interface ExerciseCardProps {
  index: number;
  exercise: Exercise;
  history: WorkoutEntry[];
  onSave: (input: ExerciseInput) => void;
  onUpdate?: (input: ExerciseInput) => void;
  onStartTimer?: (seconds: number) => void;
  onEditDefinition?: () => void;
  saved: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function ExerciseCard({
  index,
  exercise,
  history,
  onSave,
  onUpdate,
  onStartTimer,
  onEditDefinition,
  saved,
  isExpanded = true,
  onToggle,
}: ExerciseCardProps) {
  // Long-press detection (supports both touch and mouse)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const isTouchDevice = useRef(false);

  const startLongPress = () => {
    longPressTriggered.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggered.current = true;
      if (onEditDefinition) {
        if (navigator.vibrate) navigator.vibrate(50);
        onEditDefinition();
      }
    }, 500);
  };

  const endLongPress = (triggerToggle: boolean) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    if (triggerToggle) onToggle?.();
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressTriggered.current = false;
  };

  // Touch handlers
  const handleHeaderTouchStart = () => { isTouchDevice.current = true; startLongPress(); };
  const handleHeaderTouchEnd = () => endLongPress(true);
  const handleHeaderTouchCancel = () => cancelLongPress();

  // Mouse handlers (only fire on non-touch devices)
  const handleHeaderMouseDown = () => { if (!isTouchDevice.current) startLongPress(); };
  const handleHeaderMouseUp = () => { if (!isTouchDevice.current) endLongPress(true); };
  const handleHeaderMouseLeave = () => { if (!isTouchDevice.current) cancelLongPress(); };
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
  const [rir, setRir] = useState(lastEntry ? lastEntry.rir : 1);
  const [modified, setModified] = useState(false);
  const [savedValues, setSavedValues] = useState<ExerciseInput | null>(null);

  // Set Stepper state
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Set<number>>(new Set());
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const totalReps = sets.reduce((a, b) => a + b, 0);
  const filledSetsCount = sets.filter((s) => s > 0).length;
  const allSetsFilled = filledSetsCount === exercise.sets;
  const canSave = charge > 0 && sets.some((s) => s > 0);

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

  const handleChipFocus = (i: number) => {
    setActiveSetIndex(i);
  };

  const handleValidateSet = (setIndex: number) => {
    // Mark the set as completed
    setCompletedSets((prev) => {
      const next = new Set(prev);
      next.add(setIndex);
      return next;
    });

    // Move to next uncompleted set
    const nextIndex = findNextUncompletedSet(setIndex);
    if (nextIndex !== null) {
      setActiveSetIndex(nextIndex);
      // Focus the next input after a small delay for DOM update
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
      }, 100);
    }

    // Start timer
    if (onStartTimer) {
      onStartTimer(exercise.rest);
    }
  };

  const findNextUncompletedSet = (afterIndex: number): number | null => {
    for (let i = afterIndex + 1; i < exercise.sets; i++) {
      if (!completedSets.has(i)) return i;
    }
    return null;
  };

  const handleSaveAll = () => {
    if (!canSave) return;
    const input = { charge, sets, rir };
    if (modified && onUpdate) {
      onUpdate(input);
      setSavedValues(input);
      setModified(false);
    } else {
      onSave(input);
      setSavedValues(input);
      // Mark all as completed
      setCompletedSets(new Set(sets.map((_, i) => i)));
    }
  };

  const handleValidateAndSave = () => {
    if (!canSave) return;

    const currentSetHasReps = sets[activeSetIndex] > 0;
    const isLastSet = completedSets.size === exercise.sets - 1 && currentSetHasReps;

    if (saved && modified) {
      // Modification mode
      const input = { charge, sets, rir };
      if (onUpdate) onUpdate(input);
      setSavedValues(input);
      setModified(false);
      return;
    }

    if (allSetsFilled && completedSets.size === 0) {
      // Free-fill mode: all sets filled at once, save everything
      handleSaveAll();
      return;
    }

    if (isLastSet || (allSetsFilled && completedSets.size > 0)) {
      // Last set or all filled after some individual validations → save everything
      handleValidateSet(activeSetIndex);
      const input = { charge, sets, rir };
      onSave(input);
      setSavedValues(input);
      setCompletedSets(new Set(sets.map((_, i) => i)));
      return;
    }

    if (currentSetHasReps) {
      // Validate individual set + start timer
      handleValidateSet(activeSetIndex);
    }
  };

  // Determine button state
  const getButtonConfig = () => {
    if (saved && !modified) {
      return {
        label: 'Enregistré ✓',
        style: 'bg-sage text-warm-white',
        disabled: false,
      };
    }
    if (saved && modified) {
      return {
        label: 'Modifier',
        style: 'bg-charcoal hover:bg-black text-warm-white',
        disabled: false,
      };
    }
    if (!canSave) {
      return {
        label: 'Enregistrer',
        style: 'bg-stone/20 text-stone cursor-not-allowed',
        disabled: true,
      };
    }
    // All sets filled and none validated individually → global save
    if (allSetsFilled && completedSets.size === 0) {
      return {
        label: 'Enregistrer l\'exercice',
        style: 'bg-charcoal hover:bg-black text-warm-white',
        disabled: false,
      };
    }
    // Last remaining set
    const remainingSets = exercise.sets - completedSets.size;
    if (remainingSets === 1 && sets[activeSetIndex] > 0) {
      return {
        label: 'Terminer l\'exercice ✓',
        style: 'bg-sage hover:bg-sage/90 text-warm-white',
        disabled: false,
      };
    }
    // Active set has reps → validate + timer
    if (sets[activeSetIndex] > 0) {
      return {
        label: `Valider S${activeSetIndex + 1} & Repos ⏱`,
        style: 'bg-charcoal hover:bg-black text-warm-white',
        disabled: false,
      };
    }
    return {
      label: `Remplir S${activeSetIndex + 1}`,
      style: 'bg-stone/20 text-stone cursor-not-allowed',
      disabled: true,
    };
  };

  const getChipState = (i: number): 'active' | 'done' | 'pending' => {
    if (completedSets.has(i) && i !== activeSetIndex) return 'done';
    if (i === activeSetIndex) return 'active';
    return 'pending';
  };

  const chipStyles = {
    active:
      'border-2 border-terracotta ring-2 ring-terracotta/20 bg-warm-white',
    done: 'border border-sage/40 bg-sage/10',
    pending: 'border border-sand bg-warm-white',
  };

  const labelStyles = {
    active: 'text-terracotta font-semibold',
    done: 'text-sage font-semibold',
    pending: 'text-stone',
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className={`bg-linen rounded-xl shadow-sm border border-sand relative transition-all duration-300 mb-6 ${isExpanded ? 'p-6 md:p-8' : 'hover:border-terracotta/40'} ${saved ? 'animate-success-glow border-sage/40' : ''}`}
    >
      {/* Header — tap to toggle, long-press to edit */}
      <div
        className={`flex justify-between items-start cursor-pointer select-none ${isExpanded ? 'mb-6' : 'p-4'}`}
        onTouchStart={handleHeaderTouchStart}
        onTouchEnd={handleHeaderTouchEnd}
        onTouchCancel={handleHeaderTouchCancel}
        onMouseDown={handleHeaderMouseDown}
        onMouseUp={handleHeaderMouseUp}
        onMouseLeave={handleHeaderMouseLeave}
      >
        <div className="flex items-center gap-3">
          <h3 className="font-sans font-semibold text-lg uppercase tracking-wider text-charcoal">
            {index + 1}. {exercise.name}
          </h3>
          {!isExpanded && saved && (
            <span className="text-sage text-sm">✓</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isExpanded && saved && lastEntry && (
            <span className="font-mono text-sm text-graphite">
              {lastEntry.charge}kg ({lastEntry.sets.join('-')})
            </span>
          )}
          {!isExpanded && !saved && (
            <span className="text-[11px] text-stone uppercase tracking-wider">en attente</span>
          )}
          {isExpanded && (
            <p className="font-sans text-sm text-stone mt-1">
              Plage : {exercise.repsMin}-{exercise.repsMax} reps · RIR {exercise.rir}
            </p>
          )}
        </div>
      </div>

      {/* Collapsed: show summary row */}
      {!isExpanded && !saved && (
        <div className="px-4 pb-3">
          <p className="font-sans text-xs text-stone">
            {exercise.repsMin}-{exercise.repsMax} reps · {exercise.sets} séries · Repos {exercise.rest}s
          </p>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <>
          {/* Last entry + Sparkline (only in expanded) */}
          {history.length > 0 && (
            <div className="flex justify-end items-end gap-3 mb-4">

              <div className="text-right text-sm">
                <p className="font-sans text-stone uppercase tracking-wide text-xs mb-1">Dernière séance</p>
                <p className="font-mono text-graphite">{lastEntry!.charge}kg ({lastEntry!.sets.join('-')})</p>
              </div>
            </div>
          )}

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

          {/* Inputs */}
          <div className="space-y-4">
            {/* Smart defaults label */}
            {lastEntry && !saved && (
              <p className="text-[11px] text-stone italic text-center">
                Pré-rempli depuis ta dernière séance
              </p>
            )}

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
                  onChange={(e) => setRir(parseInt(e.target.value))}
                  className="w-full bg-warm-white border border-sand rounded-md focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-all px-4 py-3 font-mono text-lg text-charcoal text-center outline-none min-h-[44px]"
                  placeholder="1"
                />
              </div>
            </div>

            {/* Set Chips */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="font-sans text-xs uppercase tracking-wider text-stone">
                  Séries
                </label>
                <span className="font-sans text-xs text-graphite font-medium">
                  Total: <span className="font-mono text-terracotta">{totalReps}</span>
                </span>
              </div>

              <div className="flex flex-row gap-2">
                {sets.map((val, i) => {
                  const state = getChipState(i);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-[60px]">
                      {/* Set label */}
                      <span className={`text-[10px] uppercase tracking-widest font-sans ${labelStyles[state]}`}>
                        {state === 'done' ? '✓' : `S${i + 1}`}
                      </span>

                      {/* Input chip */}
                      <div className={`relative w-full rounded-lg transition-all duration-300 ${chipStyles[state]} ${state === 'done' ? 'animate-chip-bounce' : ''}`}>
                        <input
                          ref={(el) => { inputRefs.current[i] = el; }}
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={val || ''}
                          onChange={(e) => handleSetChange(i, e.target.value)}
                          onFocus={() => handleChipFocus(i)}
                          className={`w-full bg-transparent rounded-lg px-2 py-3 font-mono text-lg text-center outline-none min-h-[48px] transition-colors ${state === 'done' ? 'text-sage font-semibold' : 'text-charcoal'
                            }`}
                          placeholder="-"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-sand/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sage transition-all duration-500 ease-out"
                    style={{
                      width: `${(completedSets.size / exercise.sets) * 100}%`,
                    }}
                  />
                </div>
                <span className="font-sans text-[11px] text-stone tabular-nums">
                  {completedSets.size}/{exercise.sets}
                </span>
              </div>
            </div>
          </div>

          {/* Contextual Action Button */}
          <button
            onClick={handleValidateAndSave}
            disabled={buttonConfig.disabled}
            className={`w-full mt-6 rounded-md transition-all duration-300 active:scale-[0.98] font-sans font-medium text-sm uppercase tracking-wider py-4 ${buttonConfig.style}`}
          >
            {buttonConfig.label}
          </button>
        </>
      )}
    </div>
  );
}
