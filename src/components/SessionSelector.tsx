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
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-mb-muted mr-1">
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
                                ? 'bg-mb-primary text-white shadow-sm'
                                : 'bg-mb-surface border border-white/5 text-mb-muted hover:border-mb-primary hover:text-mb-primary'
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
