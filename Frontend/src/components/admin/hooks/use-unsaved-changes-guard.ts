"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

const LEAVE_MESSAGE =
  "تغییرات ذخیره‌نشده دارید. آیا مطمئنید می‌خواهید این صفحه را ترک کنید؟";

type Options = {
  /** When true, leaving the page prompts for confirmation */
  isDirty: boolean;
  /** Override the confirm message (also used by beforeunload where supported) */
  message?: string;
};

/**
 * Warns when the form is dirty: browser tab close / refresh (`beforeunload`)
 * and in-app link clicks that would leave the current URL.
 *
 * Call `confirmLeave()` before programmatic `router.push` / `router.replace`
 * when you want the same prompt.
 */
export function useUnsavedChangesGuard({
  isDirty,
  message = LEAVE_MESSAGE,
}: Options) {
  const router = useRouter();

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let nextUrl: URL;
      try {
        nextUrl = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (nextUrl.origin !== window.location.origin) return;
      if (
        nextUrl.pathname === window.location.pathname &&
        nextUrl.search === window.location.search
      ) {
        return;
      }

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [isDirty, message]);

  const confirmLeave = useCallback((): boolean => {
    if (!isDirty) return true;
    return window.confirm(message);
  }, [isDirty, message]);

  const guardedPush = useCallback(
    (href: string) => {
      if (!confirmLeave()) return;
      router.push(href);
    },
    [confirmLeave, router],
  );

  const guardedReplace = useCallback(
    (href: string) => {
      if (!confirmLeave()) return;
      router.replace(href);
    },
    [confirmLeave, router],
  );

  return { confirmLeave, guardedPush, guardedReplace };
}
