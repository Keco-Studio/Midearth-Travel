type ScrollViewport = {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
  scrollTo: (options: ScrollToOptions) => void;
};

export function scheduleScrollRestoration(
  position: number,
  viewport: ScrollViewport = window,
): () => void {
  const frame = viewport.requestAnimationFrame(() => {
    viewport.scrollTo({ top: position, left: 0, behavior: "instant" });
  });

  return () => viewport.cancelAnimationFrame(frame);
}
