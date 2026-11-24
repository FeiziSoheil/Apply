"use client";

import { useMemo } from "react";
import { useSession } from "@/components/auth/auth-provider";
import { useUnreadNotificationCount } from "@/features/notifications/queries";
import { useMyStudentTasks, useMyTickets } from "@/features/student-panel/queries";
import { StudentBottomNav, type StudentNavBadges } from "./student-bottom-nav";
import { StudentHeader } from "./student-header";
import { StudentSidebar } from "./student-sidebar";
import { StudentPwaInstallPrompt } from "./student-pwa-install-prompt";
import { StudentOnboardingTour } from "./student-onboarding-tour";

type StudentPanelShellProps = {
  children: React.ReactNode;
};

/**
 * شل پنل دانشجو: سایدبار دسکتاپ + هدر ساده + ناوبری پایین موبایل.
 * جایگزین `PanelShell` فقط برای `/panel`.
 */
export function StudentPanelShell({ children }: StudentPanelShellProps) {
  const { status } = useSession();
  const enabled = status === "authenticated";

  const unread = useUnreadNotificationCount({ enabled });
  const tasks = useMyStudentTasks({ enabled });
  const tickets = useMyTickets(
    { page: 1, pageSize: 20, status: "waiting_student" },
    { enabled },
  );

  const badges = useMemo<StudentNavBadges>(() => {
    const overdue =
      tasks.data?.filter((task) => task.status === "overdue").length ?? 0;
    const todoDocs =
      tasks.data?.filter(
        (task) =>
          task.kind === "upload_document" && task.status !== "done",
      ).length ?? 0;
    const waitingReplies = tickets.data?.pagination.total ?? 0;
    const notif = unread.data?.count ?? 0;

    return {
      home: notif > 0 ? notif : overdue,
      case: overdue,
      documents: todoDocs,
      messages: waitingReplies,
    };
  }, [tasks.data, tickets.data, unread.data]);

  return (
    <div className="flex h-[calc(100svh-var(--demo-banner-height))] overflow-hidden bg-muted/30">
      <StudentSidebar badges={badges} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <StudentHeader />
        <main
          tabIndex={0}
          role="region"
          aria-label="محتوای پنل دانشجو"
          className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto pb-16 md:pb-0 focus-visible:outline-none"
        >
          {children}
        </main>
        <StudentBottomNav badges={badges} />
      </div>
      <StudentPwaInstallPrompt />
      <StudentOnboardingTour />
    </div>
  );
}
