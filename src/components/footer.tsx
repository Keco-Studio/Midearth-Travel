import { Globe, Mail, Share2 } from "lucide-react";

const tourLinks = [
  "Canadian Tours",
  "USA Tours",
  "European Tours",
  "Asian Tours",
  "Sun Destinations",
];

const serviceLinks = [
  "Bus Tours",
  "Flights",
  "Hotels",
  "Travel Insurance",
  "VISA Application",
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-[#e8e2d4] bg-[#fdfaf4]">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16 lg:px-8">
        <div className="mb-8 grid gap-8 md:mb-12 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Midearth Travel</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ottawa&apos;s premier travel agency. TICO certified member serving
              the community with professionalism and competitive prices.
            </p>
            <div className="flex gap-4">
              {[Globe, Share2, Mail, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Tours</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {tourLinks.map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-foreground">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Services</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {serviceLinks.map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-foreground">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Contact Us</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><span>613-236-5226</span></li>
              <li><span>613-236-2323</span></li>
              <li>
                <a
                  href="mailto:info@midearth.ca"
                  className="transition-colors hover:text-foreground"
                >
                  info@midearth.ca
                </a>
              </li>
              <li><span>Bronson Avenue</span></li>
              <li><span>Ottawa, Ontario</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Midearth Travel Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
