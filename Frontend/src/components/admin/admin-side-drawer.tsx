"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useReducedMotion } from "framer-motion";
import { XIcon } from "lucide-react";
import {
  PANEL_DETAIL_DRAWER_MS,
  usePanelDetailDrawer,
} from "@/components/panel/panel-detail-drawer";
import { Button } from "@/components/ui/button";
import { DrawerHeader } from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type AdminSideDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Extra controls under the title (e.g. file viewer toolbar) */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  /** Desktop island width / layout classes */
  className?: string;
  /** Mobile Sheet side — defaults to `end` */
  sheetSide?: "top" | "right" | "bottom" | "left" | "start" | "end";
  sheetClassName?: string;
};

/**
 * Detail panel for admin managers: on desktop it pushes into the panel shell
 * as a third island (sidebar | content | drawer); on mobile it keeps the
 * existing Sheet overlay.
 */
export function AdminSideDrawer({
  open,
  onOpenChange,
  title,
  description,
  headerExtra,
  children,
  className,
  sheetSide = "end",
  sheetClassName,
}: AdminSideDrawerProps) {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const { setActive, container } = usePanelDetailDrawer();
  const titleId = useId();
  const descriptionId = useId();
  const [desktopMounted, setDesktopMounted] = useState(false);
  const exitMs = reduceMotion ? 0 : PANEL_DETAIL_DRAWER_MS;

  // Keep the desktop portal mounted through the close animation.
  if (!isMobile && open && !desktopMounted) {
    setDesktopMounted(true);
  }
  if (isMobile && desktopMounted) {
    setDesktopMounted(false);
  }

  useEffect(() => {
    if (isMobile) return;

    if (open) {
      setActive(true, { className });
      return;
    }

    setActive(false);
    const timer = window.setTimeout(() => {
      setDesktopMounted(false);
    }, exitMs);
    return () => window.clearTimeout(timer);
  }, [isMobile, open, setActive, className, exitMs]);

  useEffect(() => {
    if (isMobile || !open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobile, open, onOpenChange]);

  useEffect(() => {
    return () => {
      setActive(false);
    };
  }, [setActive]);

  const desktopBody =
    !isMobile && desktopMounted && container
      ? createPortal(
          <div
            role="dialog"
            aria-modal="false"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={cn(
              "relative flex h-full min-h-0 w-full flex-col overflow-hidden",
              reduceMotion
                ? undefined
                : "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.33,1,0.36,1)]",
              open
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-2 opacity-0 rtl:-translate-x-2",
              className,
            )}
          >
            <DrawerHeader className="border-b pe-12 text-start">
              <h2
                id={titleId}
                className="font-heading text-base font-medium text-foreground"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id={descriptionId}
                  className="text-sm text-muted-foreground"
                >
                  {description}
                </p>
              ) : null}
              {headerExtra}
            </DrawerHeader>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-3 end-3"
              aria-label="بستن"
              onClick={() => onOpenChange(false)}
            >
              <XIcon />
            </Button>
            <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              {children}
            </div>
          </div>,
          container,
        )
      : null;

  if (!isMobile) {
    return desktopBody;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={sheetSide}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden data-[side=end]:sm:max-w-lg",
          sheetClassName,
        )}
      >
        <SheetHeader className="border-b pe-12 text-start">
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
          {headerExtra}
        </SheetHeader>
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
