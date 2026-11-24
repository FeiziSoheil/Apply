"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TagInputProps = {
  value: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** Maximum number of tags */
  maxTags?: number;
  /** Maximum length of one tag */
  maxLength?: number;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  className?: string;
};

/**
 * Free-text tags: Enter, comma (`,` / `،`) or leaving the field adds a tag;
 * Backspace on an empty field removes the last one. Works with
 * `<FormControl>` (forwards `id` / `aria-*` to the real `<input>`).
 */
export function TagInput({
  value,
  onChange,
  placeholder = "برچسب را بنویسید و Enter بزنید",
  maxTags,
  maxLength = 40,
  disabled,
  id,
  className,
  ...aria
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const atLimit = maxTags !== undefined && value.length >= maxTags;

  function commit(raw: string) {
    const tag = raw.trim();
    setDraft("");
    if (!tag || atLimit || value.includes(tag)) return;
    onChange([...value, tag]);
  }

  function remove(tag: string) {
    onChange(value.filter((item) => item !== tag));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === "،") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      data-slot="tag-input"
      aria-disabled={disabled}
      className={cn(
        "flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-destructive/20 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 dark:bg-input/30",
        className,
      )}
    >
      <ul className="contents" aria-label="برچسب‌های انتخاب‌شده">
        {value.map((tag) => (
          <li key={tag}>
            <Badge variant="secondary" className="h-6 gap-1 pe-1">
              {tag}
              <button
                type="button"
                disabled={disabled}
                onClick={() => remove(tag)}
                aria-label={`حذف برچسب ${tag}`}
                className="rounded-full p-0.5 outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden />
              </button>
            </Badge>
          </li>
        ))}
      </ul>
      <input
        id={id}
        type="text"
        value={draft}
        disabled={disabled || atLimit}
        maxLength={maxLength}
        placeholder={atLimit ? undefined : placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        className="min-w-32 flex-1 bg-transparent py-0.5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        {...aria}
      />
    </div>
  );
}
