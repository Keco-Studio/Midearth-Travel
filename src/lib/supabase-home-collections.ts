import "server-only";

import {
  MAX_HOMEPAGE_SERVICES,
  services,
  type Service,
} from "@/data/services";
import { testimonials, type Testimonial } from "@/data/testimonials";
import {
  MAX_HOMEPAGE_TESTIMONIALS,
  mergeServiceRows,
  mergeTestimonialRows,
  normalizePageFields,
  serviceToRow,
  testimonialToRow,
  type ServiceRow,
  type TestimonialRow,
} from "@/lib/home-collections";
import { createStorageObjectPath } from "@/lib/inline-image-upload";

export async function loadHomepageServices(): Promise<Service[]> {
  try {
    const rows = await ensureServices();
    return mergeServiceRows(rows);
  } catch (error) {
    console.error("Unable to load homepage services", error);
    return services.map((service) => ({
      ...service,
      page: normalizePageFields(service.page, service.page, service.title),
    }));
  }
}

export async function saveHomepageServices(input: Service[]): Promise<Service[]> {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("At least one service card is required");
  }
  if (input.length > MAX_HOMEPAGE_SERVICES) {
    throw new Error(`You can publish at most ${MAX_HOMEPAGE_SERVICES} service cards`);
  }

  const seenSlugs = new Set<string>();
  const canonical = input.map((value, index) => {
    const id = value.id?.trim();
    const title = value.title?.trim() ?? "";
    const summary = value.summary?.trim() ?? "";
    const slug = (value.slug?.trim() ?? "").toLocaleLowerCase("en");
    const image = value.image?.trim() ?? "";
    const page = normalizePageFields(value.page, undefined, title);

    if (!id) throw new Error(`Service #${index + 1} is missing an id`);
    if (!title || !summary || !slug || !image) {
      throw new Error("Service title, summary, image, and slug are required");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error("Service slug must use lowercase letters, numbers, and hyphens");
    }
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate service slug: ${slug}`);
    }
    seenSlugs.add(slug);
    if (title.length > 80 || summary.length > 180) {
      throw new Error("Service title or summary is too long");
    }
    if (page.title.length > 120 || page.intro.length > 4000) {
      throw new Error("Service page title or intro is too long");
    }
    if (page.disclaimer.length > 500 || page.signOff.length > 80) {
      throw new Error("Service page disclaimer or sign-off is too long");
    }
    if (page.deals.length > 20) {
      throw new Error("A service page can have at most 20 fare rows");
    }

    return {
      id,
      title,
      summary,
      slug,
      image,
      page: {
        ...page,
        title: page.title.trim() || title.toUpperCase(),
        intro: page.intro.trim(),
        signOff: page.signOff.trim() || "Thanks",
        disclaimer: page.disclaimer.trim(),
        quoteLabel: page.quoteLabel.trim() || title,
        metaTitle: page.metaTitle.trim() || `${title} | Midearth Travel`,
        metaDescription: page.metaDescription.trim(),
        deals: page.deals
          .map((deal, dealIndex) => ({
            id: deal.id.trim() || `deal-${dealIndex + 1}`,
            route: deal.route.trim(),
            priceLabel: deal.priceLabel.trim(),
          }))
          .filter((deal) => deal.route || deal.priceLabel),
      },
    } satisfies Service;
  });

  await replaceHomepageServices(canonical.map(serviceToRow));
  return mergeServiceRows(await list<ServiceRow>("homepage_services"));
}

export async function loadHomepageTestimonials(): Promise<Testimonial[]> {
  try {
    const rows = await ensureTestimonials();
    return mergeTestimonialRows(rows);
  } catch (error) {
    console.error("Unable to load homepage testimonials", error);
    return testimonials;
  }
}

export async function saveHomepageTestimonials(
  input: Testimonial[],
): Promise<Testimonial[]> {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error("At least one review is required");
  }
  if (input.length > MAX_HOMEPAGE_TESTIMONIALS) {
    throw new Error(`You can publish at most ${MAX_HOMEPAGE_TESTIMONIALS} reviews`);
  }

  const canonical = input.map((value, index) => {
    const id = value.id?.trim();
    const name = value.name?.trim() ?? "";
    const source = value.source?.trim() ?? "";
    const text = value.text?.trim() ?? "";
    const rating = Math.min(5, Math.max(1, Math.round(value.rating)));

    if (!id) throw new Error(`Review #${index + 1} is missing an id`);
    if (!name || !source || !text) {
      throw new Error("Reviewer name, source, and review text are required");
    }
    if (name.length > 80 || source.length > 80 || text.length > 1000) {
      throw new Error("Testimonial content is too long");
    }

    return { id, name, source, rating, text };
  });

  await upsert("homepage_testimonials", canonical.map(testimonialToRow));
  const keepIds = canonical.map((entry) => entry.id);
  if (keepIds.length > 0) {
    const encoded = keepIds.map(encodeURIComponent).join(",");
    await request<unknown[]>(
      `/rest/v1/homepage_testimonials?id=not.in.(${encoded})`,
      { method: "DELETE" },
    );
  }
  return mergeTestimonialRows(await list<TestimonialRow>("homepage_testimonials"));
}

export async function uploadServiceImage(id: string, file: File): Promise<string> {
  const { url, key } = getConfig();
  const path = createStorageObjectPath("services", id, file.name);
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${url}/storage/v1/object/homepage-media/${encodedPath}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file,
    cache: "no-store",
  });

  if (!response.ok) throw new Error((await response.text()) || "Service image upload failed");
  return `${url}/storage/v1/object/public/homepage-media/${encodedPath}`;
}

async function ensureServices(): Promise<ServiceRow[]> {
  const rows = await list<ServiceRow>("homepage_services");
  if (rows.length === 0) {
    await upsert(
      "homepage_services",
      services.map((service, index) => serviceToRow(service, index)),
    );
    return list<ServiceRow>("homepage_services");
  }

  const needsPageBackfill = rows.some(
    (row) =>
      !row.page_content ||
      (typeof row.page_content === "object" &&
        !Array.isArray(row.page_content) &&
        Object.keys(row.page_content as object).length === 0),
  );
  if (needsPageBackfill) {
    const seedsById = new Map(services.map((seed) => [seed.id, seed]));
    const patched = rows.map((row, index) => {
      const seed = seedsById.get(row.id);
      return serviceToRow(
        {
          id: row.id,
          slug: row.slug,
          title: row.title,
          summary: row.summary,
          image: row.image,
          page: normalizePageFields(row.page_content, seed?.page, row.title),
        },
        index,
      );
    });
    await upsert("homepage_services", patched);
    return list<ServiceRow>("homepage_services");
  }

  return rows;
}

async function ensureTestimonials(): Promise<TestimonialRow[]> {
  const rows = await list<TestimonialRow>("homepage_testimonials");
  if (rows.length === 0) {
    await upsert("homepage_testimonials", testimonials.map(testimonialToRow));
    return list<TestimonialRow>("homepage_testimonials");
  }
  return rows;
}

async function replaceHomepageServices(rows: ServiceRow[]): Promise<void> {
  await upsert("homepage_services", rows);
  const keepIds = rows.map((row) => row.id);
  if (keepIds.length === 0) return;

  const encoded = keepIds.map(encodeURIComponent).join(",");
  await request<unknown[]>(
    `/rest/v1/homepage_services?id=not.in.(${encoded})`,
    { method: "DELETE" },
  );
}

async function list<T>(table: string): Promise<T[]> {
  return request<T[]>(`/rest/v1/${table}?select=*&order=sort_order.asc`);
}

async function upsert(table: string, rows: unknown[]): Promise<void> {
  await request<unknown[]>(`/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = getConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...init.headers },
    cache: "no-store",
  });
  if (!response.ok) throw new Error((await response.text()) || "Supabase request failed");
  if (response.status === 204) return [] as T;
  const text = await response.text();
  if (!text) return [] as T;
  return JSON.parse(text) as T;
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !key) throw new Error("Supabase is not configured");
  return { url, key };
}
