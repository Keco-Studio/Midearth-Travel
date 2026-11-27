"use client";

import { UploadOutlined } from "@ant-design/icons";
import { App, Button, Input, Space, Table, Typography, Upload } from "antd";
import { useState } from "react";
import { BusToursContentEditor } from "@/components/bus-tours-content-editor";
import { getBusToursContent } from "@/lib/bus-tours-content";
import type { DestinationCategory } from "@/lib/destination-categories";
import { validateInlineImageFile } from "@/lib/inline-image-upload";
import type { TourRecord } from "@/types/cms";

type DestinationCategoryEditorProps = {
  categories: DestinationCategory[];
  onChange: (categories: DestinationCategory[]) => void;
  onDirtyChange: (dirty: boolean) => void;
  onImageUpload: (categoryId: string, file: File) => Promise<string>;
  tours: TourRecord[];
};

type EditableKey = "titleEn" | "titleZh" | "summary" | "summaryZh" | "image";

export function DestinationCategoryEditor({
  categories,
  onChange,
  onDirtyChange,
  onImageUpload,
  tours,
}: DestinationCategoryEditorProps) {
  const { message } = App.useApp();
  const [uploadingCategories, setUploadingCategories] = useState<Record<string, boolean>>(
    {},
  );
  const busTours = categories.find((category) => category.id === "bus-tours");

  function updateField(id: string, key: EditableKey, value: string) {
    onDirtyChange(true);
    onChange(
      categories.map((category) =>
        category.id === id
          ? {
              ...category,
              [key]: value,
              ...(key === "titleEn" ? { title: value } : {}),
            }
          : category,
      ),
    );
  }

  async function uploadCategoryImage(category: DestinationCategory, file: File) {
    const validation = validateInlineImageFile(file);
    if (!validation.ok) {
      message.error(validation.error);
      return;
    }

    setUploadingCategories((current) => ({ ...current, [category.id]: true }));
    try {
      const url = await onImageUpload(category.id, file);
      updateField(category.id, "image", url);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploadingCategories((current) => {
        const next = { ...current };
        delete next[category.id];
        return next;
      });
    }
  }

  return (
    <section className="cms-destination-name-editor">
      <Typography.Title level={5} style={{ margin: "0 0 8px" }}>
        Destination names
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Optional summary and image URL override listing pages. When image is left as the
        default seed, homepage cards still prefer the first published tour cover.
      </Typography.Paragraph>
      <Table<DestinationCategory>
        rowKey="id"
        dataSource={categories}
        pagination={false}
        size="middle"
        scroll={{ x: true }}
        columns={[
          {
            title: "English name",
            dataIndex: "titleEn",
            width: 160,
            render: (_, record) => (
              <Input
                maxLength={80}
                value={record.titleEn}
                onChange={(event) => updateField(record.id, "titleEn", event.target.value)}
              />
            ),
          },
          {
            title: "中文名称",
            dataIndex: "titleZh",
            width: 140,
            render: (_, record) => (
              <Input
                maxLength={80}
                value={record.titleZh}
                onChange={(event) => updateField(record.id, "titleZh", event.target.value)}
              />
            ),
          },
          {
            title: "Summary",
            dataIndex: "summary",
            width: 260,
            render: (_, record) => (
              <Input.TextArea
                rows={2}
                maxLength={300}
                value={record.summary ?? ""}
                onChange={(event) => updateField(record.id, "summary", event.target.value)}
              />
            ),
          },
          {
            title: "中文简介",
            dataIndex: "summaryZh",
            width: 260,
            render: (_, record) => (
              <Input.TextArea
                rows={2}
                maxLength={300}
                value={record.summaryZh ?? ""}
                onChange={(event) => updateField(record.id, "summaryZh", event.target.value)}
              />
            ),
          },
          {
            title: "Image URL",
            dataIndex: "image",
            width: 240,
            render: (_, record) => {
              const uploading = Boolean(uploadingCategories[record.id]);

              return (
                <Space direction="vertical" size={8} style={{ width: "100%" }}>
                  <Input
                    value={record.image}
                    onChange={(event) => updateField(record.id, "image", event.target.value)}
                  />
                  <Upload
                    accept="image/*"
                    beforeUpload={(file) => {
                      void uploadCategoryImage(record, file);
                      return Upload.LIST_IGNORE;
                    }}
                    disabled={uploading}
                    showUploadList={false}
                  >
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      Upload Image
                    </Button>
                  </Upload>
                </Space>
              );
            },
          },
        ]}
      />
      {busTours ? (
        <BusToursContentEditor
          content={getBusToursContent(busTours.busContent)}
          tours={tours}
          onDirtyChange={onDirtyChange}
          onChange={(busContent) =>
            onChange(
              categories.map((category) =>
                category.id === "bus-tours" ? { ...category, busContent } : category,
              ),
            )
          }
        />
      ) : null}
    </section>
  );
}
