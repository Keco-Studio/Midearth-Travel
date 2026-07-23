import Link from "next/link";
import { site } from "@/data/site";
import { getStringContent, type ContentData } from "@/lib/content-values";

export function FinalCta({ content = {} }: { content?: ContentData }) {
  const image = getStringContent(content, "image", "/final-cta-travel-flatlay.jpg");
  const eyebrow = getStringContent(content, "eyebrow", "Get in touch");
  const title = getStringContent(content, "title", "Tell us where, we'll figure out how.");
  const description = getStringContent(
    content,
    "description",
    "Use the form, or call the office. Either reaches a real desk in downtown Ottawa.",
  );
  const primaryButtonText = getStringContent(content, "primaryButtonText", "Start a booking");
  const primaryButtonLink = getStringContent(content, "primaryButtonLink", `tel:${site.phoneTel}`);

  return (
    <section className="final-cta">
      <div className="container">
        <div className="final-cta-inner">
          <div className="final-cta-img">
            <img src={image} alt="" />
          </div>
          <div className="final-cta-body">
            <div className="eyebrow">— {eyebrow}</div>
            <h2 className="section-title">
              {title}
            </h2>
            <p>
              {description}
            </p>
            <div className="final-cta-actions">
              <Link href={primaryButtonLink}>
                <button type="button" className="btn btn-lg btn-primary">
                  {primaryButtonText}
                </button>
              </Link>
              <Link href="/#contact">
                <button type="button" className="btn btn-lg btn-ghost">
                  Send a message
                </button>
              </Link>
            </div>
            <div className="final-cta-meta">
              <div>
                <span className="muted">Phone</span>
                <br />
                {site.phone}
              </div>
              <div>
                <span className="muted">Email</span>
                <br />
                {site.email}
              </div>
              <div>
                <span className="muted">Office</span>
                <br />
                130 Albert St, Ottawa
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
