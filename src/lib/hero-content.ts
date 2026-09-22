import {
  heroBroadcastSeeds,
  heroFeatureCardSeeds,
  type HeroCardIconName,
} from "../data/hero-content.ts";
import { getStringContent, type ContentData } from "./content-values.ts";
import { getLocalizedContent } from "./localized-content.ts";
import type { Lang } from "../context/lang-context.tsx";

export type HeroFeatureCardContent = {
  id: string;
  fallbackIcon: HeroCardIconName;
  iconImage: string;
  title: string;
  description: string;
  href: string;
};

export function getHeroBroadcastContent(content: ContentData, lang: Lang = "en"): {
  label: string;
  messages: string[];
} {
  const label = getLocalizedContent(content, "liveLabel", lang, "Live").trim() || "Live";
  const messages = getLocalizedContent(
    content,
    "liveMessages",
    lang,
    heroBroadcastSeeds.join("\n"),
  )
    .split(/\r?\n/)
    .map((message) => message.trim())
    .filter(Boolean);

  return {
    label,
    messages: messages.length > 0 ? messages : heroBroadcastSeeds,
  };
}

export function getHeroFeatureCards(
  content: ContentData,
  lang: Lang = "en",
): HeroFeatureCardContent[] {
  return heroFeatureCardSeeds.map((seed, index) => {
    const number = index + 1;

    return {
      id: `hero-card-${number}`,
      fallbackIcon: seed.icon,
      iconImage:
        getStringContent(content, `card${number}IconImage`, seed.iconImage).trim() ||
        seed.iconImage,
      title: getLocalizedContent(content, `card${number}Title`, lang, seed.title),
      description: getLocalizedContent(
        content,
        `card${number}Description`,
        lang,
        seed.description,
      ),
      href: seed.href,
    };
  });
}
