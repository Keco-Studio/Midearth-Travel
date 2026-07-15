"use client";

import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Image,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { StatusTag } from "@/components/status-tag";
import { TourEditor } from "@/components/tour-editor";
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
  validateNewTourType,
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

type TourTypeError = "required" | "duplicate";

const tourTypeErrorMessages: Record<TourTypeError, string> = {
  required: "Enter a tour type name",
  duplicate: "This tour type already exists",
};

export function ToursWorkspace({ tours }: ToursWorkspaceProps) {
  const { message } = App.useApp();
  const [tourState, setTourState] = useState<TourWorkspaceState>(() =>
    createInitialTourWorkspaceState(tours),
  );
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [openTypeSelectSlug, setOpenTypeSelectSlug] = useState<string | null>(null);
  const [addTypeTourSlug, setAddTypeTourSlug] = useState<string | null>(null);
  const [newTourTypeName, setNewTourTypeName] = useState("");
  const [newTourTypeError, setNewTourTypeError] = useState<TourTypeError | null>(null);
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

  function handleTourTypeChange(slug: string, tourType: string) {
    const nextState = {
      ...tourState,
      records: tourState.records.map((tour) =>
        tour.slug === slug ? { ...tour, tourType } : tour,
      ),
    };

    setOpenTypeSelectSlug(null);
    commitTourTypeState(nextState);
  }

  function openAddTypeModal(slug: string) {
    setOpenTypeSelectSlug(null);
    setAddTypeTourSlug(slug);
    setNewTourTypeName("");
    setNewTourTypeError(null);
  }

  function closeAddTypeModal() {
    setAddTypeTourSlug(null);
    setNewTourTypeName("");
    setNewTourTypeError(null);
  }

  function handleAddTourType() {
    if (!addTypeTourSlug) {
      return;
    }

    const validation = validateNewTourType(newTourTypeName, tourTypeOptions);

    if (!validation.ok) {
      setNewTourTypeError(validation.reason);
      return;
    }

    const nextState = {
      records: tourState.records.map((tour) =>
        tour.slug === addTypeTourSlug ? { ...tour, tourType: validation.value } : tour,
      ),
      customTypes: [...tourState.customTypes, validation.value],
    };

    commitTourTypeState(nextState);
    closeAddTypeModal();
  }

  function handleTourUpdate(record: TourRecord) {
    const validation = validateTourEditorRecord(record);

    if (!validation.ok) {
      message.error("Complete the required tour fields");
      return;
    }

    const updatedRecord = {
      ...validation.value,
      updatedAt: new Date().toISOString(),
    };
    const nextState = {
      ...tourState,
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
        <Select
          className="cms-tour-type-select"
          value={record.tourType}
          options={tourTypeOptions.map((value) => ({ value, label: value }))}
          aria-label={`Type for ${record.title}`}
          open={openTypeSelectSlug === record.slug}
          onOpenChange={(open) => setOpenTypeSelectSlug(open ? record.slug : null)}
          onClick={(event) => event.stopPropagation()}
          onChange={(value) => handleTourTypeChange(record.slug, value)}
          popupRender={(menu) => (
            <>
              {menu}
              <div className="cms-tour-type-dropdown-footer">
                <Tooltip title="Add type">
                  <Button
                    type="text"
                    className="cms-tour-type-add-button"
                    icon={<PlusOutlined />}
                    aria-label="Add type"
                    onClick={() => openAddTypeModal(record.slug)}
                  />
                </Tooltip>
              </div>
            </>
          )}
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

      <Modal
        title="Add tour type"
        open={addTypeTourSlug !== null}
        okText="Add"
        onOk={handleAddTourType}
        onCancel={closeAddTypeModal}
        destroyOnHidden
      >
        <label className="cms-tour-type-modal-label" htmlFor="new-tour-type-name">
          Tour type name
        </label>
        <Input
          id="new-tour-type-name"
          value={newTourTypeName}
          placeholder="Tour type name"
          status={newTourTypeError ? "error" : undefined}
          autoFocus
          onChange={(event) => {
            setNewTourTypeName(event.target.value);
            setNewTourTypeError(null);
          }}
          onPressEnter={handleAddTourType}
        />
        {newTourTypeError ? (
          <Typography.Text type="danger" className="cms-tour-type-error">
            {tourTypeErrorMessages[newTourTypeError]}
          </Typography.Text>
        ) : null}
      </Modal>
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
