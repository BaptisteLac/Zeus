import { useState, useEffect, useRef, useCallback } from 'react';

interface RestTimerProps {
  defaultSeconds: number;
  onStartTimer?: (seconds: number) => void;
}

export default function RestTimer({ defaultSeconds, onStartTimer }: RestTimerProps) {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [total, setTotal] = useState(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setRemaining(0);
  }, [stop]);

  const start = useCallback(() => {
    // If parent wants to handle timer, delegate to it
    if (onStartTimer) {
      onStartTimer(defaultSeconds);
      return;
    }
    // Otherwise, handle locally
    stop();
    setRemaining(defaultSeconds);
    setTotal(defaultSeconds);
    setRunning(true);
  }, [defaultSeconds, stop, onStartTimer]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stop();
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            osc.frequency.value = 880;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 300);
          } catch { }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, stop]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = total > 0 ? remaining / total : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="font-mono text-2xl font-medium text-foreground tabular-nums">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        {!running ? (
          <button
            onClick={start}
            className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-all duration-400 ease-smooth hover:-translate-y-0.5"
          >
            {defaultSeconds}s
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={stop}
              className="rounded-lg border border-foreground/20 bg-transparent px-3 py-1.5 text-[12px] font-medium text-foreground transition-all duration-400 ease-smooth hover:bg-foreground/5"
            >
              Stop
            </button>
            <button
              onClick={reset}
              className="rounded-lg border border-foreground/10 bg-transparent px-3 py-1.5 text-[12px] font-medium text-stone transition-all duration-400 ease-smooth hover:bg-foreground/5"
            >
              Reset
            </button>
          </div>
        )}
      </div>
      {running && (
        <div className="h-0.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
