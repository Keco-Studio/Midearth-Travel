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
import { useMemo, useState } from "react";
import { StatusTag } from "@/components/status-tag";
import { TourEditor } from "@/components/tour-editor";
import { TourTypeAutoComplete } from "@/components/tour-type-autocomplete";
import {
  TOUR_EDITOR_STORAGE_KEY,
  applyTourEditorRecords,
  buildTourEditorStorage,
  parseTourEditorStorage,
  replaceTourEditorRecord,
  validateTourEditorRecord,
} from "@/lib/tour-editor-state";
import {
  TOUR_TYPE_STORAGE_KEY,
  applyTourTypeOverrides,
  buildTourTypeStorageState,
  getTourTypeOptions,
  parseTourTypeStorage,
} from "@/lib/tour-type-state";
import { getTourStatusCounts } from "@/lib/workspace-view-models";
import type { TourRecord } from "@/types/cms";

type ToursWorkspaceProps = {
  tours: TourRecord[];
};

type TourWorkspaceState = {
  records: TourRecord[];
  customTypes: string[];
};

export function ToursWorkspace({ tours }: ToursWorkspaceProps) {
  const { message } = App.useApp();
  const [tourState, setTourState] = useState<TourWorkspaceState>(() =>
    createInitialTourWorkspaceState(tours),
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [loading] = useState(false);
  const counts = getTourStatusCounts(tourState.records);

  const editingTour = useMemo(
    () => tourState.records.find((tour) => tour.slug === editingSlug) ?? null,
    [editingSlug, tourState.records],
  );

  const tourTypeOptions = useMemo(
    () => getTourTypeOptions(tourState.records, tourState.customTypes),
    [tourState.customTypes, tourState.records],
  );

  function persistTourTypeState(nextState: TourWorkspaceState) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = buildTourTypeStorageState(tours, nextState.records, nextState.customTypes);
      window.localStorage.setItem(TOUR_TYPE_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      message.error("Tour type changes could not be saved");
    }
  }

  function commitTourTypeState(nextState: TourWorkspaceState) {
    setTourState(nextState);
    persistTourTypeState(nextState);
  }

  function persistEditorRecords(records: TourRecord[]) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = buildTourEditorStorage(tours, records);
      window.localStorage.setItem(TOUR_EDITOR_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      message.error("Tour changes could not be saved");
    }
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

  function commitTourTypeValue(slug: string, rawValue: string) {
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

    const nextState = {
      records: tourState.records.map((tour) =>
        tour.slug === slug ? { ...tour, tourType: resolved.tourType } : tour,
      ),
      customTypes: resolved.isNew
        ? [...tourState.customTypes, resolved.tourType]
        : tourState.customTypes,
    };

    commitTourTypeState(nextState);
  }

  function handleTourUpdate(record: TourRecord) {
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
    const nextState = {
      customTypes: resolved.isNew
        ? [...tourState.customTypes, resolved.tourType]
        : tourState.customTypes,
      records: replaceTourEditorRecord(tourState.records, updatedRecord),
    };

    commitTourTypeState(nextState);
    persistEditorRecords(nextState.records);
    setEditingSlug(null);
    message.success("Tour updated");
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
          onCommit={(nextValue) => commitTourTypeValue(record.slug, nextValue)}
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
        onCancel={() => setEditingSlug(null)}
        onUpdate={handleTourUpdate}
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
            loading={loading}
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
                onClick={() => message.success("New tour form opened")}
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
                    onClick={() => message.success("New tour form opened")}
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
  if (typeof window === "undefined") {
    return { records: tours, customTypes: [] };
  }

  try {
    const storedEditor = parseTourEditorStorage(
      window.localStorage.getItem(TOUR_EDITOR_STORAGE_KEY),
    );
    const editedRecords = applyTourEditorRecords(tours, storedEditor.records);
    const storedTypes = parseTourTypeStorage(
      window.localStorage.getItem(TOUR_TYPE_STORAGE_KEY),
    );

    return {
      records: applyTourTypeOverrides(editedRecords, storedTypes.overrides),
      customTypes: storedTypes.customTypes,
    };
  } catch {
    return { records: tours, customTypes: [] };
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
