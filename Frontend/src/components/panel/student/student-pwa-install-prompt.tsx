"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const VISITS_KEY = "apply_panel_visits";
const DISMISSED_KEY = "apply_pwa_dismissed";
const MIN_VISITS_TO_PROMPT = 2;

export function StudentPwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || (typeof navigator !== "undefined" && navigator.webdriver)) return;

    // Register service worker specifically scoped to /panel
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/panel" })
        .catch(() => {
          // SW registration failed or unsupported in this context
        });
    }

    // Check dismissal status
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === "never") return;

    // Track visit count
    const currentVisits = Number(localStorage.getItem(VISITS_KEY) || 0) + 1;
    localStorage.setItem(VISITS_KEY, String(currentVisits));

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as unknown as { standalone?: boolean }).standalone);

    if (isStandalone) return;

    // Capture beforeinstallprompt on Chrome/Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (currentVisits >= MIN_VISITS_TO_PROMPT) {
        setVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // If on iOS or event already fired/not needed, show after visits threshold
    if (currentVisits >= MIN_VISITS_TO_PROMPT && !dismissed) {
      const timer = window.setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => {
        window.clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(DISMISSED_KEY, "never");
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosInstructions(true);
    } else {
      localStorage.setItem(DISMISSED_KEY, "never");
      setVisible(false);
    }
  };

  const handleDismissLater = () => {
    setVisible(false);
  };

  const handleNeverRemind = () => {
    localStorage.setItem(DISMISSED_KEY, "never");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="پیشنهاد نصب اپلیکیشن"
      data-testid="pwa-install-prompt"
      className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md rounded-2xl border bg-card p-4 shadow-xl backdrop-blur-md md:bottom-6 md:left-auto md:right-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Smartphone className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              افزودن به صفحه اصلی
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
              برای دسترسی سریع‌تر، اپلیکیشن را به صفحه اصلی گوشی اضافه کنید.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          aria-label="بستن پیشنهاد"
          onClick={handleDismissLater}
        >
          <X className="size-4" />
        </Button>
      </div>

      {showIosInstructions ? (
        <div className="mt-3 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground leading-normal">
          در مرورگر سافاری، روی دکمهٔ <strong>اشتراک‌گذاری (Share)</strong> در پایین صفحه زده و گزینهٔ <strong>Add to Home Screen</strong> را انتخاب کنید.
        </div>
      ) : null}

      <div className="mt-3.5 flex items-center justify-between gap-2 pt-1 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] text-muted-foreground hover:text-foreground"
          onClick={handleNeverRemind}
        >
          یادآوری نشود
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={handleDismissLater}
          >
            بعداً
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 gap-1.5 shadow-sm"
            onClick={handleInstallClick}
          >
            <Download className="size-3.5" aria-hidden="true" />
            نصب / افزودن
          </Button>
        </div>
      </div>
    </aside>
  );
}
