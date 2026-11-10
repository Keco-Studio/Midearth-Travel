"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SyncedHorizontalScrollerProps = {
  children: ReactNode;
  targetSelector?: string;
};

export function SyncedHorizontalScroller({
  children,
  targetSelector = ".ant-table-content, .ant-table-body",
}: SyncedHorizontalScrollerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const topScrollerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const topScroller = topScrollerRef.current;
    const spacer = spacerRef.current;
    if (!root || !topScroller || !spacer) return;

    let tableScroller: HTMLElement | null = null;

    function connectTableScroller() {
      const nextScroller = root?.querySelector<HTMLElement>(targetSelector) ?? null;
      if (nextScroller === tableScroller) return;

      tableScroller?.removeEventListener("scroll", syncFromTable);
      tableScroller = nextScroller;
      tableScroller?.addEventListener("scroll", syncFromTable, { passive: true });
    }

    function syncFromTop() {
      if (tableScroller && tableScroller.scrollLeft !== topScroller!.scrollLeft) {
        tableScroller.scrollLeft = topScroller!.scrollLeft;
      }
    }

    function syncFromTable() {
      if (tableScroller && topScroller!.scrollLeft !== tableScroller.scrollLeft) {
        topScroller!.scrollLeft = tableScroller.scrollLeft;
      }
    }

    function measure() {
      connectTableScroller();
      if (!tableScroller) {
        topScroller!.hidden = true;
        return;
      }

      spacer!.style.width = `${tableScroller.scrollWidth}px`;
      topScroller!.hidden = tableScroller.scrollWidth <= tableScroller.clientWidth + 1;
      syncFromTable();
    }

    topScroller.addEventListener("scroll", syncFromTop, { passive: true });

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(root);

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(root, { childList: true, subtree: true });

    measure();

    return () => {
      topScroller.removeEventListener("scroll", syncFromTop);
      tableScroller?.removeEventListener("scroll", syncFromTable);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [targetSelector]);

  return (
    <div className="cms-synced-horizontal-scroll" ref={rootRef}>
      <div
        aria-label="Tour table horizontal scroll"
        className="cms-synced-horizontal-scrollbar"
        hidden
        ref={topScrollerRef}
        role="region"
        tabIndex={0}
      >
        <div className="cms-synced-horizontal-scrollbar-spacer" ref={spacerRef} />
      </div>
      {children}
    </div>
  );
}
