export type ContactSubmissionState = {
  view: "form" | "success";
  reference: string;
  error: string;
};

export type ContactSubmissionEvent =
  | { type: "started" }
  | { type: "succeeded"; reference: string }
  | { type: "failed"; error: string }
  | { type: "returned" };

export function createContactSubmissionState(): ContactSubmissionState {
  return {
    view: "form",
    reference: "",
    error: "",
  };
}

export function reduceContactSubmissionState(
  state: ContactSubmissionState,
  event: ContactSubmissionEvent,
): ContactSubmissionState {
  switch (event.type) {
    case "succeeded":
      return {
        view: "success",
        reference: event.reference,
        error: "",
      };
    case "failed":
      return {
        view: "form",
        reference: "",
        error: event.error,
      };
    case "started":
      return state.error ? createContactSubmissionState() : state;
    case "returned":
      return createContactSubmissionState();
  }
}

export function getContactConfirmationMessage(template: string): string {
  return template
    .replace(/\s*\([^()]*\{\{reference\}\}[^()]*\)/g, "")
    .replace(/\s*（[^（）]*\{\{reference\}\}[^（）]*）/g, "")
    .replace("{{reference}}", "")
    .replace(/\s+([,.;:!?，。；：！？])/g, "$1")
    .trim();
}

export function getContactReferenceLine(
  lang: "en" | "zh",
  reference: string,
): string {
  return lang === "zh"
    ? `申请编号：${reference}`
    : `Reference: ${reference}`;
}
