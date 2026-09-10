import {
  heroBroadcastSeeds,
  heroFeatureCardSeeds,
  type HeroCardIconName,
} from "../data/hero-content.ts";
import { getStringContent, type ContentData } from "./content-values.ts";

export type HeroFeatureCardContent = {
  id: string;
  fallbackIcon: HeroCardIconName;
  iconImage: string;
  title: string;
  description: string;
  href: string;
};

export function getHeroBroadcastContent(content: ContentData): {
  label: string;
  messages: string[];
} {
  const label = getStringContent(content, "liveLabel", "Live").trim() || "Live";
  const messages = getStringContent(
    content,
    "liveMessages",
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
): HeroFeatureCardContent[] {
  return heroFeatureCardSeeds.map((seed, index) => {
    const number = index + 1;

    return {
      id: `hero-card-${number}`,
      fallbackIcon: seed.icon,
      iconImage: getStringContent(
        content,
        `card${number}IconImage`,
        seed.iconImage,
      ),
      title: getStringContent(content, `card${number}Title`, seed.title),
      description: getStringContent(
        content,
        `card${number}Description`,
        seed.description,
      ),
      href: getStringContent(content, `card${number}Link`, seed.href),
    };
  });
}
