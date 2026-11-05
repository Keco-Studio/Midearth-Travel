import type { Tour } from "../data/tours.ts";
import {
  mergeHomeModuleRows,
  type HomeModuleRow,
} from "./home-content.ts";
import {
  mapTourRecordToPublicTour,
  mergeTourRows,
  type TourRow,
} from "./tour-content.ts";
import type { HomeModuleRecord } from "../types/cms.ts";

export type PublishedContentRequest = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;

export async function loadPublishedHomeModulesStrictWithRequest(
  request: PublishedContentRequest,
): Promise<HomeModuleRecord[]> {
  let rows: HomeModuleRow[];
  try {
    rows = await request<HomeModuleRow[]>(
      "/rest/v1/home_modules?select=*&order=module_index.asc",
    );
  } catch (error) {
    throw new Error("Unable to load published homepage content", { cause: error });
  }
  return mergeHomeModuleRows(rows, "published");
}

export async function loadPublishedToursStrictWithRequest(
  request: PublishedContentRequest,
): Promise<Tour[]> {
  let rows: TourRow[];
  try {
    rows = await request<TourRow[]>("/rest/v1/tours?select=*");
  } catch (error) {
    throw new Error("Unable to load published tours", { cause: error });
  }
  return mergeTourRows(rows)
    .filter((record) => record.status === "published")
    .map(mapTourRecordToPublicTour);
}
