import { HOME_MODULES } from "./content-rules.ts";
import type { HomeModuleId } from "../types/cms.ts";
import type { Workspace } from "./admin-state.ts";

export type SidebarChildItem = {
  id: HomeModuleId;
  label: string;
};

export type SidebarItem = {
  id: Workspace;
  label: string;
  eyebrow: string;
  children: SidebarChildItem[];
};

export type SidebarGroup = {
  label: "Content" | "System";
  items: SidebarItem[];
};

export function getSidebarNavigation(expandedWorkspace: Workspace | null): SidebarGroup[] {
  return [
    {
      label: "Content",
      items: [
        {
          id: "home",
          label: "Homepage Content",
          eyebrow: "Fixed page modules",
          children: expandedWorkspace === "home" ? getVisibleHomeModuleItems(expandedWorkspace) : [],
        },
        {
          id: "tours",
          label: "Tour Library",
          eyebrow: "Published tours",
          children: [],
        },
        {
          id: "bookings",
          label: "Bookings",
          eyebrow: "Customer requests",
          children: [],
        },
        {
          id: "payments",
          label: "Payments",
          eyebrow: "Transaction records",
          children: [],
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          id: "settings",
          label: "Global Settings",
          eyebrow: "Site basics",
          children: [],
        },
      ],
    },
  ];
}

export function getVisibleHomeModuleItems(expandedWorkspace: Workspace | null): SidebarChildItem[] {
  if (expandedWorkspace !== "home") {
    return [];
  }

  return HOME_MODULES.map((module) => ({
    id: module.id,
    label: module.name,
  }));
}
