"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { crmApi } from "@/features/crm/api";
import { crmKeys } from "@/features/crm/keys";

const INTERVAL_MS = 30_000;

/**
 * Dev/mock-only: every 30s asks the mock API to emit due-task notifications.
 * Real backends should use a scheduled job — see docs/crm-domain.md.
 */
export function useTaskReminderScheduler(enabled: boolean) {
  const queryClient = useQueryClient();
  const running = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return;

    async function tick() {
      if (running.current) return;
      running.current = true;
      try {
        const result = await crmApi.processTaskReminders();
        if (result.created > 0) {
          await queryClient.invalidateQueries({ queryKey: ["notifications"] });
          await queryClient.invalidateQueries({ queryKey: crmKeys.tasksAll() });
        }
      } catch {
        // Silent: scheduler must never break the panel
      } finally {
        running.current = false;
      }
    }

    void tick();
    const id = window.setInterval(() => {
      void tick();
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, queryClient]);
}
