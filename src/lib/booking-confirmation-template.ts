import type { BookingLocale } from "./payment-domain.ts";
import { getLocalizedContent } from "./localized-content.ts";

export type BookingConfirmationRenderInput = {
  locale: BookingLocale;
  content: Record<string, unknown>;
  customerName: string;
  bookingReference: string;
  tourTitle: string;
  tourCode?: string;
  departureSelection: string;
  adults: number;
  children: number;
  duration: string;
  departureCity?: string;
  meetingPlace?: string;
  amountCents: number;
  currency: string;
  tourUrl: string;
};

export type RenderedBookingEmail = {
  subject: string;
  html: string;
  text: string;
};

type BookingLabels = {
  reference: string;
  tour: string;
  tourCode: string;
  departure: string;
  party: string;
  duration: string;
  departureCity: string;
  meetingPlace: string;
  amount: string;
  viewTour: string;
  greeting: (name: string) => string;
};

type BookingFact = {
  label: string;
  value: string;
};

const labels: Record<BookingLocale, BookingLabels> = {
  en: {
    reference: "Booking reference",
    tour: "Tour",
    tourCode: "Tour code",
    departure: "Departure",
    party: "Travel party",
    duration: "Duration",
    departureCity: "Departure city",
    meetingPlace: "Meeting place",
    amount: "Amount paid",
    viewTour: "View tour",
    greeting: (name) => `Hello, ${name}`,
  },
  zh: {
    reference: "预订编号",
    tour: "旅游行程",
    tourCode: "行程编号",
    departure: "出发日期",
    party: "出行人数",
    duration: "行程时长",
    departureCity: "出发城市",
    meetingPlace: "集合地点",
    amount: "已付金额",
    viewTour: "查看行程",
    greeting: (name) => `您好，${name}`,
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function escapeHtmlWithBreaks(value: string): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
}

function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function formatParty(locale: BookingLocale, adults: number, children: number): string {
  if (locale === "zh") {
    return `${adults} 位成人，${children} 位儿童`;
  }

  return `${adults} ${adults === 1 ? "adult" : "adults"}, ${children} ${children === 1 ? "child" : "children"}`;
}

function formatAmount(input: BookingConfirmationRenderInput): string {
  return new Intl.NumberFormat(input.locale === "zh" ? "zh-CN" : "en-CA", {
    style: "currency",
    currency: input.currency.toUpperCase(),
  }).format(input.amountCents / 100);
}

function isSafeTourUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function createFacts(
  input: BookingConfirmationRenderInput,
  localizedLabels: BookingLabels,
  amount: string,
): BookingFact[] {
  const facts: BookingFact[] = [
    { label: localizedLabels.reference, value: input.bookingReference },
    { label: localizedLabels.tour, value: input.tourTitle },
  ];

  if (hasValue(input.tourCode)) facts.push({ label: localizedLabels.tourCode, value: input.tourCode });

  facts.push(
    { label: localizedLabels.departure, value: input.departureSelection },
    { label: localizedLabels.party, value: formatParty(input.locale, input.adults, input.children) },
    { label: localizedLabels.duration, value: input.duration },
  );

  if (hasValue(input.departureCity)) {
    facts.push({ label: localizedLabels.departureCity, value: input.departureCity });
  }
  if (hasValue(input.meetingPlace)) {
    facts.push({ label: localizedLabels.meetingPlace, value: input.meetingPlace });
  }

  facts.push({ label: localizedLabels.amount, value: amount });
  return facts;
}

function renderHtmlFacts(facts: BookingFact[]): string {
  return facts
    .map(({ label, value }) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("");
}

function renderTextFacts(facts: BookingFact[]): string {
  return facts.map(({ label, value }) => `${label}: ${value}`).join("\n");
}

export function renderBookingConfirmationEmail(
  input: BookingConfirmationRenderInput,
): RenderedBookingEmail {
  const localizedLabels = labels[input.locale];
  const subject = getLocalizedContent(
    input.content,
    "confirmationEmailSubject",
    input.locale,
    input.locale === "zh" ? "付款已确认" : "Payment confirmed",
  );
  const heading = getLocalizedContent(
    input.content,
    "confirmationEmailHeading",
    input.locale,
    input.locale === "zh" ? "行程已确认！" : "Your trip is confirmed!",
  );
  const body = getLocalizedContent(
    input.content,
    "confirmationEmailBody",
    input.locale,
    input.locale === "zh" ? "感谢您的预订。" : "Thanks for booking.",
  );
  const closing = getLocalizedContent(
    input.content,
    "confirmationEmailClosing",
    input.locale,
    input.locale === "zh" ? "旅途愉快。" : "See you soon.",
  );
  const amount = formatAmount(input);
  const facts = createFacts(input, localizedLabels, amount);
  const safeTourUrl = isSafeTourUrl(input.tourUrl) ? input.tourUrl : null;
  const htmlLink = safeTourUrl
    ? `<p><a href="${escapeHtml(safeTourUrl)}">${escapeHtml(localizedLabels.viewTour)}</a></p>`
    : "";
  const textLink = safeTourUrl ? `${localizedLabels.viewTour}: ${safeTourUrl}` : "";
  const textSections = [
    localizedLabels.greeting(input.customerName),
    heading,
    body,
    renderTextFacts(facts),
    textLink,
    closing,
  ].filter((section) => section.length > 0);

  return {
    subject,
    html: [
      `<p>${escapeHtml(localizedLabels.greeting(input.customerName))}</p>`,
      `<h1>${escapeHtml(heading)}</h1>`,
      `<p>${escapeHtmlWithBreaks(body)}</p>`,
      `<table><tbody>${renderHtmlFacts(facts)}</tbody></table>`,
      htmlLink,
      `<p>${escapeHtmlWithBreaks(closing)}</p>`,
    ].join(""),
    text: textSections.join("\n\n"),
  };
}
