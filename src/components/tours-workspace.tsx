"use client";

import { EditOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Image,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { StatusTag } from "@/components/status-tag";
import { TourEditor } from "@/components/tour-editor";
import { TourTypeAutoComplete } from "@/components/tour-type-autocomplete";
import {
  destinationCategorySeeds,
  type DestinationCategory,
} from "@/lib/destination-categories";
import { createEmptyTourRecord } from "@/lib/create-empty-tour";
import { replaceTourEditorRecord, validateTourEditorRecord } from "@/lib/tour-editor-state";
import { getTourTypeOptions } from "@/lib/tour-type-state";
import { getTourStatusCounts } from "@/lib/workspace-view-models";
import type { TourRecord } from "@/types/cms";

type ToursWorkspaceProps = {
  tours: TourRecord[];
  destinationCategories?: DestinationCategory[];
  onToursChange?: (tours: TourRecord[]) => void;
};

type TourWorkspaceState = {
  records: TourRecord[];
  customTypes: string[];
};

export function ToursWorkspace({
  tours,
  destinationCategories = destinationCategorySeeds,
  onToursChange,
}: ToursWorkspaceProps) {
  const { message } = App.useApp();
  const [tourState, setTourState] = useState<TourWorkspaceState>(() =>
    createInitialTourWorkspaceState(tours),
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const counts = getTourStatusCounts(tourState.records);

  const editingTour = useMemo(
    () => tourState.records.find((tour) => tour.slug === editingSlug) ?? null,
    [editingSlug, tourState.records],
  );

  const tourTypeOptions = useMemo(
    () => getTourTypeOptions(tourState.records, tourState.customTypes),
    [tourState.customTypes, tourState.records],
  );

  useEffect(() => {
    setTourState(createInitialTourWorkspaceState(tours));
  }, [tours]);

  useEffect(() => {
    if (tours.length > 0) return;

    const controller = new AbortController();

    async function loadTours() {
      try {
        const response = await fetch("/api/admin/tours", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readApiResponse<{ tours: TourRecord[] }>(response);
        if (!controller.signal.aborted) {
          setTourState({ records: payload.tours, customTypes: [] });
          onToursChange?.(payload.tours);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          message.error(getErrorMessage(error, "Tours could not be loaded"));
        }
      }
    }

    void loadTours();
    return () => controller.abort();
  }, [message, onToursChange, tours.length]);

  function syncRecords(nextRecords: TourRecord[], customTypes = tourState.customTypes) {
    setTourState({ records: nextRecords, customTypes });
    onToursChange?.(nextRecords);
  }

  function openNewTour() {
    const draft = createEmptyTourRecord(tourState.records.map((tour) => tour.slug));
    syncRecords([draft, ...tourState.records]);
    setEditingSlug(draft.slug);
    message.success("New tour draft opened — fill in details and save");
  }

  function resolveTourType(rawValue: string): { tourType: string; isNew: boolean } | null {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      return null;
    }

    const existing = tourTypeOptions.find(
      (tourType) => tourType.toLocaleLowerCase("en") === trimmed.toLocaleLowerCase("en"),
    );

    if (existing) {
      return { tourType: existing, isNew: false };
    }

    return { tourType: trimmed, isNew: true };
  }

  async function commitTourTypeValue(slug: string, rawValue: string) {
    const resolved = resolveTourType(rawValue);

    if (!resolved) {
      message.error("Enter a tour type name");
      return;
    }

    const current = tourState.records.find((tour) => tour.slug === slug);
    if (
      current?.tourType === resolved.tourType &&
      (!resolved.isNew || tourState.customTypes.includes(resolved.tourType))
    ) {
      return;
    }

    if (!current) return;

    try {
      const saved = await persistTour({ ...current, tourType: resolved.tourType });
      const nextCustomTypes =
        resolved.isNew && !tourState.customTypes.includes(resolved.tourType)
          ? [...tourState.customTypes, resolved.tourType]
          : tourState.customTypes;
      syncRecords(replaceTourEditorRecord(tourState.records, saved), nextCustomTypes);
      message.success("Tour type saved to Supabase");
    } catch (error) {
      message.error(getErrorMessage(error, "Tour type could not be saved"));
    }
  }

  async function handleTourUpdate(record: TourRecord) {
    const validation = validateTourEditorRecord(record);

    if (!validation.ok) {
      message.error("Complete the required tour fields");
      return;
    }

    const resolved = resolveTourType(validation.value.tourType);

    if (!resolved) {
      message.error("Enter a tour type name");
      return;
    }

    const updatedRecord = {
      ...validation.value,
      tourType: resolved.tourType,
      updatedAt: new Date().toISOString(),
    };
    try {
      const saved = await persistTour(updatedRecord);
      const nextCustomTypes =
        resolved.isNew && !tourState.customTypes.includes(resolved.tourType)
          ? [...tourState.customTypes, resolved.tourType]
          : tourState.customTypes;
      syncRecords(replaceTourEditorRecord(tourState.records, saved), nextCustomTypes);
      setEditingSlug(null);
      message.success("Tour updated in Supabase");
    } catch (error) {
      message.error(getErrorMessage(error, "Tour could not be updated"));
    }
  }

  async function persistTour(record: TourRecord): Promise<TourRecord> {
    const response = await fetch(`/api/admin/tours/${record.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tour: record }),
    });
    const payload = await readApiResponse<{ tour: TourRecord }>(response);
    return payload.tour;
  }

  async function uploadTourImage(slug: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.set("slug", slug);
    formData.set("file", file);
    const response = await fetch("/api/admin/tours/upload", {
      method: "POST",
      body: formData,
    });
    const payload = await readApiResponse<{ url: string }>(response);
    return payload.url;
  }

  const columns: ProColumns<TourRecord>[] = [
    {
      title: "Image",
      dataIndex: "image",
      width: 104,
      render: (_, record) => (
        <Image
          className="cms-tour-thumbnail"
          src={record.image || "/file.svg"}
          fallback="/file.svg"
          alt={`${record.title} thumbnail`}
          preview={false}
          width={88}
          height={50}
        />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      render: (_, record) => <Typography.Text strong>{record.title}</Typography.Text>,
    },
    {
      title: "Slug",
      dataIndex: "slug",
      render: (_, record) => <Typography.Text code>{record.slug}</Typography.Text>,
    },
    {
      title: "Region",
      dataIndex: "region",
    },
    {
      title: "Duration",
      dataIndex: "duration",
    },
    {
      title: "Type",
      dataIndex: "tourType",
      width: 192,
      render: (_, record) => (
        <TourTypeAutoComplete
          className="cms-tour-type-select"
          value={record.tourType}
          options={tourTypeOptions}
          aria-label={`Type for ${record.title}`}
          onClick={(event) => event.stopPropagation()}
          onCommit={(nextValue) => void commitTourTypeValue(record.slug, nextValue)}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_, record) => <StatusTag status={record.status} />,
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      render: (_, record) => formatDate(record.updatedAt),
    },
    {
      title: "Edit",
      key: "edit",
      width: 96,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => setEditingSlug(record.slug)}
        >
          Edit
        </Button>
      ),
    },
  ];

  if (editingTour) {
    return (
      <TourEditor
        tour={editingTour}
        tourTypeOptions={tourTypeOptions}
        destinationCategories={destinationCategories}
        onCancel={() => setEditingSlug(null)}
        onUpdate={handleTourUpdate}
        onImageUpload={(file) => uploadTourImage(editingTour.slug, file)}
      />
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Published" value={counts.published} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Drafts" value={counts.draft} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Unpublished" value={counts.unpublished} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ProTable<TourRecord>
            headerTitle={false}
            columns={columns}
            dataSource={tourState.records}
            rowKey="slug"
            search={false}
            options={{ density: true, setting: true, reload: false }}
            pagination={false}
            scroll={{ x: 1080 }}
            toolBarRender={() => [
              <Button
                key="new-tour"
                type="primary"
                className="cms-primary-action"
                onClick={openNewTour}
              >
                New Tour
              </Button>,
            ]}
            locale={{
              emptyText: (
                <Empty description="No tours yet">
                  <Button
                    type="primary"
                    className="cms-primary-action"
                    onClick={openNewTour}
                  >
                    New Tour
                  </Button>
                </Empty>
              ),
            }}
          />
        </Col>
      </Row>
    </Space>
  );
}

function createInitialTourWorkspaceState(tours: TourRecord[]): TourWorkspaceState {
  return { records: tours, customTypes: [] };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
