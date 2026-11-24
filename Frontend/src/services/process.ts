import { processSteps } from "@/data/process";
import { mockDelay } from "@/lib/mock-delay";
import type { ProcessStep } from "@/types";

export async function getProcessSteps(): Promise<ProcessStep[]> {
  "use cache";
  await mockDelay();
  return processSteps;
}
