import Image from "next/image";
import { site } from "@/data/site";

export function BrandLogo() {
  return (
    <Image
      src="/logo.png"
      alt={`${site.name} ${site.tagline}`}
      width={373}
      height={110}
      className="brand-logo"
      priority
    />
  );
}
