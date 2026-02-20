import { SessionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown, User } from 'lucide-react';

interface SessionHeaderProps {
  session: SessionType;
  completedCount: number;
  totalCount: number;
  onChangeSession: (session: SessionType) => void;
  hidden?: boolean;
  userEmail?: string;
  onAuthClick?: () => void;
}

export default function SessionHeader({
  session,
  completedCount,
  totalCount,
  onChangeSession,
  hidden = false,
  userEmail,
  onAuthClick
}: SessionHeaderProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Format: "MAR. 12" -> "MAR 12"
  const dateStr = format(new Date(), "EEE d", { locale: fr }).toUpperCase().replace('.', '');

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-smooth mb-safe-top",
        hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
      )}
    >
      {/* Sleek blur backdrop */}
      <div className="absolute inset-0 bg-mb-bg/85 supports-[backdrop-filter]:bg-mb-bg/60 backdrop-blur-2xl border-b border-white/5" />

      <div className="relative px-6 pt-5 pb-4 max-w-lg mx-auto flex items-end justify-between">
        {/* Left: Large Title & Date */}
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-[0.12em] text-mb-primary uppercase mb-1.5 ml-0.5">
            {dateStr}
          </span>
          <div className="relative group">
            <button className="flex items-center gap-2 outline-none active:opacity-60 transition-opacity">
              <h1 className="font-display text-4xl font-semibold text-mb-fg tracking-tight">
                Séance {session}
              </h1>
              <div className="w-7 h-7 mt-1 rounded-full bg-mb-surface border border-white/5 flex items-center justify-center shadow-sm">
                <ChevronDown className="w-4 h-4 text-mb-muted" />
              </div>
            </button>

            {/* Dropdown Menu */}
            <div className="absolute left-0 top-full mt-3 w-48 bg-mb-surface border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50 overflow-hidden backdrop-blur-xl">
              {(['A', 'B', 'C'] as SessionType[]).map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSession(s)}
                  className={cn(
                    "w-full text-left px-5 py-3.5 text-sm font-medium transition-colors hover:bg-white/5 active:bg-white/10 flex items-center justify-between",
                    session === s ? "text-mb-primary bg-mb-primary/5" : "text-mb-fg"
                  )}
                >
                  <span>Séance {s}</span>
                  {session === s && <div className="w-1.5 h-1.5 rounded-full bg-mb-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Progress & Auth */}
        <div className="flex items-center gap-3 pb-1.5">
          {/* Minimalist Progress Pill */}
          {totalCount > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-mb-surface border border-white/5 flex items-center gap-2 shadow-sm">
              <span className="text-xs font-mono font-medium text-mb-fg tabular-nums">{completedCount}/{totalCount}</span>
            </div>
          )}

          {/* Auth Button */}
          {onAuthClick && (
            <button
              onClick={onAuthClick}
              className="transition-transform active:scale-90 outline-none relative"
              title={userEmail ? `Connecté: ${userEmail}` : 'Se connecter'}
            >
              {userEmail ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-mb-primary text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_-3px_rgba(193,68,14,0.4)]">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-mb-success rounded-full border-2 border-mb-bg" />
                </>
              ) : (
                <div className="w-10 h-10 rounded-full bg-mb-surface border border-white/10 flex items-center justify-center shadow-sm hover:bg-white/5 transition-colors text-mb-fg">
                  <User className="w-5 h-5" />
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Ultra-thin Progress Bar (Bottom Line) */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-mb-surface">
        <div
          className="h-full bg-mb-primary shadow-[0_0_10px_rgba(193,68,14,0.6)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </header>
  );
}
