"use client";

import { useEffect, useRef, useState } from "react";
import { toPersianDigits } from "@/lib/format";

const AUTOSAVE_INTERVAL_MS = 30_000;

type UseDraftAutosaveOptions = {
  /** Only run when the form is dirty */
  enabled: boolean;
  /** Persist draft; should not toast on success */
  save: () => Promise<void>;
  intervalMs?: number;
};

/**
 * Saves a draft every `intervalMs` (default 30s) while `enabled` is true.
 * Returns a Persian relative label like «ذخیره شد، ۱۲ ثانیه پیش».
 */
export function useDraftAutosave({
  enabled,
  save,
  intervalMs = AUTOSAVE_INTERVAL_MS,
}: UseDraftAutosaveOptions): {
  lastSavedLabel: string | null;
  isAutosaving: boolean;
} {
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [isAutosaving, setIsAutosaving] = useState(false);
  const saveRef = useRef(save);
  const inFlight = useRef(false);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      if (inFlight.current) return;
      inFlight.current = true;
      setIsAutosaving(true);
      void saveRef
        .current()
        .then(() => {
          setLastSavedAt(Date.now());
        })
        .catch(() => {
          /* caller surfaces errors if needed */
        })
        .finally(() => {
          inFlight.current = false;
          setIsAutosaving(false);
        });
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs]);

  useEffect(() => {
    if (lastSavedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  if (lastSavedAt === null) {
    return { lastSavedLabel: null, isAutosaving };
  }

  const seconds = Math.max(0, Math.floor((now - lastSavedAt) / 1000));
  const lastSavedLabel = `ذخیره شد، ${toPersianDigits(seconds)} ثانیه پیش`;
  return { lastSavedLabel, isAutosaving };
}
