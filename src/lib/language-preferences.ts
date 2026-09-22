export type LanguagePreference = "en" | "zh";

const LANGUAGE_COOKIE_NAME = "midearth-lang";
const LANGUAGE_COOKIE_MAX_AGE = 31_536_000;

export function serializeLanguageCookie(lang: LanguagePreference): string {
  return `${LANGUAGE_COOKIE_NAME}=${lang}; Path=/; Max-Age=${LANGUAGE_COOKIE_MAX_AGE}; SameSite=Lax`;
}
