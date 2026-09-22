"use client";

import { DeleteOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Input, Space, Table, Tooltip, Typography } from "antd";
import {
  FOOTER_SERVICE_LINKS_KEY,
  getFooterLinkEditorData,
  getFooterLinkIssues,
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
  const { serviceLinks } = getFooterLinkEditorData(content);

  return (
    <section className="cms-destination-name-editor">
      <Typography.Title level={5} style={{ margin: "0 0 16px" }}>
        Footer service links
      </Typography.Title>
      <div style={{ display: "grid", gap: 24 }}>
        <LinkTable
          links={serviceLinks}
          onChange={(links) =>
            onChange(FOOTER_SERVICE_LINKS_KEY, serializeFooterLinks(links))
          }
          title="Services"
        />
      </div>
    </section>
  );
}

function LinkTable({
  title,
  links,
  onChange,
}: {
  title: string;
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
}) {
  const issues = getFooterLinkIssues(links);
  const invalidIds = new Set(issues.map((issue) => issue.id));

  function update(id: string, key: "label" | "labelZh" | "href", value: string) {
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
        id: `service-${Date.now()}`,
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
      {issues.length > 0 ? (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message={`${issues.length} service ${issues.length === 1 ? "link needs" : "links need"} attention`}
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {issues.map((issue) => {
                const link = links.find((item) => item.id === issue.id);
                return (
                  <li key={issue.id}>
                    {link?.label.trim() || "Unnamed link"}: {issue.message}
                  </li>
                );
              })}
            </ul>
          }
        />
      ) : null}
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
                status={invalidIds.has(record.id) ? "error" : undefined}
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
                status={invalidIds.has(record.id) ? "error" : undefined}
                value={record.href}
                onChange={(event) => update(record.id, "href", event.target.value)}
              />
            ),
          },
          {
            title: "中文名称",
            dataIndex: "labelZh",
            width: "30%",
            render: (_, record) => (
              <Input
                maxLength={60}
                value={record.labelZh ?? ""}
                onChange={(event) => update(record.id, "labelZh", event.target.value)}
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
