"use client";

import { UploadOutlined } from "@ant-design/icons";
import { App, Button, Input, InputNumber, Space, Table, Typography, Upload } from "antd";
import { useEffect, useState } from "react";
import type { Service } from "@/data/services";
import type { Testimonial } from "@/data/testimonials";

export function ServiceCardsEditor() {
  const { message } = App.useApp();
  const [records, setRecords] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => loadCollection("/api/admin/services", "services", setRecords, setLoading, message), [message]);

  function update(id: string, key: keyof Service, value: string) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, [key]: value } : record)),
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

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: records }),
      });
      const payload = await readResponse<{ services: Service[] }>(response);
      setRecords(payload.services);
      message.success("Service cards saved to Supabase");
    } catch (error) {
      message.error(getMessage(error, "Service cards could not be saved"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollectionSection title="Service cards" saving={saving} onSave={save}>
      <Table<Service>
        rowKey="id"
        loading={loading}
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

export function TestimonialsEditor() {
  const { message } = App.useApp();
  const [records, setRecords] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(
    () => loadCollection("/api/admin/testimonials", "testimonials", setRecords, setLoading, message),
    [message],
  );

  function update(id: string, key: keyof Testimonial, value: string | number) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, [key]: value } : record)),
    );
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonials: records }),
      });
      const payload = await readResponse<{ testimonials: Testimonial[] }>(response);
      setRecords(payload.testimonials);
      message.success("Testimonials saved to Supabase");
    } catch (error) {
      message.error(getMessage(error, "Testimonials could not be saved"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CollectionSection title="Reviews" saving={saving} onSave={save}>
      <Table<Testimonial>
        rowKey="id"
        loading={loading}
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
        ]}
      />
    </CollectionSection>
  );
}

function CollectionSection({
  title,
  saving,
  onSave,
  children,
}: {
  title: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="cms-destination-name-editor">
      <Space style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }} wrap>
        <Typography.Title level={5} style={{ margin: 0 }}>{title}</Typography.Title>
        <Button type="primary" loading={saving} onClick={onSave}>Save data</Button>
      </Space>
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

function loadCollection<T>(
  url: string,
  key: string,
  setRecords: (records: T[]) => void,
  setLoading: (loading: boolean) => void,
  message: { error: (content: string) => void },
) {
  const controller = new AbortController();
  fetch(url, { cache: "no-store", signal: controller.signal })
    .then((response) => readResponse<Record<string, T[]>>(response))
    .then((payload) => setRecords(payload[key] ?? []))
    .catch((error) => {
      if (!controller.signal.aborted) message.error(getMessage(error, "Data could not be loaded"));
    })
    .finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
  return () => controller.abort();
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload;
}

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
