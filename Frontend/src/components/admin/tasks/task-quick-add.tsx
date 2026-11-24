"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/components/rbac/can";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateTask } from "@/features/crm/mutations";
import { getApiErrorMessage } from "@/lib/api";
import { parseQuickAddPhrase } from "@/lib/tasks/parse-quick-add";

type TaskQuickAddProps = {
  assigneeId: string;
  onOpenFullForm: (seed: { title: string; dueAt?: string }) => void;
};

export function TaskQuickAdd({
  assigneeId,
  onOpenFullForm,
}: TaskQuickAddProps) {
  const createTask = useCreateTask();
  const [value, setValue] = useState("");

  function submit() {
    const parsed = parseQuickAddPhrase(value);
    if (!parsed.ok) {
      if (parsed.reason === "empty") return;
      onOpenFullForm({
        title: parsed.titleHint,
        dueAt:
          parsed.reason === "complex"
            ? undefined
            : new Date(Date.now() + 86_400_000).toISOString(),
      });
      setValue("");
      return;
    }
    createTask.mutate(
      {
        title: parsed.title,
        dueAt: parsed.dueAt,
        assigneeId,
        relatedType: "none",
        priority: "normal",
      },
      {
        onSuccess: () => {
          toast.success("کار اضافه شد");
          setValue("");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <Can permission="task:write">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="سریع اضافه کنید… مثلاً «فردا ۱۰ زنگ بزن»"
          aria-label="افزودن سریع کار"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="button"
          disabled={createTask.isPending}
          onClick={submit}
        >
          <Plus data-icon="inline-start" aria-hidden />
          افزودن
        </Button>
      </div>
    </Can>
  );
}
