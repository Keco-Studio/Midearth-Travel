"use client";

import { DeleteOutlined, PlusOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Input, InputNumber, Space, Table, Typography, Upload } from "antd";
import { useState } from "react";
import type { Service } from "@/data/services";
import type { Testimonial } from "@/data/testimonials";
import {
  createEmptyTestimonial,
  MAX_HOMEPAGE_TESTIMONIALS,
} from "@/lib/home-collections";

type ServiceCardsEditorProps = {
  records: Service[];
  onChange: (records: Service[]) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function ServiceCardsEditor({
  records,
  onChange,
  onDirtyChange,
}: ServiceCardsEditorProps) {
  const { message } = App.useApp();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function update(id: string, key: keyof Service, value: string) {
    onDirtyChange(true);
    onChange(
      records.map((record) =>
        record.id === id ? { ...record, [key]: value } : record,
      ),
    );
  }

  async function uploadImage(record: Service, file: File) {
    setUploadingId(record.id);
    try {
      const formData = new FormData();
      formData.set("id", record.id);
      formData.set("file", file);
      const response = await fetch("/api/admin/services/upload", { method: "POST", body: formData });
      const payload = await readResponse<{ url: string }>(response);
      update(record.id, "image", payload.url);
    } catch (error) {
      message.error(getMessage(error, "Service image upload failed"));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <CollectionSection title="Service cards">
      <Table<Service>
        rowKey="id"
        dataSource={records}
        pagination={false}
        scroll={{ x: 1100 }}
        columns={[
          textColumn("Title", "title", update, 180),
          textColumn("Summary", "summary", update, 300),
          {
            title: "Image",
            dataIndex: "image",
            width: 360,
            render: (_, record) => (
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  value={record.image}
                  onChange={(event) => update(record.id, "image", event.target.value)}
                />
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void uploadImage(record, file);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingId === record.id} />
                </Upload>
              </Space.Compact>
            ),
          },
          textColumn("Slug", "slug", update, 180),
        ]}
      />
    </CollectionSection>
  );
}

type TestimonialsEditorProps = {
  records: Testimonial[];
  onChange: (records: Testimonial[]) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function TestimonialsEditor({
  records,
  onChange,
  onDirtyChange,
}: TestimonialsEditorProps) {
  const { message } = App.useApp();

  function update(id: string, key: keyof Testimonial, value: string | number) {
    onDirtyChange(true);
    onChange(
      records.map((record) =>
        record.id === id ? { ...record, [key]: value } : record,
      ),
    );
  }

  function addReview() {
    if (records.length >= MAX_HOMEPAGE_TESTIMONIALS) {
      message.warning(`You can add at most ${MAX_HOMEPAGE_TESTIMONIALS} reviews`);
      return;
    }
    onDirtyChange(true);
    onChange([...records, createEmptyTestimonial()]);
  }

  function removeReview(id: string) {
    if (records.length <= 1) {
      message.warning("Keep at least one review");
      return;
    }
    onDirtyChange(true);
    onChange(records.filter((record) => record.id !== id));
  }

  return (
    <CollectionSection
      title="Reviews"
      extra={
        <Button
          disabled={records.length >= MAX_HOMEPAGE_TESTIMONIALS}
          icon={<PlusOutlined />}
          onClick={addReview}
          type="dashed"
        >
          Add review
        </Button>
      }
    >
      <Table<Testimonial>
        rowKey="id"
        dataSource={records}
        pagination={false}
        scroll={{ x: 1000 }}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
            width: 180,
            render: (_, record) => (
              <Input value={record.name} onChange={(event) => update(record.id, "name", event.target.value)} />
            ),
          },
          {
            title: "Source",
            dataIndex: "source",
            width: 180,
            render: (_, record) => (
              <Input value={record.source} onChange={(event) => update(record.id, "source", event.target.value)} />
            ),
          },
          {
            title: "Rating",
            dataIndex: "rating",
            width: 110,
            render: (_, record) => (
              <InputNumber min={1} max={5} value={record.rating} onChange={(value) => update(record.id, "rating", value ?? 5)} />
            ),
          },
          {
            title: "Review text",
            dataIndex: "text",
            render: (_, record) => (
              <Input.TextArea rows={3} value={record.text} onChange={(event) => update(record.id, "text", event.target.value)} />
            ),
          },
          {
            title: "",
            width: 64,
            render: (_, record) => (
              <Button
                danger
                disabled={records.length <= 1}
                icon={<DeleteOutlined />}
                onClick={() => removeReview(record.id)}
              />
            ),
          },
        ]}
      />
    </CollectionSection>
  );
}

function CollectionSection({
  title,
  children,
  extra,
}: {
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section className="cms-destination-name-editor">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
        {extra}
      </div>
      {children}
    </section>
  );
}

function textColumn(
  title: string,
  key: "title" | "summary" | "slug",
  update: (id: string, key: keyof Service, value: string) => void,
  width: number,
) {
  return {
    title,
    dataIndex: key,
    width,
    render: (_: unknown, record: Service) => (
      <Input value={record[key]} onChange={(event) => update(record.id, key, event.target.value)} />
    ),
  };
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload;
}

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
