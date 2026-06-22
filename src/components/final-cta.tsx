import Link from "next/link";
import { site } from "@/data/site";

export function FinalCta() {
  return (
    <section className="final-cta">
      <div className="container">
        <div className="final-cta-inner">
          <div className="final-cta-img">
            <img src="/final-cta-travel-flatlay.jpg" alt="" />
          </div>
          <div className="final-cta-body">
            <div className="eyebrow">— Get in touch</div>
            <h2 className="section-title">
              Tell us where, we&apos;ll figure out how.
            </h2>
            <p>
              Use the form, or call the office. Either reaches a real desk in
              downtown Ottawa.
            </p>
            <div className="final-cta-actions">
              <Link href={`tel:${site.phoneTel}`}>
                <button type="button" className="btn btn-lg btn-primary">
                  Start a booking
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
