"use client";

import {
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Input,
  InputNumber,
  Space,
  Table,
  Typography,
  Upload,
} from "antd";
import { useState } from "react";
import { AssetPreview } from "@/components/asset-preview";
import {
  createEmptyService,
  MAX_HOMEPAGE_SERVICES,
  type Service,
  type ServiceDeal,
  type ServicePageFields,
} from "@/data/services";
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

  function markDirty(next: Service[]) {
    onDirtyChange(true);
    onChange(next);
  }

  function updateCard(id: string, patch: Partial<Service>) {
    markDirty(
      records.map((record) =>
        record.id === id ? { ...record, ...patch } : record,
      ),
    );
  }

  function updatePage(id: string, patch: Partial<ServicePageFields>) {
    markDirty(
      records.map((record) =>
        record.id === id
          ? { ...record, page: { ...record.page, ...patch } }
          : record,
      ),
    );
  }

  function updateDeal(
    serviceId: string,
    dealId: string,
    key: keyof ServiceDeal,
    value: string,
  ) {
    markDirty(
      records.map((record) => {
        if (record.id !== serviceId) return record;
        return {
          ...record,
          page: {
            ...record.page,
            deals: record.page.deals.map((deal) =>
              deal.id === dealId ? { ...deal, [key]: value } : deal,
            ),
          },
        };
      }),
    );
  }

  function addDeal(serviceId: string) {
    markDirty(
      records.map((record) => {
        if (record.id !== serviceId) return record;
        return {
          ...record,
          page: {
            ...record.page,
            deals: [
              ...record.page.deals,
              {
                id: `deal-${Date.now()}`,
                route: "",
                priceLabel: "",
              },
            ],
          },
        };
      }),
    );
  }

  function removeDeal(serviceId: string, dealId: string) {
    markDirty(
      records.map((record) => {
        if (record.id !== serviceId) return record;
        return {
          ...record,
          page: {
            ...record.page,
            deals: record.page.deals.filter((deal) => deal.id !== dealId),
          },
        };
      }),
    );
  }

  function addService() {
    if (records.length >= MAX_HOMEPAGE_SERVICES) {
      message.warning(`You can add at most ${MAX_HOMEPAGE_SERVICES} service cards`);
      return;
    }
    markDirty([...records, createEmptyService()]);
  }

  function removeService(id: string) {
    if (records.length <= 1) {
      message.warning("Keep at least one service card");
      return;
    }
    markDirty(records.filter((record) => record.id !== id));
  }

  async function uploadImage(record: Service, file: File) {
    setUploadingId(record.id);
    try {
      const formData = new FormData();
      formData.set("id", record.id);
      formData.set("file", file);
      const response = await fetch("/api/admin/services/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await readResponse<{ url: string }>(response);
      updateCard(record.id, { image: payload.url });
    } catch (error) {
      message.error(getMessage(error, "Service image upload failed"));
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <CollectionSection
      title="Service cards"
      extra={
        <Button
          disabled={records.length >= MAX_HOMEPAGE_SERVICES}
          icon={<PlusOutlined />}
          onClick={addService}
          type="dashed"
        >
          Add service
        </Button>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Each service is listed as its own block: homepage card fields on top,
        destination page body below. Shared sign-off and WhatsApp fields are
        edited in the Travel Services section fields above this list; phones
        and email come from Global Settings.
      </Typography.Paragraph>

      <div style={{ display: "grid", gap: 20 }}>
        {records.map((record, index) => (
          <article
            key={record.id}
            style={{
              border: "1px solid #e8e2d4",
              borderRadius: 16,
              background: "#fffdf8",
              overflow: "hidden",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 18px",
                background: "#163530",
                color: "#fdfaf4",
              }}
            >
              <div>
                <Typography.Text
                  style={{
                    color: "#e8a838",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                  }}
                >
                  SERVICE {index + 1}
                </Typography.Text>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fdfaf4" }}>
                  {record.title.trim() || "Untitled service"}
                </div>
                <Typography.Text style={{ color: "rgba(253,250,244,0.7)" }}>
                  /services/{record.slug || "…"}
                </Typography.Text>
              </div>
              <Button
                danger
                disabled={records.length <= 1}
                icon={<DeleteOutlined />}
                onClick={() => removeService(record.id)}
              >
                Remove
              </Button>
            </header>

            <div style={{ display: "grid", gap: 18, padding: 18 }}>
              <section
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 16,
                  borderRadius: 12,
                  background: "#f5efe3",
                  border: "1px solid #ebe4d6",
                }}
              >
                <Typography.Title level={5} style={{ margin: 0 }}>
                  Homepage card
                </Typography.Title>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(180px, 240px) 1fr",
                    gap: 16,
                  }}
                >
                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <AssetPreview url={record.image} alt={record.title} />
                    <Space.Compact style={{ width: "100%" }}>
                      <Input
                        value={record.image}
                        onChange={(event) =>
                          updateCard(record.id, { image: event.target.value })
                        }
                      />
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          void uploadImage(record, file);
                          return Upload.LIST_IGNORE;
                        }}
                      >
                        <Button
                          icon={<UploadOutlined />}
                          loading={uploadingId === record.id}
                        />
                      </Upload>
                    </Space.Compact>
                  </Space>
                  <div style={{ display: "grid", gap: 12 }}>
                    <LabeledField label="Card title">
                      <Input
                        value={record.title}
                        onChange={(event) =>
                          updateCard(record.id, { title: event.target.value })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Card summary">
                      <Input
                        value={record.summary}
                        onChange={(event) =>
                          updateCard(record.id, {
                            summary: event.target.value,
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Slug (URL path)">
                      <Space.Compact style={{ width: "100%" }}>
                        <Input
                          disabled
                          style={{ width: 96 }}
                          value="/services/"
                        />
                        <Input
                          value={record.slug}
                          onChange={(event) =>
                            updateCard(record.id, { slug: event.target.value })
                          }
                        />
                      </Space.Compact>
                    </LabeledField>
                  </div>
                </div>
              </section>

              <section
                style={{
                  display: "grid",
                  gap: 12,
                  padding: 16,
                  borderRadius: 12,
                  background: "#f0f7f4",
                  border: "1px solid #c9ddd5",
                }}
              >
                <div>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    Destination page after click
                  </Typography.Title>
                  <Typography.Paragraph
                    type="secondary"
                    style={{ margin: "4px 0 0" }}
                  >
                    Visitors see this content at{" "}
                    <code>/services/{record.slug || "…"}</code>
                  </Typography.Paragraph>
                </div>
                <ServicePageEditor
                  record={record}
                  onAddDeal={() => addDeal(record.id)}
                  onRemoveDeal={(dealId) => removeDeal(record.id, dealId)}
                  onUpdateDeal={(dealId, key, value) =>
                    updateDeal(record.id, dealId, key, value)
                  }
                  onUpdatePage={(patch) => updatePage(record.id, patch)}
                />
              </section>
            </div>
          </article>
        ))}
      </div>
    </CollectionSection>
  );
}

function ServicePageEditor({
  record,
  onUpdatePage,
  onAddDeal,
  onRemoveDeal,
  onUpdateDeal,
}: {
  record: Service;
  onUpdatePage: (patch: Partial<ServicePageFields>) => void;
  onAddDeal: () => void;
  onRemoveDeal: (dealId: string) => void;
  onUpdateDeal: (
    dealId: string,
    key: keyof ServiceDeal,
    value: string,
  ) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <LabeledField label="Page title">
          <Input
            value={record.page.title}
            onChange={(event) => onUpdatePage({ title: event.target.value })}
          />
        </LabeledField>
        <LabeledField label="Quote form label">
          <Input
            value={record.page.quoteLabel}
            onChange={(event) =>
              onUpdatePage({ quoteLabel: event.target.value })
            }
          />
        </LabeledField>
      </div>
      <LabeledField label="Intro">
        <Input.TextArea
          rows={5}
          value={record.page.intro}
          onChange={(event) => onUpdatePage({ intro: event.target.value })}
        />
      </LabeledField>
      <LabeledField label="Disclaimer (optional)">
        <Input.TextArea
          rows={2}
          value={record.page.disclaimer}
          onChange={(event) =>
            onUpdatePage({ disclaimer: event.target.value })
          }
        />
      </LabeledField>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <LabeledField label="Meta title">
          <Input
            value={record.page.metaTitle}
            onChange={(event) =>
              onUpdatePage({ metaTitle: event.target.value })
            }
          />
        </LabeledField>
        <LabeledField label="Meta description">
          <Input
            value={record.page.metaDescription}
            onChange={(event) =>
              onUpdatePage({ metaDescription: event.target.value })
            }
          />
        </LabeledField>
      </div>
      <div>
        <Space
          align="center"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Typography.Text strong>Fare / offer rows</Typography.Text>
          <Button icon={<PlusOutlined />} onClick={onAddDeal} size="small">
            Add row
          </Button>
        </Space>
        <Table<ServiceDeal>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={record.page.deals}
          locale={{ emptyText: "No fare rows (optional)" }}
          columns={[
            {
              title: "Route / label",
              dataIndex: "route",
              render: (_, deal) => (
                <Input
                  value={deal.route}
                  onChange={(event) =>
                    onUpdateDeal(deal.id, "route", event.target.value)
                  }
                />
              ),
            },
            {
              title: "Price text",
              dataIndex: "priceLabel",
              render: (_, deal) => (
                <Input
                  value={deal.priceLabel}
                  onChange={(event) =>
                    onUpdateDeal(deal.id, "priceLabel", event.target.value)
                  }
                />
              ),
            },
            {
              title: "",
              width: 56,
              render: (_, deal) => (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onRemoveDeal(deal.id)}
                  size="small"
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6, flex: 1, minWidth: 0 }}>
      <Typography.Text type="secondary">{label}</Typography.Text>
      {children}
    </label>
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

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
  return payload;
}

function getMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
