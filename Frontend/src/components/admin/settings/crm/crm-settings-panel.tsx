"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";
import { PageContainer } from "@/components/panel/page-container";
import { PageHeader } from "@/components/panel/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CRM_SETTINGS_TAB_IDS,
  CRM_SETTINGS_TAB_ITEMS,
} from "./crm-settings-tabs";
import { AssignmentRulesTab } from "./assignment-rules-tab";
import { CampaignCostsTab } from "./campaign-costs-tab";
import { CaseTemplatesTab } from "./case-templates-tab";
import { DefaultsSettingsTab } from "./defaults-settings-tab";
import { LostReasonsTab } from "./lost-reasons-tab";
import { MessageTemplatesTab } from "./message-templates-tab";
import { PipelineSettingsTab } from "./pipeline-settings-tab";
import { TagsSettingsTab } from "./tags-settings-tab";

const tabParser = parseAsStringLiteral(CRM_SETTINGS_TAB_IDS).withDefault(
  "pipeline",
);

export function CrmSettingsPanel() {
  const [tab, setTab] = useQueryState("tab", tabParser);

  return (
    <PageContainer>
      <PageHeader
        title="تنظیمات CRM"
        description="هر بخش جدا ذخیره می‌شود؛ پس از ذخیره، کانبان و فیلترها بلافاصله به‌روز می‌شوند."
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav
          aria-label="بخش‌های تنظیمات CRM"
          className="bg-muted/30 flex shrink-0 flex-row gap-1 overflow-x-auto rounded-xl border p-2 lg:w-56 lg:flex-col"
        >
          {CRM_SETTINGS_TAB_ITEMS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={tab === item.id ? "secondary" : "ghost"}
              className={cn(
                "h-auto justify-start whitespace-nowrap px-3 py-2 text-start",
                tab === item.id && "bg-background shadow-sm",
              )}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => void setTab(item.id)}
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-muted-foreground hidden text-xs font-normal lg:block">
                  {item.description}
                </span>
              </span>
            </Button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === "pipeline" ? <PipelineSettingsTab /> : null}
          {tab === "lostReasons" ? <LostReasonsTab /> : null}
          {tab === "tags" ? <TagsSettingsTab /> : null}
          {tab === "assignmentRules" ? <AssignmentRulesTab /> : null}
          {tab === "messageTemplates" ? <MessageTemplatesTab /> : null}
          {tab === "caseTemplates" ? <CaseTemplatesTab /> : null}
          {tab === "campaignCosts" ? <CampaignCostsTab /> : null}
          {tab === "defaults" ? <DefaultsSettingsTab /> : null}
        </div>
      </div>
    </PageContainer>
  );
}
