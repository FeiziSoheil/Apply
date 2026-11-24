"use client";

import {
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { toPersianDigits } from "@/lib/format";
import { normalizeDigits } from "@/lib/validations/common";
import { OTP_LENGTH } from "@/lib/validations/login";

type OtpInputProps = {
  /** Current code (digits only, up to `OTP_LENGTH`) */
  value: string;
  onChange: (code: string) => void;
  /** Fired once when the last digit is filled (typing or paste) */
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  /** Id of the element describing / reporting an error */
  describedBy?: string;
  /** Spoken group label */
  label?: string;
};

function sanitize(raw: string): string {
  return normalizeDigits(raw).replace(/\D/g, "");
}

/**
 * Six single-digit boxes with auto-advance, backspace/arrow navigation and
 * paste auto-fill (also Persian digits and the SMS "one-time-code" suggestion).
 * The row is always LTR so digits read left to right like the SMS.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  describedBy,
  label = "کد تأیید شش رقمی",
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  function focusAt(index: number) {
    const el = refs.current[Math.min(Math.max(index, 0), OTP_LENGTH - 1)];
    el?.focus();
    el?.select();
  }

  function commit(next: string, focusIndex: number) {
    onChange(next);
    focusAt(focusIndex);
    if (next.length === OTP_LENGTH && value.length !== OTP_LENGTH) {
      onComplete?.(next);
    }
  }

  function handleChange(index: number, raw: string) {
    const typed = sanitize(raw);
    const next = digits.slice();

    if (typed.length === 0) {
      next[index] = "";
      onChange(next.join(""));
      return;
    }
    // Several characters in one box: SMS autofill or a quick paste
    const chars = typed.slice(0, OTP_LENGTH - index).split("");
    chars.forEach((char, offset) => {
      next[index + offset] = char;
    });
    commit(next.join(""), index + chars.length);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      const next = digits.slice();
      next[index - 1] = "";
      onChange(next.join(""));
      focusAt(index - 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = sanitize(event.clipboardData.getData("text")).slice(
      0,
      OTP_LENGTH,
    );
    if (!pasted) return;
    commit(pasted, pasted.length);
  }

  return (
    <div
      className="flex justify-center gap-2"
      dir="ltr"
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
    >
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          value={digit}
          disabled={disabled}
          aria-label={`رقم ${toPersianDigits(index + 1)} از ${toPersianDigits(OTP_LENGTH)}`}
          aria-invalid={invalid ? true : undefined}
          className="h-12 w-10 px-0 text-center text-lg font-semibold tabular-nums sm:w-11"
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  );
}
