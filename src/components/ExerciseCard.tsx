import { useState, useMemo, useEffect, useRef } from 'react';
import { Exercise, WorkoutEntry, ExerciseInput } from '@/lib/types';
import { calculateProgression } from '@/lib/progression';
import { Check, ChevronDown, Dumbbell, MoreVertical, RotateCw, Trash2, History, Pencil } from "lucide-react";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { NumberStepper } from './ui/NumberStepper';

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
  onDelete?: () => void;
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
  onDelete,
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Set Stepper state
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Set<number>>(() => {
    if (saved) return new Set(Array.from({ length: exercise.sets }, (_, i) => i));
    return new Set();
  });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll card into view when expanded
  useEffect(() => {
    if (!isExpanded || !cardRef.current) return;
    const timer = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  // Resync sets array when exercise definition changes (e.g. number of sets edited)
  useEffect(() => {
    setSets((prev) => {
      if (prev.length === exercise.sets) return prev;
      return Array.from({ length: exercise.sets }, (_, i) => prev[i] ?? 0);
    });
    setCompletedSets((prev) => {
      const next = new Set(prev);
      for (const idx of next) {
        if (idx >= exercise.sets) next.delete(idx);
      }
      return next;
    });
  }, [exercise.sets]);

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
        style: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        disabled: false,
      };
    }
    if (!canSave) {
      return {
        label: 'Enregistrer',
        style: 'bg-muted text-muted-foreground cursor-not-allowed',
        disabled: true,
      };
    }
    // All sets filled and none validated individually → global save
    if (allSetsFilled && completedSets.size === 0) {
      return {
        label: 'Enregistrer l\'exercice',
        style: 'bg-sage hover:bg-sage/90 text-white shadow-lg shadow-sage/20',
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
        style: 'bg-brand hover:bg-brand/90 text-white shadow-lg shadow-brand/20',
        disabled: false,
      };
    }
    return {
      label: `Remplir S${activeSetIndex + 1}`,
      style: 'bg-muted text-muted-foreground cursor-not-allowed',
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
      'border border-brand ring-1 ring-brand bg-input text-brand',
    done: 'border border-sage/40 bg-sage/10 text-sage',
    pending: 'border border-transparent bg-input text-muted-foreground',
  };

  const labelStyles = {
    active: 'text-terracotta font-semibold',
    done: 'text-sage font-semibold',
    pending: 'text-stone',
  };

  const getStatusStyles = () => {
    if (saved) return "bg-surface/50 border-t border-white/5 opacity-60";
    if (isExpanded) return "bg-surface border-t border-white/10 my-4 shadow-none";
    return "bg-surface border-t border-white/5 hover:bg-surface/90 mb-3 transition-colors";
  };

  const statusBadge = saved ? (
    <span className="px-2.5 py-0.5 rounded-full bg-sage/10 text-sage text-xs font-medium border border-sage/20 flex items-center gap-1">
      <Check className="w-3 h-3" />
      VALIDÉ
    </span>
  ) : isExpanded ? (
    <span className="px-2.5 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-xs font-medium border border-terracotta/20">
      EN COURS
    </span>
  ) : (
    <span className="px-2.5 py-0.5 rounded-full bg-sand/30 text-stone text-xs font-medium border border-sand/30">
      EN ATTENTE
    </span>
  );
  const buttonConfig = getButtonConfig();

  return (
    <div
      ref={cardRef}
      style={{ scrollMarginTop: '220px' }}
      className={cn(
        "relative overflow-hidden transition-all duration-500 ease-smooth rounded-2xl",
        getStatusStyles()
      )}
    >
      <div
        className={cn(
          "px-4 py-4 flex flex-col gap-2 transition-all duration-300",
          isExpanded ? "pb-2" : ""
        )}
        onClick={() => !isExpanded && onToggle?.()}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0" onClick={() => isExpanded && onToggle?.()}>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between w-full">
                <h3 className={cn(
                  "font-display uppercase tracking-wide text-lg leading-tight pr-2 transition-colors duration-300",
                  isExpanded ? "text-primary font-semibold" : "text-foreground font-medium"
                )}>
                  {exercise.name}
                </h3>
                {isExpanded ? (
                  <div className="flex items-center gap-2">
                    {/* More Options Drawer Trigger */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                        <DrawerTrigger asChild>
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-surface hover:text-foreground transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DrawerTrigger>
                        <DrawerContent className="bg-background border-t border-white/10 px-6 pb-8">
                          <DrawerHeader className="text-left px-0 pt-6 pb-4">
                            <DrawerTitle className="font-display text-2xl font-light tracking-tight">
                              {exercise.name}
                            </DrawerTitle>
                            <DrawerDescription>
                              Gère cet exercice
                            </DrawerDescription>
                          </DrawerHeader>
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={() => {
                                setDrawerOpen(false);
                                onEditDefinition?.();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-4 bg-surface rounded-xl border border-white/5 hover:bg-white/5 active:scale-[0.98] transition-all"
                            >
                              <span className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                                <Pencil className="w-4 h-4" />
                              </span>
                              <span className="font-medium">Modifier l'exercice</span>
                            </button>

                            {onDelete && (
                              <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full flex items-center gap-3 px-4 py-4 bg-destructive/5 rounded-xl border border-destructive/10 hover:bg-destructive/10 active:scale-[0.98] transition-all text-destructive"
                              >
                                <span className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </span>
                                <span className="font-medium">Supprimer l'exercice</span>
                              </button>
                            )}
                          </div>
                          <DrawerFooter className="px-0 pt-4">
                            <DrawerClose asChild>
                              <button className="w-full py-4 text-center font-medium text-muted-foreground hover:text-foreground">
                                Annuler
                              </button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                    </div>

                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform duration-500 ease-smooth flex-shrink-0",
                        isExpanded ? "rotate-180 text-brand" : ""
                      )}
                    />
                  </div>
                ) : (
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-500 ease-smooth flex-shrink-0",
                      isExpanded ? "rotate-180 text-brand" : ""
                    )}
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                {statusBadge}
                {!isExpanded && lastEntry && (
                  <span className="text-xs text-stone/60 font-mono flex items-center gap-1">
                    <History className="w-3 h-3" />
                    {lastEntry.charge}kg
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Collapsed view summary - Only show when NOT expanded and NOT saved */}
        {!isExpanded && !saved && (
          <div className="flex items-center gap-2 mt-1 animate-fade-in">
            <span className="text-xs font-mono text-stone/80 bg-white/50 px-2 py-0.5 rounded-md">
              {sets.length} séries
            </span>
            <span className="text-xs font-mono text-stone/80 bg-white/50 px-2 py-0.5 rounded-md">
              {exercise.repsMin}-{exercise.repsMax} reps
            </span>
          </div>
        )}

        {isExpanded && (
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Plage : {exercise.repsMin}-{exercise.repsMax} reps · RIR {exercise.rir}
          </p>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 animate-slide-down">
          {/* Last entry + Sparkline */}
          {history.length > 0 && (
            <div className="flex justify-end items-end gap-3 mb-4">
              <div className="text-right text-sm">
                <p className="font-sans text-muted-foreground uppercase tracking-wide text-xs mb-1">Dernière séance</p>
                <p className="font-mono text-graphite">{lastEntry!.charge}kg ({lastEntry!.sets.join('-')})</p>
              </div>
            </div>
          )}

          {/* Objectif du Jour */}
          {progression && (
            <div className="bg-brand/10 border-l-4 border-brand p-4 mb-6 rounded-r-xl flex items-start gap-3">
              <span className="text-xl">
                {progression.type === 'increase_charge' ? '🏆' : progression.type === 'stagnation' ? '⚡' : '📈'}
              </span>
              <div>
                {progression.type === 'increase_charge' && (
                  <>
                    <p className="font-sans font-medium text-primary">Objectif : {progression.nextCharge} kg</p>
                    <p className="font-sans text-sm text-secondary">Battre {progression.targetTotalReps} reps au total</p>
                  </>
                )}
                {progression.type === 'stagnation' && (
                  <>
                    <p className="font-sans font-medium text-primary">Stagnation détectée</p>
                    <p className="font-sans text-sm text-secondary">Réduis le volume ou deload</p>
                  </>
                )}
                {progression.type === 'increase_reps' && (
                  <>
                    <p className="font-sans font-medium text-primary">Objectif : {progression.nextCharge} kg</p>
                    <p className="font-sans text-sm text-secondary">Battre {progression.targetTotalReps} reps au total</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-4">


            {/* Ligne 1: Charge et RIR */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-sans text-xs uppercase tracking-wider text-muted-foreground block mb-2 text-center">
                  Charge (kg)
                </label>
                <div className="bg-input rounded-xl p-1">
                  <NumberStepper
                    value={charge}
                    onChange={setCharge}
                    step={0.5}
                    min={0}
                    max={500}
                  />
                </div>
              </div>
              <div>
                <label className="font-sans text-xs uppercase tracking-wider text-muted-foreground block mb-2 text-center">
                  RIR Senti
                </label>
                <div className="flex items-center justify-between bg-input rounded-xl p-1 h-12">
                  {[0, 1, 2, 3].map((val) => (
                    <button
                      key={val}
                      onClick={() => setRir(val)}
                      className={cn(
                        "flex-1 h-full rounded-lg text-sm font-mono transition-all",
                        rir === val
                          ? "bg-brand text-white shadow-sm font-medium"
                          : "text-muted-foreground hover:bg-surface"
                      )}
                    >
                      {val}
                    </button>
                  ))}
                  <button
                    onClick={() => setRir(4)}
                    className={cn(
                      "flex-1 h-full rounded-lg text-sm font-mono transition-all",
                      rir >= 4
                        ? "bg-brand text-white shadow-sm font-medium"
                        : "text-muted-foreground hover:bg-surface"
                    )}
                  >
                    4+
                  </button>
                </div>
              </div>
            </div>

            {/* Set Chips */}
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <label className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                  Séries
                </label>
                <span className="font-sans text-xs text-secondary font-medium">
                  Total: <span className="font-mono text-brand">{totalReps}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {sets.map((val, i) => {
                  const state = getChipState(i);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1 min-w-[70px]">
                      {/* Set label */}
                      <span className={cn(
                        "text-[10px] uppercase tracking-widest font-sans",
                        state === 'active' ? 'text-brand font-semibold' : 'text-muted-foreground'
                      )}>
                        {state === 'done' ? '✓' : `S${i + 1}`}
                      </span>

                      {/* Input chip */}
                      <div className={cn(
                        "relative w-full rounded-xl transition-all duration-300",
                        chipStyles[state]
                      )}>
                        <input
                          ref={(el) => { inputRefs.current[i] = el; }}
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={val || ''}
                          onChange={(e) => handleSetChange(i, e.target.value)}
                          onFocus={() => {
                            handleChipFocus(i);
                            setTimeout(() => {
                              inputRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }, 300);
                          }}
                          className={cn(
                            "w-full bg-transparent rounded-xl px-1 py-3 font-mono text-lg text-center outline-none min-h-[48px] transition-colors",
                            state === 'done' ? 'text-sage font-semibold' : 'text-primary'
                          )}
                          placeholder="-"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-input overflow-hidden">
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
            className={cn(
              "w-full mt-6 rounded-full transition-all duration-300 active:scale-[0.98] font-sans font-medium text-sm uppercase tracking-wider py-4 min-h-[48px]",
              buttonConfig.label.includes('Valider') ? 'bg-brand text-white hover:bg-brand/90' :
                buttonConfig.style.replace('bg-primary', 'bg-surface border border-white/10').replace('rounded-md', 'rounded-full')
            )}
          >
            {buttonConfig.label}
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-linen border-sand max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl text-charcoal">
              Supprimer {exercise.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone">
              L'exercice sera retiré de ta séance. L'historique de performances sera conservé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="bg-warm-white border-sand text-stone hover:bg-sand/30">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.();
                setShowDeleteConfirm(false);
                setDrawerOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
