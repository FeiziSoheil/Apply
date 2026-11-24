"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

type VirtualListProps<T> = {
  items: readonly T[];
  /** Approximate row height in px (cards are similar height) */
  estimateSize?: number;
  overscan?: number;
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  /** Scroll parent; defaults to nearest overflow container via ref on wrapper */
  scrollRef?: RefObject<HTMLElement | null>;
};

/**
 * Lightweight windowing for long kanban columns (thousands of cards).
 * Avoids pulling in `@tanstack/react-virtual` just for CRM list smoke.
 */
export function VirtualList<T>({
  items,
  estimateSize = 120,
  overscan = 6,
  getKey,
  renderItem,
  className,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(estimateSize * 8);

  const onScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;
    const update = () => setViewport(el.clientHeight || estimateSize * 8);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [estimateSize, onScroll]);

  const total = items.length;
  const startIndex = Math.max(
    0,
    Math.floor(scrollTop / estimateSize) - overscan,
  );
  const visibleCount = Math.ceil(viewport / estimateSize) + overscan * 2;
  const endIndex = Math.min(total, startIndex + visibleCount);
  const padTop = startIndex * estimateSize;
  const padBottom = Math.max(0, (total - endIndex) * estimateSize);

  const slice = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  const shellStyle: CSSProperties = {
    overflowY: "auto",
    maxHeight: "100%",
    position: "relative",
  };

  // Small lists: no windowing overhead, still scroll inside the column
  if (total <= 40) {
    return (
      <div ref={parentRef} className={className} style={shellStyle}>
        {items.map((item, index) => (
          <div key={getKey(item, index)} className="mb-2 last:mb-0">
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={className}
      style={shellStyle}
      data-virtual-count={total}
    >
      <div style={{ height: padTop }} aria-hidden />
      {slice.map((item, i) => {
        const index = startIndex + i;
        return (
          <div
            key={getKey(item, index)}
            className="mb-2 last:mb-0"
            style={{ minHeight: estimateSize }}
            data-virtual-index={index}
          >
            {renderItem(item, index)}
          </div>
        );
      })}
      <div style={{ height: padBottom }} aria-hidden />
    </div>
  );
}
