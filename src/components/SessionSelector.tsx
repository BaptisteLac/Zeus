import { SessionType } from '@/lib/types';

interface SessionSelectorProps {
    currentSession: SessionType;
    onChange: (session: SessionType) => void;
}

const sessions: SessionType[] = ['A', 'B', 'C'];

export default function SessionSelector({
    currentSession,
    onChange,
}: SessionSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone mr-1">
                Séance:
            </span>
            <div className="flex gap-1.5">
                {sessions.map((session) => (
                    <button
                        key={session}
                        onClick={() => onChange(session)}
                        className={`
              min-w-[32px] h-[32px] rounded-md font-mono text-sm font-medium
              transition-all duration-300 ease-smooth
              ${currentSession === session
                                ? 'bg-terracotta text-warm-white shadow-sm'
                                : 'bg-warm-white border border-sand text-stone hover:border-terracotta hover:text-terracotta'
                            }
            `}
                        aria-label={`Séance ${session}`}
                    >
                        {session}
                    </button>
                ))}
            </div>
        </div>
    );
}
