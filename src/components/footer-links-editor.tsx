"use client";

import { DeleteOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Input, Space, Table, Tooltip, Typography } from "antd";
import {
  FOOTER_SERVICE_LINKS_KEY,
  FOOTER_TOUR_LINKS_KEY,
  getFooterLinkEditorData,
  serializeFooterLinks,
  type FooterLink,
} from "@/lib/footer-links";
import type { ContentData } from "@/lib/content-values";
import type { ContentValue } from "@/types/cms";

type FooterLinksEditorProps = {
  content: ContentData;
  onChange: (key: string, value: ContentValue) => void;
};

export function FooterLinksEditor({ content, onChange }: FooterLinksEditorProps) {
  const { tourLinks, serviceLinks } = getFooterLinkEditorData(content);

  return (
    <section className="cms-destination-name-editor">
      <Typography.Title level={5} style={{ margin: "0 0 16px" }}>
        Footer link columns
      </Typography.Title>
      <div style={{ display: "grid", gap: 24 }}>
        <LinkTable
          links={tourLinks}
          onChange={(links) =>
            onChange(FOOTER_TOUR_LINKS_KEY, serializeFooterLinks(links))
          }
          title="Tours"
          type="tour"
        />
        <LinkTable
          links={serviceLinks}
          onChange={(links) =>
            onChange(FOOTER_SERVICE_LINKS_KEY, serializeFooterLinks(links))
          }
          title="Services"
          type="service"
        />
      </div>
    </section>
  );
}

function LinkTable({
  title,
  type,
  links,
  onChange,
}: {
  title: string;
  type: "tour" | "service";
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
}) {
  function update(id: string, key: "label" | "href", value: string) {
    onChange(
      links.map((link) => (link.id === id ? { ...link, [key]: value } : link)),
    );
  }

  function add() {
    if (links.length >= 8) {
      return;
    }

    onChange([
      ...links,
      {
        id: `${type}-${Date.now()}`,
        label: "New link",
        href: "/",
      },
    ]);
  }

  function remove(id: string) {
    onChange(links.filter((link) => link.id !== id));
  }

  return (
    <div>
      <Space
        align="center"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
      >
        <Typography.Text strong>{title}</Typography.Text>
        <Button
          disabled={links.length >= 8}
          icon={<PlusOutlined />}
          onClick={add}
          size="small"
        >
          Add link
        </Button>
      </Space>
      <Table<FooterLink>
        columns={[
          {
            title: "Label",
            dataIndex: "label",
            width: "40%",
            render: (_, record) => (
              <Input
                maxLength={60}
                value={record.label}
                onChange={(event) => update(record.id, "label", event.target.value)}
              />
            ),
          },
          {
            title: "Link",
            dataIndex: "href",
            render: (_, record) => (
              <Input
                maxLength={240}
                prefix={<LinkOutlined />}
                value={record.href}
                onChange={(event) => update(record.id, "href", event.target.value)}
              />
            ),
          },
          {
            title: "",
            width: 52,
            render: (_, record) => (
              <Tooltip title="Delete link">
                <Button
                  aria-label={`Delete ${record.label || "link"}`}
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(record.id)}
                  type="text"
                />
              </Tooltip>
            ),
          },
        ]}
        dataSource={links}
        pagination={false}
        rowKey="id"
        size="small"
      />
    </div>
  );
}
