import assert from "node:assert/strict";
import test from "node:test";

type ScrollRestorationModule = {
  scheduleScrollRestoration?: (
    position: number,
    viewport: {
      requestAnimationFrame: (callback: FrameRequestCallback) => number;
      cancelAnimationFrame: (handle: number) => void;
      scrollTo: (options: ScrollToOptions) => void;
    },
  ) => () => void;
};

async function loadScrollRestorationModule(): Promise<ScrollRestorationModule> {
  try {
    return await import("../src/lib/admin-scroll-restoration.ts") as ScrollRestorationModule;
  } catch {
    return {};
  }
}

test("restores the Tour Library scroll position after the list renders", async () => {
  const { scheduleScrollRestoration } = await loadScrollRestorationModule();
  assert.equal(typeof scheduleScrollRestoration, "function");
  if (!scheduleScrollRestoration) return;

  let scheduled: FrameRequestCallback | undefined;
  const scrollCalls: ScrollToOptions[] = [];
  const viewport = {
    requestAnimationFrame(callback: FrameRequestCallback) {
      scheduled = callback;
      return 17;
    },
    cancelAnimationFrame() {},
    scrollTo(options: ScrollToOptions) {
      scrollCalls.push(options);
    },
  };

  scheduleScrollRestoration(1840, viewport);

  assert.deepEqual(scrollCalls, []);
  scheduled?.(0);
  assert.deepEqual(scrollCalls, [{ top: 1840, left: 0, behavior: "instant" }]);
});

test("cancels a pending Tour Library scroll restoration", async () => {
  const { scheduleScrollRestoration } = await loadScrollRestorationModule();
  assert.equal(typeof scheduleScrollRestoration, "function");
  if (!scheduleScrollRestoration) return;

  let scheduled: FrameRequestCallback | undefined;
  const cancelled: number[] = [];
  const scrollCalls: ScrollToOptions[] = [];
  const viewport = {
    requestAnimationFrame(callback: FrameRequestCallback) {
      scheduled = callback;
      return 23;
    },
    cancelAnimationFrame(handle: number) {
      cancelled.push(handle);
      scheduled = undefined;
    },
    scrollTo(options: ScrollToOptions) {
      scrollCalls.push(options);
    },
  };

  const cancel = scheduleScrollRestoration(900, viewport);
  cancel();
  scheduled?.(0);

  assert.deepEqual(cancelled, [23]);
  assert.deepEqual(scrollCalls, []);
});
