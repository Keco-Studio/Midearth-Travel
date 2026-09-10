"use client";

import { App, Select, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  FEATURED_TOUR_SLUGS_KEY,
  MAX_FEATURED_TOURS,
  parseFeaturedSlugs,
  serializeFeaturedSlugs,
} from "@/lib/featured-tours";
import type { ContentData } from "@/lib/content-values";
import type { ContentValue, TourRecord } from "@/types/cms";

type FeaturedToursPickerProps = {
  content: ContentData;
  onChange: (key: string, value: ContentValue) => void;
};

export function FeaturedToursPicker({
  content,
  onChange,
}: FeaturedToursPickerProps) {
  const { message } = App.useApp();
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const selected = parseFeaturedSlugs(content[FEATURED_TOUR_SLUGS_KEY]);

  useEffect(() => {
    let cancelled = false;

    async function loadTours() {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/tours");
        const payload = (await response.json()) as {
          tours?: TourRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load tours");
        }
        if (!cancelled) setTours(payload.tours ?? []);
      } catch (error) {
        if (!cancelled) {
          message.error(
            error instanceof Error ? error.message : "Unable to load tours",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTours();
    return () => {
      cancelled = true;
    };
  }, [message]);

  const options = useMemo(
    () =>
      tours
        .filter((tour) => tour.status === "published")
        .map((tour) => ({
          value: tour.slug,
          label: `${tour.title}${tour.specialOffer ? " · Top Pick flag" : ""}`,
        })),
    [tours],
  );

  return (
    <section className="cms-destination-name-editor" style={{ marginTop: 8 }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        Featured tours (max {MAX_FEATURED_TOURS})
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Choose up to {MAX_FEATURED_TOURS} published tours for the homepage Our Top
        Picks grid. Order is preserved. If empty, tours with the Special Offer
        toggle are shown instead.
      </Typography.Paragraph>
      <Select
        mode="multiple"
        allowClear
        loading={loading}
        style={{ width: "100%" }}
        placeholder="Select tours"
        value={selected}
        options={options}
        optionFilterProp="label"
        onChange={(values: string[]) => {
          if (values.length > MAX_FEATURED_TOURS) {
            message.warning(`You can feature at most ${MAX_FEATURED_TOURS} tours`);
            onChange(
              FEATURED_TOUR_SLUGS_KEY,
              serializeFeaturedSlugs(values.slice(0, MAX_FEATURED_TOURS)),
            );
            return;
          }
          onChange(FEATURED_TOUR_SLUGS_KEY, serializeFeaturedSlugs(values));
        }}
      />
    </section>
  );
}
