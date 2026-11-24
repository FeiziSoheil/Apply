"use client";

import { useId, useSyncExternalStore } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { getQueryClient } from "@/lib/api/query-client";
import {
  getMockScenario,
  isMockScenarioId,
  setMockScenario,
  subscribeMockScenario,
} from "@/lib/api/mock-scenario";
import { DEMO_ACCOUNTS, isPersistenceEnabled } from "../config";
import { resetDb } from "../db";
import { SCENARIOS } from "../scenarios";

const NORMAL = "normal";

/**
 * Dev-only floating control of the mock API: pick the failure scenario that is
 * sent as `x-mock-scenario` with every request, or re-seed the in-memory db.
 */
export function ScenarioPanel() {
  const scenario = useSyncExternalStore(
    subscribeMockScenario,
    getMockScenario,
    () => null,
  );
  const groupId = useId();

  const select = (value: string) => {
    setMockScenario(isMockScenarioId(value) ? value : null);
    // Re-run the visible queries so the page reflects the new scenario at once
    void getQueryClient().invalidateQueries();
  };

  const reseed = () => {
    resetDb();
    void getQueryClient().invalidateQueries();
  };

  const active = SCENARIOS.find((item) => item.id === scenario);

  return (
    <div className="fixed start-4 bottom-[calc(5rem+var(--demo-banner-height))] z-50 md:bottom-[calc(1rem+var(--demo-banner-height))]" data-mock-panel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            aria-label={active ? `Mock API: ${active.label}` : "Mock API"}
            className="shadow-md"
          >
            <FlaskConical aria-hidden />
            <span>Mock API</span>
            {active ? (
              <Badge variant="secondary" className="ms-1">
                {active.label}
              </Badge>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-80">
          <PopoverHeader>
            <PopoverTitle>سناریوی API آزمایشی</PopoverTitle>
            <PopoverDescription>
              فقط در حالت توسعه. سناریوی انتخابی با هدر x-mock-scenario روی همه
              درخواست‌ها اعمال می‌شود.
            </PopoverDescription>
          </PopoverHeader>

          <RadioGroup
            value={scenario ?? NORMAL}
            onValueChange={select}
            aria-label="سناریو"
            className="gap-1.5"
          >
            <div className="flex items-start gap-2">
              <RadioGroupItem value={NORMAL} id={`${groupId}-${NORMAL}`} />
              <Label htmlFor={`${groupId}-${NORMAL}`} className="flex flex-col items-start gap-0.5">
                <span>عادی</span>
                <span className="text-xs font-normal text-muted-foreground">
                  پاسخ‌های واقعی mock با تأخیر ۲۰۰ تا ۶۰۰ میلی‌ثانیه
                </span>
              </Label>
            </div>
            {SCENARIOS.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <RadioGroupItem value={item.id} id={`${groupId}-${item.id}`} />
                <Label
                  htmlFor={`${groupId}-${item.id}`}
                  className="flex flex-col items-start gap-0.5"
                >
                  <span>{item.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {item.description}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Separator />

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <p>
              ورود کارمند: {DEMO_ACCOUNTS.admin.email} / {DEMO_ACCOUNTS.admin.password}
            </p>
            <p>
              ورود دانشجو: {DEMO_ACCOUNTS.student.mobile} با کد {DEMO_ACCOUNTS.student.otp}
            </p>
            <p>
              ماندگاری داده‌ها:{" "}
              {isPersistenceEnabled() ? "localStorage (فعال)" : "فقط حافظه (با رفرش پاک می‌شود)"}
            </p>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={reseed}>
            <RotateCcw aria-hidden />
            بازنشانی داده‌ها
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
