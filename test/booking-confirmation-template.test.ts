import assert from "node:assert/strict";
import test from "node:test";
import { renderBookingConfirmationEmail } from "../src/lib/booking-confirmation-template.ts";

const content = {
  confirmationEmailSubjectEn: "Payment confirmed",
  confirmationEmailHeadingEn: "Your trip is confirmed!",
  confirmationEmailBodyEn: "Thanks for booking.",
  confirmationEmailClosingEn: "See you soon.",
  confirmationEmailSubjectZh: "付款已确认",
  confirmationEmailHeadingZh: "行程已确认！",
  confirmationEmailBodyZh: "感谢您的预订。",
  confirmationEmailClosingZh: "旅途愉快。",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertPresentInBoth(result: { html: string; text: string }, value: string): void {
  assert.match(result.html, new RegExp(escapeRegExp(value)));
  assert.match(result.text, new RegExp(escapeRegExp(value)));
}

test("renders Chinese booking facts in both formats", () => {
  const result = renderBookingConfirmationEmail({
    locale: "zh",
    content,
    customerName: "王小明",
    bookingReference: "TB-2026-ABC12345",
    tourTitle: "枫叶之旅",
    tourCode: "CA08",
    departureSelection: "2026年10月12日",
    adults: 2,
    children: 1,
    duration: "8天7晚",
    departureCity: "渥太华",
    meetingPlace: "中环旅游办公室",
    amountCents: 259900,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/maple-leaves",
  });

  assert.equal(result.subject, "付款已确认");
  for (const value of [
    "王小明",
    "TB-2026-ABC12345",
    "枫叶之旅",
    "CA08",
    "2026年10月12日",
    "2 位成人",
    "1 位儿童",
    "8天7晚",
    "渥太华",
    "中环旅游办公室",
    "CA$2,599.00",
  ]) {
    assertPresentInBoth(result, value);
  }
  assert.match(result.html, /查看行程/);
  assert.match(result.text, /查看行程/);
});

test("renders English labels and falls back to fixed English copy when CMS copy is absent", () => {
  const result = renderBookingConfirmationEmail({
    locale: "en",
    content: { ...content, confirmationEmailSubjectEn: "", confirmationEmailHeadingEn: "" },
    customerName: "Ada Lovelace",
    bookingReference: "TB-1",
    tourTitle: "Lake Louise",
    departureSelection: "July 11",
    adults: 1,
    children: 0,
    duration: "2 days",
    amountCents: 10000,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/lake",
  });

  assert.equal(result.subject, "Payment confirmed");
  assertPresentInBoth(result, "Your trip is confirmed!");
  assertPresentInBoth(result, "1 adult, 0 children");
});

test("omits empty optional booking rows from both formats", () => {
  const result = renderBookingConfirmationEmail({
    locale: "en",
    content,
    customerName: "Ada Lovelace",
    bookingReference: "TB-1",
    tourTitle: "Lake Louise",
    departureSelection: "July 11",
    adults: 2,
    children: 0,
    duration: "2 days",
    amountCents: 10000,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/lake",
  });

  for (const label of ["Tour code", "Departure city", "Meeting place"]) {
    assert.doesNotMatch(result.html, new RegExp(escapeRegExp(label)));
    assert.doesNotMatch(result.text, new RegExp(escapeRegExp(label)));
  }
});

test("escapes CMS, customer, tour, and URL values before producing HTML", () => {
  const result = renderBookingConfirmationEmail({
    locale: "en",
    content: {
      ...content,
      confirmationEmailHeadingEn: "<h1>Injected</h1>",
      confirmationEmailBodyEn: "Body & <script>alert(1)</script>\nNext line",
      confirmationEmailClosingEn: "Close\" ' >",
    },
    customerName: "Ada <Admin> & \"friend\"",
    bookingReference: "TB-<1>",
    tourTitle: "Lake & <Lodge>",
    tourCode: "A\" onmouseover=\"alert(1)",
    departureSelection: "July 11 & 12",
    adults: 1,
    children: 1,
    duration: "2 <days>",
    departureCity: "Ottawa > Toronto",
    meetingPlace: "Office 'A'",
    amountCents: 10000,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/lake?next=\" onmouseover=\"alert(1)\"&x=<tag>",
  });

  assert.doesNotMatch(result.html, /<script>/);
  assert.doesNotMatch(result.html, /<h1>Injected<\/h1>/);
  assert.doesNotMatch(result.html, /href="[^"]*" onmouseover=/);
  for (const value of [
    "Ada &lt;Admin&gt; &amp; &quot;friend&quot;",
    "TB-&lt;1&gt;",
    "Lake &amp; &lt;Lodge&gt;",
    "A&quot; onmouseover=&quot;alert(1)",
    "Body &amp; &lt;script&gt;alert(1)&lt;/script&gt;",
  ]) {
    assert.match(result.html, new RegExp(escapeRegExp(value)));
  }
  assert.match(result.html, /Body &amp; &lt;script&gt;alert\(1\)&lt;\/script&gt;<br>Next line/);
});

test("keeps the same booking facts in HTML and plain text", () => {
  const input = {
    locale: "en" as const,
    content,
    customerName: "Casey",
    bookingReference: "TB-42",
    tourTitle: "Northern Lights",
    tourCode: "NL-8",
    departureSelection: "November 8",
    adults: 3,
    children: 2,
    duration: "8 days",
    departureCity: "Ottawa",
    meetingPlace: "Union Station",
    amountCents: 12345,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/northern-lights",
  };
  const result = renderBookingConfirmationEmail(input);

  for (const value of [
    input.customerName,
    input.bookingReference,
    input.tourTitle,
    input.tourCode,
    input.departureSelection,
    "3 adults",
    "2 children",
    input.duration,
    input.departureCity,
    input.meetingPlace,
    "$123.45",
  ]) {
    assertPresentInBoth(result, value);
  }
  assert.match(result.html, /href="https:\/\/midearth\.ca\/tours\/northern-lights"/);
  assert.match(result.text, /https:\/\/midearth\.ca\/tours\/northern-lights/);
});

test("renders stable MidEarth Travel identity with restrained inline HTML branding", () => {
  const result = renderBookingConfirmationEmail({
    locale: "en",
    content,
    customerName: "Casey",
    bookingReference: "TB-42",
    tourTitle: "Northern Lights",
    departureSelection: "November 8",
    adults: 1,
    children: 0,
    duration: "8 days",
    amountCents: 12345,
    currency: "cad",
    tourUrl: "https://midearth.ca/tours/northern-lights",
  });

  assert.match(result.html, /MidEarth Travel/);
  assert.match(result.html, /<table[^>]*style="[^"]*background-color:/);
  assert.match(result.html, /font-family:/);
  assert.match(result.html, /border-collapse:/);
  assert.match(result.html, /role="presentation"/);
  assert.match(result.html, /<footer[^>]*>.*MidEarth Travel.*<\/footer>/s);
});

test("omits unsafe or malformed tour URLs from both formats", () => {
  for (const tourUrl of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "not a URL",
  ]) {
    const result = renderBookingConfirmationEmail({
      locale: "en",
      content,
      customerName: "Casey",
      bookingReference: "TB-42",
      tourTitle: "Northern Lights",
      departureSelection: "November 8",
      adults: 1,
      children: 0,
      duration: "8 days",
      amountCents: 12345,
      currency: "cad",
      tourUrl,
    });

    assert.doesNotMatch(result.html, /View tour/);
    assert.doesNotMatch(result.text, /View tour/);
    assert.doesNotMatch(result.html, new RegExp(escapeRegExp(tourUrl)));
    assert.doesNotMatch(result.text, new RegExp(escapeRegExp(tourUrl)));
  }
});
