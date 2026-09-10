import Image from "next/image";
import { site } from "@/data/site";

type BrandLogoProps = {
  /** Use logo2 on solid/beige header backgrounds */
  solid?: boolean;
  alt?: string;
  /** Optional CMS logo for transparent header */
  src?: string;
  /** Optional CMS logo for solid header */
  solidSrc?: string;
};

export function BrandLogo({ solid = false, alt, src, solidSrc }: BrandLogoProps) {
  const resolvedSrc = solid
    ? solidSrc?.trim() || "/logo2.png"
    : src?.trim() || "/logo.png";

  return (
    <Image
      src={resolvedSrc}
      alt={alt ?? `${site.name} ${site.tagline}`}
      width={373}
      height={110}
      className="brand-logo"
      priority
      unoptimized
    />
  );
}
