import { SessionType } from '@/lib/types';
import SessionSelector from './SessionSelector';

interface SessionHeaderProps {
  session: SessionType;
  block: 1 | 2 | 3;
  week: number;
  blockChanged: boolean;
  completedCount: number;
  totalCount: number;
  onReset: () => void;
  onChangeBlock: (block: 1 | 2 | 3) => void;
  onChangeSession: (session: SessionType) => void;
}

const sessionLabels: Record<SessionType, string> = {
  A: 'Séance A',
  B: 'Séance B',
  C: 'Séance C',
};

function formatDate() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function SessionHeader({
  session,
  block,
  week,
  blockChanged,
  completedCount,
  totalCount,
  onReset,
  onChangeBlock,
  onChangeSession,
}: SessionHeaderProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  return (
    <div className="sticky top-0 z-30 bg-background px-6 pt-6 pb-4">
      {blockChanged && (
        <div className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-center text-sm font-medium text-foreground">
          Tu passes en Bloc {block} — les paramètres ont été ajustés.
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-light tracking-tight text-foreground">
            {sessionLabels[session]}
          </h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-stone">
            {formatDate()}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SessionSelector currentSession={session} onChange={onChangeSession} />
        <span className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
          Bloc {block}
        </span>
        <span className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
          Semaine {week}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={block}
            onChange={(e) => onChangeBlock(Number(e.target.value) as 1 | 2 | 3)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-[11px] font-medium text-stone focus:outline-none focus:border-primary"
          >
            <option value={1}>Bloc 1</option>
            <option value={2}>Bloc 2</option>
            <option value={3}>Bloc 3</option>
          </select>
          <button
            onClick={onReset}
            className="text-[11px] font-medium uppercase tracking-[0.06em] text-stone transition-colors duration-300 hover:text-primary whitespace-nowrap"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Session progress bar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-sand/30 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${completedCount === totalCount && totalCount > 0
                ? 'bg-sage'
                : 'bg-terracotta/70'
              }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-sans text-[11px] text-stone tabular-nums whitespace-nowrap">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="mt-3 h-px bg-border" />
    </div>
  );
}
