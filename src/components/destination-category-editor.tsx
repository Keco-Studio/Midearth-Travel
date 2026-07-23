"use client";

import { App, Button, Input, Space, Table, Typography } from "antd";
import { useEffect, useState } from "react";
import type { DestinationCategory } from "@/lib/destination-categories";

export function DestinationCategoryEditor() {
  const { message } = App.useApp();
  const [categories, setCategories] = useState<DestinationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/admin/destination-categories", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await readResponse<{ categories: DestinationCategory[] }>(response);
        setCategories(payload.categories);
      } catch (error) {
        if (!controller.signal.aborted) {
          message.error(getMessage(error, "Destination names could not be loaded"));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [message]);

  function updateName(id: string, key: "titleEn" | "titleZh", value: string) {
    setCategories((current) =>
      current.map((category) =>
        category.id === id ? { ...category, [key]: value } : category,
      ),
    );
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/destination-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: categories.map(({ id, titleEn, titleZh }) => ({
            id,
            titleEn,
            titleZh,
          })),
        }),
      });
      const payload = await readResponse<{ categories: DestinationCategory[] }>(response);
      setCategories(payload.categories);
      message.success("Destination names saved to Supabase");
    } catch (error) {
      message.error(getMessage(error, "Destination names could not be saved"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="cms-destination-name-editor">
      <Space
        align="center"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}
        wrap
      >
        <Typography.Title level={5} style={{ margin: 0 }}>
          Destination names
        </Typography.Title>
        <Button type="primary" loading={saving} onClick={save}>
          Save names
        </Button>
      </Space>
      <Table<DestinationCategory>
        rowKey="id"
        loading={loading}
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

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload;
}

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
