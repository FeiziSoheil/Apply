"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BlogShareButtonProps = {
  title: string;
};

export function BlogShareButton({ title }: BlogShareButtonProps) {
  async function handleCopy() {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("لینک مقاله کپی شد", {
        description: title,
      });
    } catch {
      toast.error("کپی لینک ممکن نشد. لطفاً دستی کپی کنید.");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      <Link2 className="size-4" aria-hidden />
      کپی لینک
    </Button>
  );
}
