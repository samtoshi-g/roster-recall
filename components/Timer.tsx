'use client';

import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  duration: number;
  onComplete?: () => void;
  onTick?: (secondsLeft: number) => void;
  isRunning: boolean;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Timer({ duration, onComplete, onTick, isRunning }: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + duration * 1000;
    }

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const next = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(next);
      onTick?.(next);
      if (next === 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [duration, isRunning, onComplete, onTick]);

  const isLow = secondsLeft <= 60 && secondsLeft > 30;
  const isCritical = secondsLeft <= 30;

  return (
    <div
      className={`flex items-center gap-3 rounded-full border border-white/10 bg-surface px-4 py-2 text-lg font-semibold shadow-glow ${
        isCritical ? 'text-rose-300 animate-pulseLow' : isLow ? 'text-amber-200' : 'text-slate-100'
      }`}
    >
      <span className="text-sm uppercase tracking-[0.2em] text-muted">Time</span>
      <span className="font-display text-2xl">{formatTime(secondsLeft)}</span>
    </div>
  );
}
