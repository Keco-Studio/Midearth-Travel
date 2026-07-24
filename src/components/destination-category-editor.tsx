"use client";

import { Input, Table, Typography } from "antd";
import type { DestinationCategory } from "@/lib/destination-categories";

type DestinationCategoryEditorProps = {
  categories: DestinationCategory[];
  onChange: (categories: DestinationCategory[]) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function DestinationCategoryEditor({
  categories,
  onChange,
  onDirtyChange,
}: DestinationCategoryEditorProps) {
  function updateName(id: string, key: "titleEn" | "titleZh", value: string) {
    onDirtyChange(true);
    onChange(
      categories.map((category) =>
        category.id === id ? { ...category, [key]: value } : category,
      ),
    );
  }

  return (
    <section className="cms-destination-name-editor">
      <Typography.Title level={5} style={{ margin: "0 0 16px" }}>
        Destination names
      </Typography.Title>
      <Table<DestinationCategory>
        rowKey="id"
        dataSource={categories}
        pagination={false}
        size="middle"
        columns={[
          {
            title: "English name",
            dataIndex: "titleEn",
            render: (_, record) => (
              <Input
                maxLength={80}
                value={record.titleEn}
                onChange={(event) => updateName(record.id, "titleEn", event.target.value)}
              />
            ),
          },
          {
            title: "中文名称",
            dataIndex: "titleZh",
            render: (_, record) => (
              <Input
                maxLength={80}
                value={record.titleZh}
                onChange={(event) => updateName(record.id, "titleZh", event.target.value)}
              />
            ),
          },
        ]}
      />
    </section>
  );
}
