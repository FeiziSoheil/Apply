"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type PanelDetailDrawerContextValue = {
  active: boolean;
  slotClassName?: string;
  setActive: (active: boolean, options?: { className?: string }) => void;
  container: HTMLElement | null;
  setContainer: (node: HTMLElement | null) => void;
};

const PanelDetailDrawerContext =
  createContext<PanelDetailDrawerContextValue | null>(null);

/** Keep in sync with AdminSideDrawer exit delay */
export const PANEL_DETAIL_DRAWER_MS = 700;

export function usePanelDetailDrawer() {
  const ctx = useContext(PanelDetailDrawerContext);
  if (!ctx) {
    throw new Error(
      "usePanelDetailDrawer باید داخل PanelDetailDrawerProvider استفاده شود.",
    );
  }
  return ctx;
}

export function PanelDetailDrawerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [active, setActiveState] = useState(false);
  const [slotClassName, setSlotClassName] = useState<string | undefined>();
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const setActive = useCallback(
    (next: boolean, options?: { className?: string }) => {
      setActiveState(next);
      if (next) {
        setSlotClassName(options?.className);
      }
      // Keep last width class while closing so max-width does not snap.
    },
    [],
  );

  const value = useMemo(
    () => ({ active, slotClassName, setActive, container, setContainer }),
    [active, slotClassName, setActive, container],
  );

  return (
    <PanelDetailDrawerContext.Provider value={value}>
      {children}
    </PanelDetailDrawerContext.Provider>
  );
}

/**
 * Desktop-only third island. Content is portaled in by `AdminSideDrawer`.
 * Width/opacity animate so the main column shrinks and grows smoothly.
 */
export function PanelDetailDrawerSlot() {
  const { active, slotClassName, setContainer } = usePanelDetailDrawer();
  const reduceMotion = useReducedMotion();

  return (
    <aside
      ref={setContainer}
      data-slot="panel-detail-drawer"
      data-state={active ? "open" : "closed"}
      aria-hidden={!active}
      className={cn(
        "hidden min-h-0 shrink-0 flex-col overflow-hidden md:flex",
        "md:rounded-2xl md:border md:bg-card",
        reduceMotion
          ? undefined
          : "transition-[width,max-width,opacity,border-color,margin-inline-start] duration-700 ease-[cubic-bezier(0.33,1,0.36,1)]",
        active
          ? cn("ms-2 w-full opacity-100", slotClassName ?? "max-w-lg")
          : "pointer-events-none ms-0 w-0 max-w-0 border-transparent opacity-0",
      )}
    />
  );
}
