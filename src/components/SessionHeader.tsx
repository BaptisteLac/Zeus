import { SessionType } from '@/lib/types';

interface SessionHeaderProps {
  session: SessionType;
  block: 1 | 2 | 3;
  week: number;
  blockChanged: boolean;
  onReset: () => void;
  onChangeBlock: (block: 1 | 2 | 3) => void;
  onExport: () => void;
  onImport: () => void;
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
  onReset,
  onChangeBlock,
  onExport,
  onImport,
}: SessionHeaderProps) {
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
        <div className="flex items-center gap-3 pt-2">
          <button onClick={onExport} className="text-stone transition-colors duration-300 hover:text-foreground" aria-label="Exporter">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </button>
          <button onClick={onImport} className="text-stone transition-colors duration-300 hover:text-foreground" aria-label="Importer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
          Bloc {block}
        </span>
        <span className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
          Semaine {week}
        </span>

        <div className="ml-auto flex items-center gap-2">
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
            className="text-[11px] font-medium uppercase tracking-[0.06em] text-stone transition-colors duration-300 hover:text-primary"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 h-px bg-border" />
    </div>
  );
}
