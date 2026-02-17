import { useState, useEffect, useRef, useMemo } from 'react';
import { Exercise } from '@/lib/types';
import { CatalogEntry } from '@/lib/program';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExerciseFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exercise?: Exercise; // undefined = mode ajout, defined = mode édition
    onSubmit: (exercise: Omit<Exercise, 'id'>) => void;
    onDelete?: () => void; // seulement en mode édition
    catalog?: CatalogEntry[]; // all known exercises for autocomplete
}

const defaultValues: Omit<Exercise, 'id'> = {
    name: '',
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    rest: 90,
    rir: '1',
};

export default function ExerciseFormSheet({
    open,
    onOpenChange,
    exercise,
    onSubmit,
    onDelete,
    catalog = [],
}: ExerciseFormSheetProps) {
    const isEditMode = !!exercise;
    const [name, setName] = useState('');
    const [sets, setSets] = useState(3);
    const [repsMin, setRepsMin] = useState(8);
    const [repsMax, setRepsMax] = useState(12);
    const [rest, setRest] = useState(90);
    const [rir, setRir] = useState('1');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Combobox state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Reset form when opening with exercise data or defaults
    useEffect(() => {
        if (open) {
            if (exercise) {
                setName(exercise.name);
                setSets(exercise.sets);
                setRepsMin(exercise.repsMin);
                setRepsMax(exercise.repsMax);
                setRest(exercise.rest);
                setRir(exercise.rir);
            } else {
                setName(defaultValues.name);
                setSets(defaultValues.sets);
                setRepsMin(defaultValues.repsMin);
                setRepsMax(defaultValues.repsMax);
                setRest(defaultValues.rest);
                setRir(defaultValues.rir);
            }
            setShowSuggestions(false);
        }
    }, [open, exercise]);

    // Filter catalog based on typed name
    const filteredCatalog = useMemo(() => {
        if (!name.trim() || isEditMode) return [];
        const query = name.toLowerCase().trim();
        return catalog.filter((entry) =>
            entry.name.toLowerCase().includes(query)
        );
    }, [name, catalog, isEditMode]);

    // Show suggestions when there's input text and matches exist (in add mode)
    const shouldShowSuggestions = showSuggestions && !isEditMode && name.trim().length > 0;

    // Check if exact name match exists (to decide whether to show "Créer" option)
    const exactMatch = filteredCatalog.find(
        (entry) => entry.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    const handleSelectCatalogEntry = (entry: CatalogEntry) => {
        setName(entry.name);
        setSets(entry.sets);
        setRepsMin(entry.repsMin);
        setRepsMax(entry.repsMax);
        setRest(entry.rest);
        setRir(entry.rir);
        setShowSuggestions(false);
    };

    const handleNameChange = (value: string) => {
        setName(value);
        setShowSuggestions(value.trim().length > 0);
    };

    const canSubmit = name.trim().length > 0 && sets > 0 && repsMin > 0 && repsMax >= repsMin;

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit({
            name: name.trim(),
            sets,
            repsMin,
            repsMax,
            rest,
            rir,
        });
        onOpenChange(false);
    };

    const handleDelete = () => {
        setShowDeleteConfirm(false);
        onDelete?.();
        onOpenChange(false);
    };

    const inputClass =
        'w-full bg-surface border border-input rounded-xl focus:border-brand focus:ring-1 focus:ring-brand transition-all px-4 py-3 font-mono text-base text-foreground text-center outline-none min-h-[48px] placeholder:text-muted-foreground/50';
    const labelClass = 'font-sans text-xs uppercase tracking-wider text-muted-foreground block mb-2';

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="bg-background border-t border-white/10 rounded-t-2xl max-h-[85vh] overflow-y-auto px-6 pb-8">
                    <SheetHeader className="text-left mb-6">
                        <SheetTitle className="font-display text-2xl font-light tracking-tight text-foreground">
                            {isEditMode ? 'Modifier l\'exercice' : 'Nouvel exercice'}
                        </SheetTitle>
                        <SheetDescription className="text-muted-foreground text-sm">
                            {isEditMode
                                ? 'Modifie les paramètres de cet exercice'
                                : 'Ajoute un exercice à ta séance'}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-5">
                        {/* Nom — avec autocomplete en mode ajout */}
                        <div className="relative">
                            <label className={labelClass}>Nom de l'exercice</label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                onFocus={() => {
                                    if (!isEditMode && name.trim().length > 0) setShowSuggestions(true);
                                }}
                                className={`${inputClass} !text-left`}
                                placeholder="Ex: Squat, Développé couché..."
                                autoFocus={!isEditMode}
                                autoComplete="off"
                            />

                            {/* Suggestions dropdown */}
                            {shouldShowSuggestions && (filteredCatalog.length > 0 || !exactMatch) && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute left-0 right-0 top-full mt-1 z-50 bg-surface border border-input rounded-xl shadow-lifted overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
                                >
                                    {/* Matching exercises */}
                                    {filteredCatalog.length > 0 && (
                                        <div className="max-h-[180px] overflow-y-auto">
                                            {filteredCatalog.map((entry) => (
                                                <button
                                                    key={entry.name}
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => handleSelectCatalogEntry(entry)}
                                                    className="w-full text-left px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors flex items-center justify-between gap-3 border-b border-white/5 last:border-b-0"
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span className="text-brand text-sm shrink-0">💪</span>
                                                        <div className="min-w-0">
                                                            <span className="text-foreground text-sm font-medium block truncate">
                                                                {entry.name}
                                                            </span>
                                                            <span className="text-muted-foreground text-[11px]">
                                                                {entry.sets}×{entry.repsMin}-{entry.repsMax} · {entry.rest}s
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        {entry.sessions.map((s) => (
                                                            <span
                                                                key={s}
                                                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-muted-foreground text-[10px] font-semibold"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* "Créer nouveau" option — only if no exact match */}
                                    {!exactMatch && name.trim().length > 0 && (
                                        <>
                                            {filteredCatalog.length > 0 && (
                                                <div className="border-t border-sand/60" />
                                            )}
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => setShowSuggestions(false)}
                                                className="w-full text-left px-4 py-3 hover:bg-brand/10 active:bg-brand/20 transition-colors flex items-center gap-2.5"
                                            >
                                                <span className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                                                    <svg className="w-3 h-3 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                </span>
                                                <span className="text-brand text-sm font-medium">
                                                    Créer « {name.trim()} »
                                                </span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Séries & Repos */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Séries</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={10}
                                    value={sets}
                                    onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Repos (s)</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    step={15}
                                    value={rest}
                                    onChange={(e) => setRest(Math.max(0, parseInt(e.target.value) || 0))}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* Reps Min & Max */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Reps Min</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={50}
                                    value={repsMin}
                                    onChange={(e) => setRepsMin(Math.max(1, parseInt(e.target.value) || 1))}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Reps Max</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={50}
                                    value={repsMax}
                                    onChange={(e) => setRepsMax(Math.max(1, parseInt(e.target.value) || 1))}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        {/* RIR */}
                        <div>
                            <label className={labelClass}>RIR Cible</label>
                            <div className="flex gap-2">
                                {['0', '1', '1-2', '2', '2-3'].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => setRir(value)}
                                        className={`flex-1 rounded-lg py-3 font-mono text-sm font-medium transition-all duration-300 ${rir === value
                                            ? 'bg-brand text-white shadow-sm'
                                            : 'bg-surface border border-input text-muted-foreground hover:bg-surface/80 hover:text-foreground'
                                            }`}
                                    >
                                        {value}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`w-full rounded-full transition-all duration-300 active:scale-[0.98] font-sans font-medium text-sm uppercase tracking-wider py-4 mt-2 ${canSubmit
                                ? 'bg-brand hover:bg-brand/90 text-white'
                                : 'bg-surface border border-white/5 text-muted-foreground cursor-not-allowed'
                                }`}
                        >
                            {isEditMode ? 'Enregistrer les modifications' : 'Ajouter l\'exercice'}
                        </button>

                        {/* Delete button (edit mode only) */}
                        {isEditMode && onDelete && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full rounded-md border-2 border-destructive/30 text-destructive font-sans font-medium text-sm uppercase tracking-wider py-4 transition-all duration-300 hover:bg-destructive/10 active:scale-[0.98]"
                            >
                                Supprimer cet exercice
                            </button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="bg-linen border-sand max-w-sm mx-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-xl text-charcoal">
                            Supprimer {exercise?.name} ?
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
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
