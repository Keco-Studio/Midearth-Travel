"use client";

import { Input, Table, Typography } from "antd";
import type { DestinationCategory } from "@/lib/destination-categories";

type DestinationCategoryEditorProps = {
  categories: DestinationCategory[];
  onChange: (categories: DestinationCategory[]) => void;
  onDirtyChange: (dirty: boolean) => void;
};

type EditableKey = "titleEn" | "titleZh" | "summary" | "image";

export function DestinationCategoryEditor({
  categories,
  onChange,
  onDirtyChange,
}: DestinationCategoryEditorProps) {
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
            title: "Image URL",
            dataIndex: "image",
            width: 220,
            render: (_, record) => (
              <Input
                value={record.image}
                onChange={(event) => updateField(record.id, "image", event.target.value)}
              />
            ),
          },
        ]}
      />
    </section>
  );
}
