export function getContactQuoteHref(tourTitle?: string, email?: string): string {
  const title = tourTitle?.trim();
  const params = new URLSearchParams(title ? { tour: title } : { quote: "1" });
  const normalizedEmail = email?.trim();
  if (normalizedEmail) params.set("email", normalizedEmail);
  return `/contact?${params.toString()}`;
}

export function getContactQuoteRequirements(tourTitle: string, lang: "en" | "zh"): string {
  const title = tourTitle.trim();
  return lang === "zh" ? `咨询报价：${title}` : `Quote request for: ${title}`;
}
