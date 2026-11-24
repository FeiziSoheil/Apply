"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Mounted once in the root layout. Renders nothing unless mocking is enabled;
 * then it lazy-loads the scenario picker (a dev-only floating button).
 */
export function MockDevPanel() {
  const [Panel, setPanel] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      process.env.NEXT_PUBLIC_API_MOCKING !== "enabled"
    ) {
      return;
    }
    let cancelled = false;
    void import("./ui/scenario-panel").then((module) => {
      if (!cancelled) setPanel(() => module.ScenarioPanel);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return Panel ? <Panel /> : null;
}
