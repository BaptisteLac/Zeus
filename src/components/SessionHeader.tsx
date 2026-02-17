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

import { ChevronDown, RotateCcw } from 'lucide-react';


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

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SessionSelector currentSession={session} onChange={onChangeSession} />

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          {/* Week Badge */}
          <div className="flex items-center whitespace-nowrap rounded-md border border-border px-3 py-1.5 bg-background">
            <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-stone/70 mr-1.5">Semaine</span>
            <span className="text-xs font-mono font-medium text-foreground">{week}</span>
          </div>

          {/* Block Select */}
          <div className="relative group flex-1 sm:flex-none">
            <select
              value={block}
              onChange={(e) => onChangeBlock(Number(e.target.value) as 1 | 2 | 3)}
              className="appearance-none w-full bg-background border border-border rounded-md pl-3 pr-8 py-1.5 text-xs font-medium text-stone focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta/20 transition-all cursor-pointer hover:border-stone/40 shadow-sm"
            >
              <option value={1}>Bloc 1</option>
              <option value={2}>Bloc 2</option>
              <option value={3}>Bloc 3</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone pointer-events-none group-hover:text-foreground transition-colors" />
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="ml-auto sm:ml-2 p-2 rounded-md hover:bg-stone/5 text-stone/60 hover:text-destructive transition-colors"
            title="Réinitialiser"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Session progress bar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-sand/30 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${completedCount === totalCount && totalCount > 0
              ? 'bg-sage'
              : 'bg-sage'
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
