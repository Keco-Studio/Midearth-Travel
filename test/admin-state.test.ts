import assert from "node:assert/strict";
import test from "node:test";
import {
  clearWorkspaceFocus,
  createInitialAdminState,
  getActiveModule,
  getWorkspaceTitle,
  openBooking,
  openPayment,
  saveDraft,
  selectHomeModule,
  selectWorkspace,
  toggleWorkspaceExpansion,
} from "../src/lib/admin-state.ts";

test("starts in the home workspace with hero selected", () => {
  const state = createInitialAdminState();

  assert.equal(state.workspace, "home");
  assert.equal(state.expandedWorkspace, "home");
  assert.equal(state.selectedHomeModuleId, "hero");
  assert.equal(getActiveModule(state).id, "hero");
});

test("updates workspace title when switching sections", () => {
  const state = selectWorkspace(createInitialAdminState(), "tours");

  assert.equal(state.workspace, "tours");
  assert.equal(state.expandedWorkspace, null);
  assert.equal(getWorkspaceTitle(state), "Tour Library");
});

test("clicking an expanded workspace again collapses its child items", () => {
  const state = createInitialAdminState();
  const nextState = toggleWorkspaceExpansion(state, "home");

  assert.equal(nextState.workspace, "home");
  assert.equal(nextState.expandedWorkspace, null);
});

test("clicking a collapsed workspace selects it and expands it only when it has children", () => {
  const closedState = toggleWorkspaceExpansion(createInitialAdminState(), "home");
  const reopenedState = toggleWorkspaceExpansion(closedState, "home");
  const toursState = toggleWorkspaceExpansion(reopenedState, "tours");

  assert.equal(reopenedState.workspace, "home");
  assert.equal(reopenedState.expandedWorkspace, "home");
  assert.equal(toursState.workspace, "tours");
  assert.equal(toursState.expandedWorkspace, null);
});

test("selects fixed homepage modules without changing registry order", () => {
  const state = selectHomeModule(createInitialAdminState(), "footer");

  assert.equal(state.selectedHomeModuleId, "footer");
  assert.equal(getActiveModule(state).id, "footer");
  assert.deepEqual(
    state.homeModules.map((module) => module.id),
    [
      "navbar",
      "hero",
      "toursSection",
      "categoryGrid",
      "exploreByMonth",
      "aboutSection",
      "testimonials",
      "finalCta",
      "newsletter",
      "footer",
    ],
  );
});

test("saving a draft marks the active module as draft and increments draft version", () => {
  const state = createInitialAdminState();
  const initialModule = getActiveModule(state);
  const nextState = saveDraft(state);
  const activeModule = getActiveModule(nextState);
  const expectedDraftVersion = (initialModule.draftVersion ?? initialModule.publishedVersion) + 1;

  assert.equal(activeModule.status, "draft");
  assert.equal(activeModule.draftVersion, expectedDraftVersion);
});

test("opens a booking workspace with focus for cross-navigation", () => {
  const state = openBooking(createInitialAdminState(), "bk_003");

  assert.equal(state.workspace, "bookings");
  assert.equal(state.focusBookingId, "bk_003");
  assert.equal(state.focusPaymentId, null);
});

test("opens a payment workspace with focus for cross-navigation", () => {
  const state = openPayment(createInitialAdminState(), "pay_001");

  assert.equal(state.workspace, "payments");
  assert.equal(state.focusPaymentId, "pay_001");
  assert.equal(state.focusBookingId, null);
});

test("clears workspace focus after navigation is handled", () => {
  const state = clearWorkspaceFocus(openBooking(createInitialAdminState(), "bk_001"));

  assert.equal(state.focusBookingId, null);
  assert.equal(state.focusPaymentId, null);
});
