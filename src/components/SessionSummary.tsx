import { Exercise, WorkoutEntry } from '@/lib/types';
import { calculateProgression } from '@/lib/progression';

interface SessionSummaryProps {
    exercises: Exercise[];
    workoutData: Record<string, WorkoutEntry[]>;
    savedExercises: Set<string>;
    session: string;
    onClose: () => void;
}

export default function SessionSummary({
    exercises,
    workoutData,
    savedExercises,
    session,
    onClose,
}: SessionSummaryProps) {
    const completedCount = savedExercises.size;
    const totalCount = exercises.length;

    // Calculate total volume
    const totalVolume = exercises.reduce((acc, ex) => {
        const history = workoutData[ex.id] || [];
        if (history.length === 0) return acc;
        const latest = history[history.length - 1];
        const repsTotal = latest.sets.reduce((a, b) => a + b, 0);
        return acc + latest.charge * repsTotal;
    }, 0);

    // Get progressions
    const progressions = exercises
        .map((ex) => {
            const history = workoutData[ex.id] || [];
            const progression = calculateProgression(ex, history);
            return progression ? { name: ex.name, ...progression } : null;
        })
        .filter(Boolean) as Array<{ name: string; type: string; message: string }>;

    const improvements = progressions.filter(
        (p) => p.type === 'increase_charge' || p.type === 'increase_reps'
    );
    const stagnations = progressions.filter((p) => p.type === 'stagnation');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 backdrop-blur-sm p-6">
            <div className="bg-linen rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-sage text-white px-6 py-5 text-center">
                    <div className="text-3xl mb-2">🎉</div>
                    <h2 className="font-display text-2xl font-light tracking-tight">
                        Séance {session} terminée
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                        {completedCount}/{totalCount} exercices complétés
                    </p>
                </div>

                {/* Stats */}
                <div className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-warm-white rounded-lg p-4 text-center">
                            <p className="font-sans text-[10px] uppercase tracking-wider text-stone">
                                Volume total
                            </p>
                            <p className="font-mono text-2xl text-charcoal mt-1">
                                {totalVolume.toLocaleString('fr-FR')}
                                <span className="text-sm text-stone ml-1">kg</span>
                            </p>
                        </div>
                        <div className="bg-warm-white rounded-lg p-4 text-center">
                            <p className="font-sans text-[10px] uppercase tracking-wider text-stone">
                                Exercices
                            </p>
                            <p className="font-mono text-2xl text-charcoal mt-1">
                                {completedCount}/{totalCount}
                            </p>
                        </div>
                    </div>

                    {/* Progressions */}
                    {improvements.length > 0 && (
                        <div>
                            <p className="font-sans text-xs uppercase tracking-wider text-stone mb-2">
                                📈 Progressions
                            </p>
                            <div className="space-y-1.5">
                                {improvements.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 text-sm text-charcoal bg-sage/10 rounded-md px-3 py-2"
                                    >
                                        <span className="text-sage">↑</span>
                                        <span className="font-sans">{p.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stagnations */}
                    {stagnations.length > 0 && (
                        <div>
                            <p className="font-sans text-xs uppercase tracking-wider text-stone mb-2">
                                ⚠️ Points d'attention
                            </p>
                            <div className="space-y-1.5">
                                {stagnations.map((p, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 text-sm text-charcoal bg-terracotta/10 rounded-md px-3 py-2"
                                    >
                                        <span className="text-terracotta">→</span>
                                        <span className="font-sans">{p.name} — stagnation</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full bg-charcoal text-warm-white rounded-lg py-4 font-sans text-sm font-medium uppercase tracking-wider transition-all hover:bg-charcoal/90 active:scale-[0.98]"
                    >
                        Continuer
                    </button>
                </div>
            </div>
        </div>
    );
}
