import "server-only";

import { services, type Service } from "@/data/services";
import { testimonials, type Testimonial } from "@/data/testimonials";
import {
  mergeServiceRows,
  mergeTestimonialRows,
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
    return services;
  }
}

export async function saveHomepageServices(input: Service[]): Promise<Service[]> {
  const byId = new Map(input.map((service) => [service.id, service]));
  const canonical = services.map((seed) => {
    const value = byId.get(seed.id);
    if (!value) throw new Error(`Missing service: ${seed.id}`);
    const title = value.title.trim();
    const summary = value.summary.trim();
    const slug = value.slug.trim().toLocaleLowerCase("en");
    const image = value.image.trim();

    if (!title || !summary || !slug || !image) {
      throw new Error("Service title, summary, image, and slug are required");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error("Service slug must use lowercase letters, numbers, and hyphens");
    }
    if (title.length > 80 || summary.length > 180) {
      throw new Error("Service title or summary is too long");
    }

    return { id: seed.id, title, summary, slug, image };
  });

  await upsert("homepage_services", canonical.map(serviceToRow));
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
  const byId = new Map(input.map((testimonial) => [testimonial.id, testimonial]));
  const canonical = testimonials.map((seed) => {
    const value = byId.get(seed.id);
    if (!value) throw new Error(`Missing testimonial: ${seed.id}`);
    const name = value.name.trim();
    const source = value.source.trim();
    const text = value.text.trim();
    const rating = Math.min(5, Math.max(1, Math.round(value.rating)));

    if (!name || !source || !text) {
      throw new Error("Reviewer name, source, and review text are required");
    }
    if (name.length > 80 || source.length > 80 || text.length > 1000) {
      throw new Error("Testimonial content is too long");
    }

    return { id: seed.id, name, source, rating, text };
  });

  await upsert("homepage_testimonials", canonical.map(testimonialToRow));
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
  const ids = new Set(rows.map((row) => row.id));
  const missing = services.filter((service) => !ids.has(service.id)).map(serviceToRow);
  if (missing.length > 0) {
    await upsert("homepage_services", missing);
    return list<ServiceRow>("homepage_services");
  }
  return rows;
}

async function ensureTestimonials(): Promise<TestimonialRow[]> {
  const rows = await list<TestimonialRow>("homepage_testimonials");
  const ids = new Set(rows.map((row) => row.id));
  const missing = testimonials
    .filter((testimonial) => !ids.has(testimonial.id))
    .map(testimonialToRow);
  if (missing.length > 0) {
    await upsert("homepage_testimonials", missing);
    return list<TestimonialRow>("homepage_testimonials");
  }
  return rows;
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
  return response.json() as Promise<T>;
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
