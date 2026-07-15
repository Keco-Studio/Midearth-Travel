import { HOME_MODULES } from "./content-rules.ts";
import type { HomeModuleId } from "../types/cms.ts";
import type { Workspace } from "./admin-state.ts";

export type LayoutRoute = {
  path: string;
  name: string;
  routes?: LayoutRoute[];
  moduleId?: HomeModuleId;
  moduleIndex?: number;
  workspace?: Workspace;
};

export const layoutRouteConfig: { routes: LayoutRoute[] } = {
  routes: [
    {
      path: "/content",
      name: "Content",
      routes: [
        {
          path: "/home",
          name: "Homepage Content",
          workspace: "home",
          routes: HOME_MODULES.map((module, index) => ({
            path: `/home/${module.id}`,
            name: module.name,
            moduleId: module.id,
            moduleIndex: index + 1,
            workspace: "home" as const,
          })),
        },
        {
          path: "/tours",
          name: "Tour Library",
          workspace: "tours",
        },
        {
          path: "/bookings",
          name: "Bookings",
          workspace: "bookings",
        },
        {
          path: "/payments",
          name: "Payments",
          workspace: "payments",
        },
      ],
    },
    {
      path: "/system",
      name: "System",
      routes: [
        {
          path: "/settings",
          name: "Global Settings",
          workspace: "settings",
        },
      ],
    },
  ],
};

export function getPathFromAdminState(
  workspace: Workspace,
  selectedHomeModuleId: HomeModuleId,
): string {
  if (workspace === "home") {
    return `/home/${selectedHomeModuleId}`;
  }

  return `/${workspace}`;
}

export function parseLayoutPath(pathname: string): {
  workspace: Workspace;
  moduleId?: HomeModuleId;
} {
  if (pathname.startsWith("/home/")) {
    const moduleId = pathname.replace("/home/", "") as HomeModuleId;
    return { workspace: "home", moduleId };
  }

  if (pathname === "/home") {
    return { workspace: "home", moduleId: "navbar" };
  }

  const workspace = pathname.replace("/", "") as Workspace;
  if (
    workspace === "tours" ||
    workspace === "bookings" ||
    workspace === "payments" ||
    workspace === "settings"
  ) {
    return { workspace };
  }

  return { workspace: "home", moduleId: "navbar" };
}
