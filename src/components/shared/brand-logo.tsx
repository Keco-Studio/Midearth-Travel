import Image from "next/image";
import { site } from "@/data/site";

type BrandLogoProps = {
  /** Use logo2 on solid/beige header backgrounds */
  solid?: boolean;
};

export function BrandLogo({ solid = false }: BrandLogoProps) {
  const src = solid ? "/logo2.png" : "/logo.png";

  return (
    <Image
      src={src}
      alt={`${site.name} ${site.tagline}`}
      width={373}
      height={110}
      className="brand-logo"
      priority
      unoptimized
    />
  );
}
