"use client";

import { PageContainer, ProLayout } from "@ant-design/pro-components";
import { App, Button, Space, Tag, Tooltip } from "antd";
import Link from "next/link";
import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { BookingsWorkspace } from "@/components/bookings-workspace";
import { HomeModuleEditor } from "@/components/home-module-editor";
import { PaymentsWorkspace } from "@/components/payments-workspace";
import { SettingsPanel } from "@/components/settings-panel";
import { HomeModuleMenuItem, MenuBrandHeader, menuBrandMarkStyle } from "@/components/cms-menu-items";
import { StatusTag } from "@/components/status-tag";
import { ToursWorkspace } from "@/components/tours-workspace";
import { bookingSeeds, paymentSeeds, settingsSeed, tourSeeds } from "@/data/cms-seed";
import type { Service } from "@/data/services";
import type { Testimonial } from "@/data/testimonials";
import {
  applyPersistedHomeModule,
  clearWorkspaceFocus,
  createInitialAdminState,
  getActiveModule,
  getWorkspaceTitle,
  openBooking,
  openPayment,
  mergeLoadedHomeModules,
  selectHomeModule,
  selectWorkspace,
  updateHomeModuleField,
  type AdminState,
} from "@/lib/admin-state";
import {
  getPathFromAdminState,
  layoutRouteConfig,
  parseLayoutPath,
} from "@/lib/layout-routes";
import type { DestinationCategory } from "@/lib/destination-categories";
import { proLayoutToken } from "@/theme/mid-earth-theme";
import type { HomeModuleId, HomeModuleRecord } from "@/types/cms";

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

type AdminShellProps = {
  initialHomeModules: HomeModuleRecord[];
  initialDestinationCategories: DestinationCategory[];
  initialServices: Service[];
  initialTestimonials: Testimonial[];
};

export function AdminShell({
  initialHomeModules,
  initialDestinationCategories,
  initialServices,
  initialTestimonials,
}: AdminShellProps) {
  const { message } = App.useApp();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [state, setState] = useState<AdminState>(() =>
    mergeLoadedHomeModules(createInitialAdminState(), initialHomeModules),
  );
  const [pendingAction, setPendingAction] = useState<"save" | "publish" | null>(null);
  const [destinationCategories, setDestinationCategories] = useState(
    initialDestinationCategories,
  );
  const [services, setServices] = useState(initialServices);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [supplementalDirtyModuleIds, setSupplementalDirtyModuleIds] = useState<
    HomeModuleId[]
  >([]);
  const activeModule = getActiveModule(state);
  const hasSupplementalUnsavedChanges =
    supplementalDirtyModuleIds.includes(activeModule.id);
  const pathname = getPathFromAdminState(state.workspace, state.selectedHomeModuleId);
  const pageTitle =
    state.workspace === "home" ? activeModule.name : getWorkspaceTitle(state);
  const pageSubTitle =
    state.workspace === "home" ? "Fixed homepage module" : undefined;

  const [openKeys, setOpenKeys] = useState<string[]>(["/home"]);

  const homeModuleStatusMap = useMemo(
    () => new Map(state.homeModules.map((module) => [module.id, module.status])),
    [state.homeModules],
  );

  const handleSupplementalDirtyChange = useCallback(
    (moduleId: HomeModuleId, dirty: boolean) => {
      setSupplementalDirtyModuleIds((current) => {
        if (dirty) {
          return current.includes(moduleId) ? current : [...current, moduleId];
        }

        return current.filter((id) => id !== moduleId);
      });
    },
    [],
  );

  function handleMenuClick(path: string) {
    const parsed = parseLayoutPath(path);
    if (parsed.workspace === "home" && parsed.moduleId) {
      setOpenKeys((keys) => (keys.includes("/home") ? keys : [...keys, "/home"]));
      setState((current) => selectHomeModule(current, parsed.moduleId as HomeModuleId));
      return;
    }

    if (parsed.workspace === "home") {
      setOpenKeys((keys) => (keys.includes("/home") ? keys : [...keys, "/home"]));
    }

    setState((current) => selectWorkspace(current, parsed.workspace));
  }

  async function handleSaveDraft() {
    const submittedData = activeModule.data;
    setPendingAction("save");

    try {
      if (hasSupplementalUnsavedChanges) {
        await saveSupplementalHomeData(activeModule.id);
      }

      const response = await fetch(`/api/admin/home-modules/${activeModule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", module: activeModule }),
      });
      const payload = await readApiResponse<{ module: HomeModuleRecord }>(response);
      setState((current) =>
        applyPersistedHomeModule(current, payload.module, submittedData),
      );
      message.success("Draft saved to Supabase");
    } catch (error) {
      message.error(getErrorMessage(error, "Draft could not be saved"));
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePublish() {
    const submittedData = activeModule.data;
    setPendingAction("publish");

    try {
      const response = await fetch(`/api/admin/home-modules/${activeModule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });
      const payload = await readApiResponse<{ module: HomeModuleRecord }>(response);
      setState((current) =>
        applyPersistedHomeModule(current, payload.module, submittedData),
      );
      message.success("Module published to the homepage");
    } catch (error) {
      message.error(getErrorMessage(error, "Module could not be published"));
    } finally {
      setPendingAction(null);
    }
  }

  async function saveSupplementalHomeData(moduleId: HomeModuleId) {
    if (moduleId === "categoryGrid") {
      const response = await fetch("/api/admin/destination-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: destinationCategories.map(({ id, titleEn, titleZh }) => ({
            id,
            titleEn,
            titleZh,
          })),
        }),
      });
      const payload = await readApiResponse<{
        categories: DestinationCategory[];
      }>(response);
      setDestinationCategories(payload.categories);
    }

    if (moduleId === "aboutSection") {
      const response = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });
      const payload = await readApiResponse<{ services: Service[] }>(response);
      setServices(payload.services);
    }

    if (moduleId === "testimonials") {
      const response = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonials }),
      });
      const payload = await readApiResponse<{
        testimonials: Testimonial[];
      }>(response);
      setTestimonials(payload.testimonials);
    }

    handleSupplementalDirtyChange(moduleId, false);
  }

  async function handleImageUpload(
    moduleId: HomeModuleId,
    fieldKey: string,
    file: File,
  ): Promise<string> {
    const formData = new FormData();
    formData.set("moduleId", moduleId);
    formData.set("fieldKey", fieldKey);
    formData.set("file", file);

    const response = await fetch("/api/admin/home-modules/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await readApiResponse<{ url: string }>(response);
    return payload.url;
  }

  function handlePreviewDraft() {
    message.info("Preview draft opened");
  }

  if (!mounted) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading CMS workspace"
        style={{ minHeight: "100vh", background: "#f4f1ea" }}
      />
    );
  }

  return (
    <ProLayout
      title="Midearth CMS"
      navTheme="light"
      theme="dark"
      logo={<div style={menuBrandMarkStyle}>MT</div>}
      layout="side"
      fixSiderbar
      fixedHeader
      siderWidth={256}
      route={layoutRouteConfig}
      location={{ pathname }}
      menu={{
        type: "group",
        defaultOpenAll: false,
      }}
      menuProps={{
        theme: "dark",
        openKeys,
        onOpenChange: (keys) => setOpenKeys(keys),
        onClick: ({ key }) => handleMenuClick(String(key)),
      }}
      menuItemRender={(item, dom) => {
        const moduleMatch = item.path?.match(/^\/home\/(.+)$/);
        const moduleId = moduleMatch?.[1] as HomeModuleId | undefined;
        const moduleIndex = moduleId
          ? state.homeModules.findIndex((entry) => entry.id === moduleId) + 1
          : 0;

        if (moduleId && moduleIndex > 0 && item.path) {
          return (
            <HomeModuleMenuItem
              label={String(item.name ?? "")}
              moduleIndex={moduleIndex}
              path={item.path}
              status={homeModuleStatusMap.get(moduleId)}
              onNavigate={handleMenuClick}
            />
          );
        }

        return (
          <Link
            href={item.path ?? "#"}
            onClick={(event) => {
              event.preventDefault();
              if (item.path) {
                handleMenuClick(item.path);
              }
            }}
            style={{ color: "inherit" }}
          >
            {dom}
          </Link>
        );
      }}
      menuHeaderRender={(logo, _title, props) => {
        if (props?.collapsed) {
          return (
            <div className="cms-menu-brand cms-menu-brand--collapsed" aria-label="Midearth CMS">
              {logo}
            </div>
          );
        }

        return <MenuBrandHeader />;
      }}
      token={proLayoutToken}
      contentStyle={{ padding: 0 }}
    >
      <PageContainer
        title={
          <Tooltip title={pageTitle}>
            <span className="cms-page-header-title">{pageTitle}</span>
          </Tooltip>
        }
        subTitle={
          pageSubTitle ? (
            <Tooltip title={pageSubTitle}>
              <span className="cms-page-header-subtitle">{pageSubTitle}</span>
            </Tooltip>
          ) : undefined
        }
        extra={renderPageActions(
          state,
          activeModule,
          hasSupplementalUnsavedChanges,
          {
            onPreviewDraft: handlePreviewDraft,
            onSaveDraft: handleSaveDraft,
            onPublish: handlePublish,
            pendingAction,
          },
        )}
        tags={renderPageTags(
          state,
          activeModule,
          hasSupplementalUnsavedChanges,
        )}
        breadcrumb={{
          items:
            state.workspace === "home"
              ? [{ title: getWorkspaceTitle(state) }, { title: pageTitle }]
              : [{ title: pageTitle }],
        }}
      >
        {renderWorkspace(state, activeModule, {
          onModuleFieldChange: (moduleId, key, value) => {
            setState((current) =>
              updateHomeModuleField(current, moduleId, key, value),
            );
          },
          onImageUpload: (fieldKey, file) =>
            handleImageUpload(activeModule.id, fieldKey, file),
          onSupplementalDirtyChange: handleSupplementalDirtyChange,
          destinationCategories,
          services,
          testimonials,
          onDestinationCategoriesChange: setDestinationCategories,
          onServicesChange: setServices,
          onTestimonialsChange: setTestimonials,
          onViewBooking: (bookingId) => {
            setState((current) => openBooking(current, bookingId));
          },
          onViewPayment: (paymentId) => {
            setState((current) => openPayment(current, paymentId));
          },
          onFocusHandled: () => {
            setState((current) => clearWorkspaceFocus(current));
          },
        })}
      </PageContainer>
    </ProLayout>
  );
}

function renderPageTags(
  state: AdminState,
  activeModule: ReturnType<typeof getActiveModule>,
  hasSupplementalUnsavedChanges: boolean,
) {
  if (state.workspace !== "home") {
    return undefined;
  }

  const tags = [
    <StatusTag key="status" status={activeModule.status} />,
    <Tag key="published" bordered={false} className="cms-version-tag">
      Published v{activeModule.publishedVersion}
    </Tag>,
  ];

  if (activeModule.draftVersion) {
    tags.push(
      <Tag key="draft" bordered className="cms-status-tag cms-status-tag--draft">
        Draft v{activeModule.draftVersion}
      </Tag>,
    );
  }

  if (state.hasUnsavedChanges || hasSupplementalUnsavedChanges) {
    tags.push(
      <Tag key="unsaved" bordered className="cms-status-tag cms-status-tag--draft">
        Unsaved changes
      </Tag>,
    );
  }

  return <Space size={[8, 8]} wrap className="cms-page-header-tags">{tags}</Space>;
}

function renderPageActions(
  state: AdminState,
  activeModule: ReturnType<typeof getActiveModule>,
  hasSupplementalUnsavedChanges: boolean,
  handlers: {
    onPreviewDraft: () => void;
    onSaveDraft: () => void;
    onPublish: () => void;
    pendingAction: "save" | "publish" | null;
  },
) {
  if (state.workspace === "home") {
    const publishDisabledReason = getPublishDisabledReason(
      state,
      activeModule,
      hasSupplementalUnsavedChanges,
    );
    const canPublish = publishDisabledReason === null;

    return (
      <Space wrap>
        <Button type="text" onClick={handlers.onPreviewDraft}>
          Preview Draft
        </Button>
        <Button
          loading={handlers.pendingAction === "save"}
          disabled={handlers.pendingAction !== null}
          onClick={handlers.onSaveDraft}
        >
          Save Draft
        </Button>
        <Tooltip title={publishDisabledReason ?? undefined}>
          <span className="cms-disabled-action-wrap">
            <Button
              type="primary"
              className="cms-primary-action"
              disabled={!canPublish}
              loading={handlers.pendingAction === "publish"}
              onClick={handlers.onPublish}
            >
              Publish
            </Button>
          </span>
        </Tooltip>
      </Space>
    );
  }

  return null;
}

function getPublishDisabledReason(
  state: AdminState,
  activeModule: ReturnType<typeof getActiveModule>,
  hasSupplementalUnsavedChanges: boolean,
): string | null {
  if (state.hasUnsavedChanges || hasSupplementalUnsavedChanges) {
    return "Save draft before publishing";
  }

  if (activeModule.status === "published") {
    return "Already published. Edit content and save draft to publish updates.";
  }

  return null;
}

function renderWorkspace(
  state: AdminState,
  activeModule: ReturnType<typeof getActiveModule>,
  handlers: {
    onModuleFieldChange: (
      moduleId: HomeModuleId,
      key: string,
      value: (typeof activeModule.data)[string],
    ) => void;
    onImageUpload: (fieldKey: string, file: File) => Promise<string>;
    onSupplementalDirtyChange: (
      moduleId: HomeModuleId,
      dirty: boolean,
    ) => void;
    destinationCategories: DestinationCategory[];
    services: Service[];
    testimonials: Testimonial[];
    onDestinationCategoriesChange: (categories: DestinationCategory[]) => void;
    onServicesChange: (services: Service[]) => void;
    onTestimonialsChange: (testimonials: Testimonial[]) => void;
    onViewBooking: (bookingId: string) => void;
    onViewPayment: (paymentId: string) => void;
    onFocusHandled: () => void;
  },
) {
  if (state.workspace === "home") {
    return (
      <HomeModuleEditor
        module={activeModule}
        onChange={(key, value) =>
          handlers.onModuleFieldChange(activeModule.id, key, value)
        }
        onImageUpload={handlers.onImageUpload}
        onSupplementalDirtyChange={handlers.onSupplementalDirtyChange}
        destinationCategories={handlers.destinationCategories}
        services={handlers.services}
        testimonials={handlers.testimonials}
        onDestinationCategoriesChange={handlers.onDestinationCategoriesChange}
        onServicesChange={handlers.onServicesChange}
        onTestimonialsChange={handlers.onTestimonialsChange}
      />
    );
  }

  if (state.workspace === "tours") {
    return <ToursWorkspace tours={tourSeeds} />;
  }

  if (state.workspace === "bookings") {
    return (
      <BookingsWorkspace
        bookings={bookingSeeds}
        payments={paymentSeeds}
        focusBookingId={state.focusBookingId}
        onFocusHandled={handlers.onFocusHandled}
        onViewPayment={handlers.onViewPayment}
      />
    );
  }

  if (state.workspace === "payments") {
    return (
      <PaymentsWorkspace
        payments={paymentSeeds}
        bookings={bookingSeeds}
        focusPaymentId={state.focusPaymentId}
        onFocusHandled={handlers.onFocusHandled}
        onViewBooking={handlers.onViewBooking}
      />
    );
  }

  if (state.workspace === "settings") {
    return <SettingsPanel settings={settingsSeed} />;
  }

  return null;
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return payload;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
