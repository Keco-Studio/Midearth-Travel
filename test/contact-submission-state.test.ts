import assert from "node:assert/strict";
import test from "node:test";

test("a successful contact submission replaces the form with its reference", async () => {
  const submission = await import("../src/lib/contact-submission-state.ts").catch(
    () => null,
  );

  assert.ok(submission, "contact submission state contract is unavailable");
  const initial = submission.createContactSubmissionState();

  assert.deepEqual(
    submission.reduceContactSubmissionState(initial, {
      type: "succeeded",
      reference: "REQ-2048",
    }),
    {
      view: "success",
      reference: "REQ-2048",
      error: "",
    },
  );
});

test("returning from confirmation restores a clean contact form state", async () => {
  const submission = await import("../src/lib/contact-submission-state.ts").catch(
    () => null,
  );

  assert.ok(submission, "contact submission state contract is unavailable");
  const confirmed = submission.reduceContactSubmissionState(
    submission.createContactSubmissionState(),
    { type: "succeeded", reference: "REQ-2048" },
  );

  assert.deepEqual(
    submission.reduceContactSubmissionState(confirmed, { type: "returned" }),
    {
      view: "form",
      reference: "",
      error: "",
    },
  );
});

test("a failed contact submission keeps the form visible with its error", async () => {
  const submission = await import("../src/lib/contact-submission-state.ts").catch(
    () => null,
  );

  assert.ok(submission, "contact submission state contract is unavailable");
  const initial = submission.createContactSubmissionState();

  assert.deepEqual(
    submission.reduceContactSubmissionState(initial, {
      type: "failed",
      error: "Unable to submit request.",
    }),
    {
      view: "form",
      reference: "",
      error: "Unable to submit request.",
    },
  );
});

test("confirmation copy keeps the request reference out of the message", async () => {
  const submission = await import("../src/lib/contact-submission-state.ts");

  assert.equal(
    typeof submission.getContactConfirmationMessage,
    "function",
    "contact confirmation message formatter is unavailable",
  );
  assert.equal(
    submission.getContactConfirmationMessage(
      "Request received. We will be in touch shortly ({{reference}}).",
    ),
    "Request received. We will be in touch shortly.",
  );
  assert.equal(
    submission.getContactConfirmationMessage(
      "已收到，我们会尽快联系你（编号 {{reference}}）。",
    ),
    "已收到，我们会尽快联系你。",
  );
});

test("contact reference renders as one direct localized line", async () => {
  const submission = await import("../src/lib/contact-submission-state.ts");

  assert.equal(
    typeof submission.getContactReferenceLine,
    "function",
    "contact reference line formatter is unavailable",
  );
  assert.equal(
    submission.getContactReferenceLine("en", "QR-2026-9893FF17"),
    "Reference: QR-2026-9893FF17",
  );
  assert.equal(
    submission.getContactReferenceLine("zh", "QR-2026-9893FF17"),
    "申请编号：QR-2026-9893FF17",
  );
});
