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
    const [sets, setSets] = useState<number | ''>(3);
    const [repsMin, setRepsMin] = useState<number | ''>(8);
    const [repsMax, setRepsMax] = useState<number | ''>(12);
    const [rest, setRest] = useState<number | ''>(90);
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

    const canSubmit = name.trim().length > 0 && typeof sets === 'number' && sets > 0 && typeof repsMin === 'number' && repsMin > 0 && typeof repsMax === 'number' && repsMax >= repsMin && typeof rest === 'number';

    const handleSubmit = () => {
        if (!canSubmit) return;
        onSubmit({
            name: name.trim(),
            sets: sets as number,
            repsMin: repsMin as number,
            repsMax: repsMax as number,
            rest: rest as number,
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
        'w-full bg-mb-surface border border-mb-input rounded-xl focus:border-mb-primary focus:ring-1 focus:ring-mb-primary transition-all px-4 py-3 font-mono text-base text-mb-fg text-center outline-none min-h-[48px] placeholder:text-mb-muted/50';
    const labelClass = 'font-sans text-xs uppercase tracking-wider text-mb-muted block mb-2';

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="bottom" className="bg-mb-bg border-t border-white/10 rounded-t-2xl max-h-[85dvh] overflow-y-auto px-6 pb-8">
                    <SheetHeader className="text-left mb-6">
                        <SheetTitle className="font-display text-2xl font-light tracking-tight text-mb-fg">
                            {isEditMode ? 'Modifier l\'exercice' : 'Nouvel exercice'}
                        </SheetTitle>
                        <SheetDescription className="text-mb-muted text-sm">
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
                                autoFocus={false}
                                autoComplete="off"
                            />

                            {/* Suggestions dropdown */}
                            {shouldShowSuggestions && (filteredCatalog.length > 0 || !exactMatch) && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute left-0 right-0 top-full mt-1 z-50 bg-mb-surface border border-mb-input rounded-xl shadow-lifted overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
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
                                                        <span className="text-mb-primary text-sm shrink-0">💪</span>
                                                        <div className="min-w-0">
                                                            <span className="text-mb-fg text-sm font-medium block truncate">
                                                                {entry.name}
                                                            </span>
                                                            <span className="text-mb-muted text-[11px]">
                                                                {entry.sets}×{entry.repsMin}-{entry.repsMax} · {entry.rest}s
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        {entry.sessions.map((s) => (
                                                            <span
                                                                key={s}
                                                                className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-mb-muted text-[10px] font-semibold"
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
                                                <div className="border-t border-white/5" />
                                            )}
                                            <button
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => setShowSuggestions(false)}
                                                className="w-full text-left px-4 py-3 hover:bg-mb-primary/10 active:bg-mb-primary/20 transition-colors flex items-center gap-2.5"
                                            >
                                                <span className="w-5 h-5 rounded-full bg-mb-primary/10 flex items-center justify-center shrink-0">
                                                    <svg className="w-3 h-3 text-mb-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                    </svg>
                                                </span>
                                                <span className="text-mb-primary text-sm font-medium">
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSets(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                                    }}
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRest(val === '' ? '' : Math.max(0, parseInt(val) || 0));
                                    }}
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRepsMin(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                                    }}
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setRepsMax(val === '' ? '' : Math.max(1, parseInt(val) || 1));
                                    }}
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
                                            ? 'bg-mb-primary text-white shadow-sm'
                                            : 'bg-mb-surface border border-mb-input text-mb-muted hover:bg-mb-surface/80 hover:text-mb-fg'
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
                                ? 'bg-mb-primary hover:bg-mb-primary/90 text-white'
                                : 'bg-mb-surface border border-white/5 text-mb-muted cursor-not-allowed'
                                }`}
                        >
                            {isEditMode ? 'Enregistrer les modifications' : 'Ajouter l\'exercice'}
                        </button>

                        {/* Delete button (edit mode only) */}
                        {isEditMode && onDelete && (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full rounded-md border-2 border-mb-error/30 text-mb-error font-sans font-medium text-sm uppercase tracking-wider py-4 transition-all duration-300 hover:bg-mb-error/10 active:scale-[0.98]"
                            >
                                Supprimer cet exercice
                            </button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete confirmation dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="bg-mb-bg border-white/10 max-w-sm mx-auto">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-xl text-mb-fg">
                            Supprimer {exercise?.name} ?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-mb-muted">
                            L'exercice sera retiré de ta séance. L'historique de performances sera conservé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="bg-mb-surface border-white/10 text-mb-muted hover:bg-white/5">
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-mb-error text-white hover:bg-mb-error/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
