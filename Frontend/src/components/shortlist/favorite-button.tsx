"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useIsFavorite,
  useToggleFavorite,
  type ShortlistTarget,
} from "@/features/shortlist/use-shortlist";

type FavoriteButtonProps = {
  target: ShortlistTarget;
  className?: string;
  size?: "sm" | "default" | "icon";
};

export function FavoriteButton({
  target,
  className,
  size = "icon",
}: FavoriteButtonProps) {
  const { isFavorite, isLoading } = useIsFavorite(target);
  const toggleFavorite = useToggleFavorite();
  const [isPending, setIsPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPending || isLoading) return;
    setIsPending(true);
    try {
      await toggleFavorite(target, isFavorite);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      disabled={isPending}
      onClick={handleClick}
      aria-label={
        isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"
      }
      className={cn(
        "relative rounded-full transition-colors hover:bg-background/80 hover:text-rose-500",
        isFavorite ? "text-rose-500" : "text-muted-foreground",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-5 transition-transform duration-200 active:scale-125",
          isFavorite ? "fill-current text-rose-500" : "fill-transparent",
        )}
      />
    </Button>
  );
}
