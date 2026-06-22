import Image from "next/image";
import Link from "next/link";
import {
  getTourCategoryLabel,
  getTourDisplayPrice,
  type Tour,
} from "@/data/tours";

export function TourCard({ tour }: { tour: Tour }) {
  const price = getTourDisplayPrice(tour);
  const priceFrom = price.startsWith("from ");

  return (
    <article className="tour-card">
      <Link className="tour-card-img-btn" href={`/tours/${tour.slug}`}>
        <Image
          src={tour.image}
          alt={tour.title}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
        {tour.code ? <div className="tour-card-code">{tour.code}</div> : null}
        <div className="tour-card-region">{tour.region}</div>
      </Link>
      <div className="tour-card-body">
        <div className="tour-card-meta">
          <span>{getTourCategoryLabel(tour)}</span>
          <span className="dot">·</span>
          <span>{tour.duration}</span>
        </div>
        <h3 className="tour-card-title">
          <Link href={`/tours/${tour.slug}`}>{tour.title}</Link>
        </h3>
        <div className="tour-card-highlights">
          {(tour.highlights ?? tour.tags).slice(0, 4).map((h) => (
            <span key={h} className="chip">
              {h}
            </span>
          ))}
        </div>
        <div className="tour-card-foot">
          <div className="tour-card-price">
            {priceFrom ? (
              <>
                <span className="price-label">from</span>
                <span className="price-amt">{price.replace("from ", "")}</span>
              </>
            ) : (
              <span className="price-contact">{price}</span>
            )}
          </div>
          <Link className="link-arrow sm" href={`/tours/${tour.slug}`}>
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}
