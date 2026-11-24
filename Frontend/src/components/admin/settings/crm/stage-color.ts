import type { PipelineStageColor } from "@/contracts/crm";
import { cn } from "@/lib/utils";

const COLOR_CLASS: Record<PipelineStageColor, string> = {
  slate: "bg-slate-500",
  blue: "bg-blue-500",
  cyan: "bg-cyan-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

export function stageColorDotClass(color: PipelineStageColor): string {
  return cn("size-3 shrink-0 rounded-full", COLOR_CLASS[color]);
}

export function stageColorBarClass(color: PipelineStageColor): string {
  return cn("h-2 rounded-full", COLOR_CLASS[color]);
}
