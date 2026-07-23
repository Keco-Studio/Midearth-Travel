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
  return updateHomeModuleField(state, state.selectedHomeModuleId, key, value);
}

export function updateHomeModuleField(
  state: AdminState,
  moduleId: HomeModuleId,
  key: string,
  value: HomeModuleRecord["data"][string],
): AdminState {
  if (state.selectedHomeModuleId !== moduleId) {
    return state;
  }

  return {
    ...state,
    hasUnsavedChanges: true,
    homeModules: state.homeModules.map((module) =>
      module.id === moduleId
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

export function mergeLoadedHomeModules(
  state: AdminState,
  modules: HomeModuleRecord[],
): AdminState {
  const modulesById = new Map(modules.map((module) => [module.id, module]));

  return {
    ...state,
    homeModules: state.homeModules.map(
      (module) =>
        state.hasUnsavedChanges && module.id === state.selectedHomeModuleId
          ? module
          : modulesById.get(module.id) ?? module,
    ),
    hasUnsavedChanges: state.hasUnsavedChanges,
  };
}

export function replaceHomeModule(
  state: AdminState,
  module: HomeModuleRecord,
): AdminState {
  return {
    ...state,
    homeModules: state.homeModules.map((entry) =>
      entry.id === module.id ? module : entry,
    ),
    hasUnsavedChanges:
      state.selectedHomeModuleId === module.id ? false : state.hasUnsavedChanges,
  };
}

export function applyPersistedHomeModule(
  state: AdminState,
  persistedModule: HomeModuleRecord,
  submittedData: HomeModuleRecord["data"],
): AdminState {
  const currentModule = state.homeModules.find(
    (entry) => entry.id === persistedModule.id,
  );
  const hasNewerEdits = Boolean(
    currentModule &&
      state.hasUnsavedChanges &&
      !isContentDataEqual(currentModule.data, submittedData),
  );

  if (!hasNewerEdits) {
    return replaceHomeModule(state, persistedModule);
  }

  return {
    ...state,
    homeModules: state.homeModules.map((entry) =>
      entry.id === persistedModule.id
        ? { ...persistedModule, data: currentModule?.data ?? persistedModule.data }
        : entry,
    ),
    hasUnsavedChanges: true,
  };
}

function isContentDataEqual(
  left: HomeModuleRecord["data"],
  right: HomeModuleRecord["data"],
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => left[key] === right[key])
  );
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
