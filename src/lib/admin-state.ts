import { homeModuleSeeds } from "../data/cms-seed.ts";
import type { HomeModuleId, HomeModuleRecord } from "../types/cms.ts";

export type Workspace = "home" | "tours" | "bookings" | "payments" | "settings";

export type AdminState = {
  workspace: Workspace;
  expandedWorkspace: Workspace | null;
  selectedHomeModuleId: HomeModuleId;
  homeModules: HomeModuleRecord[];
  hasUnsavedChanges: boolean;
  focusBookingId: string | null;
  focusPaymentId: string | null;
};

const workspaceTitles: Record<Workspace, string> = {
  home: "Homepage Content",
  tours: "Tour Library",
  bookings: "Bookings",
  payments: "Payments",
  settings: "Global Settings",
};

const expandableWorkspaces = new Set<Workspace>(["home"]);

export function createInitialAdminState(): AdminState {
  return {
    workspace: "home",
    expandedWorkspace: "home",
    selectedHomeModuleId: "hero",
    homeModules: homeModuleSeeds,
    hasUnsavedChanges: false,
    focusBookingId: null,
    focusPaymentId: null,
  };
}

export function getWorkspaceTitle(state: Pick<AdminState, "workspace">): string {
  return workspaceTitles[state.workspace];
}

export function getActiveModule(state: AdminState): HomeModuleRecord {
  const activeModule = state.homeModules.find((item) => item.id === state.selectedHomeModuleId);

  if (!activeModule) {
    throw new Error(`Selected homepage module does not exist: ${state.selectedHomeModuleId}`);
  }

  return activeModule;
}

export function selectWorkspace(state: AdminState, workspace: Workspace): AdminState {
  return {
    ...state,
    workspace,
    expandedWorkspace: expandableWorkspaces.has(workspace) ? workspace : null,
    focusBookingId: workspace === "bookings" ? state.focusBookingId : null,
    focusPaymentId: workspace === "payments" ? state.focusPaymentId : null,
  };
}

export function openBooking(state: AdminState, bookingId: string): AdminState {
  return {
    ...selectWorkspace(state, "bookings"),
    focusBookingId: bookingId,
    focusPaymentId: null,
  };
}

export function openPayment(state: AdminState, paymentId: string): AdminState {
  return {
    ...selectWorkspace(state, "payments"),
    focusPaymentId: paymentId,
    focusBookingId: null,
  };
}

export function clearWorkspaceFocus(state: AdminState): AdminState {
  return {
    ...state,
    focusBookingId: null,
    focusPaymentId: null,
  };
}

export function toggleWorkspaceExpansion(state: AdminState, workspace: Workspace): AdminState {
  const canExpand = expandableWorkspaces.has(workspace);

  if (!canExpand) {
    return {
      ...state,
      workspace,
      expandedWorkspace: null,
    };
  }

  return {
    ...state,
    workspace,
    expandedWorkspace: state.expandedWorkspace === workspace ? null : workspace,
  };
}

export function selectHomeModule(state: AdminState, moduleId: HomeModuleId): AdminState {
  return {
    ...state,
    workspace: "home",
    expandedWorkspace: "home",
    selectedHomeModuleId: moduleId,
  };
}

export function updateActiveModuleField(
  state: AdminState,
  key: string,
  value: HomeModuleRecord["data"][string],
): AdminState {
  return {
    ...state,
    hasUnsavedChanges: true,
    homeModules: state.homeModules.map((module) =>
      module.id === state.selectedHomeModuleId
        ? {
            ...module,
            data: {
              ...module.data,
              [key]: value,
            },
          }
        : module,
    ),
  };
}

export function saveDraft(state: AdminState): AdminState {
  return {
    ...state,
    hasUnsavedChanges: false,
    homeModules: state.homeModules.map((module) =>
      module.id === state.selectedHomeModuleId
        ? {
            ...module,
            status: "draft",
            draftVersion: (module.draftVersion ?? module.publishedVersion) + 1,
          }
        : module,
    ),
  };
}
