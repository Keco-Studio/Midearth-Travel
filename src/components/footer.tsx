import { Globe, Mail, Share2 } from "lucide-react";

const tourLinks = [
  "Canadian Tours",
  "USA Tours",
  "European Tours",
  "Asian Tours",
  "Sun Destinations",
];

const serviceLinks = [
  "Flights",
  "Hotels",
  "Travel Insurance",
  "VISA Application",
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-white/10 bg-[#1A1A17] text-[#f5efe3]">
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16 lg:px-8">
        <div className="mb-8 grid gap-8 md:mb-12 md:grid-cols-2 md:gap-12 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-[#f5efe3]">Midearth Travel</h3>
            <p className="text-sm leading-relaxed text-[#f5efe3]/65">
              Your one-stop travel solution. TICO certified member serving the
              community with professionalism and competitive prices.
            </p>
            <div className="flex gap-4">
              {[Globe, Share2, Mail, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-[#f5efe3]/50 transition-colors hover:text-[#f5efe3]"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[#f5efe3]">Tours</h4>
            <ul className="space-y-3 text-sm text-[#f5efe3]/65">
              {tourLinks.map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-[#f5efe3]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[#f5efe3]">Services</h4>
            <ul className="space-y-3 text-sm text-[#f5efe3]/65">
              {serviceLinks.map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-[#f5efe3]">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-[#f5efe3]">Contact Us</h4>
            <ul className="space-y-3 text-sm text-[#f5efe3]/65">
              <li>
                <a href="tel:6132365226" className="transition-colors hover:text-[#f5efe3]">
                  613-236-5226
                </a>
              </li>
              <li>
                <a href="tel:6132362323" className="transition-colors hover:text-[#f5efe3]">
                  613-236-2323
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@midearth.ca"
                  className="transition-colors hover:text-[#f5efe3]"
                >
                  info@midearth.ca
                </a>
              </li>
              <li>
                <span>Bronson Avenue</span>
              </li>
              <li>
                <span>Ottawa, Ontario</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-[#f5efe3]/50">
          <p>© 2026 Midearth Travel Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
