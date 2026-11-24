"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Whole-second countdown. `start(seconds)` (re)starts it; the value stops at 0.
 * The deadline is wall-clock based, so a throttled background tab catches up.
 */
export function useCountdown(): {
  secondsLeft: number;
  start: (seconds: number) => void;
  reset: () => void;
} {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (deadline === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) window.clearInterval(timer);
    };
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [deadline]);

  const start = useCallback((seconds: number) => {
    setSecondsLeft(seconds);
    setDeadline(Date.now() + seconds * 1000);
  }, []);

  const reset = useCallback(() => {
    setSecondsLeft(0);
    setDeadline(null);
  }, []);

  return { secondsLeft, start, reset };
}
