"use client";

import { Badge, Tag } from "antd";
import type { ContentStatus } from "@/types/cms";

export type StatusTagVariant = "tag" | "badge";

export type StatusTagProps = {
  status: ContentStatus;
  variant?: StatusTagVariant;
};

const statusLabels: Record<ContentStatus, string> = {
  published: "Published",
  draft: "Draft",
  unpublished: "Unpublished",
};

const badgeStatus: Record<ContentStatus, "success" | "warning" | "default"> = {
  published: "success",
  draft: "warning",
  unpublished: "default",
};

const statusTagClassNames: Record<ContentStatus, string> = {
  published: "cms-status-tag cms-status-tag--published",
  draft: "cms-status-tag cms-status-tag--draft",
  unpublished: "cms-status-tag cms-status-tag--unpublished",
};

export function StatusTag({ status, variant = "tag" }: StatusTagProps) {
  if (variant === "badge") {
    return <Badge status={badgeStatus[status]} />;
  }

  return (
    <Tag bordered className={statusTagClassNames[status]}>
      {statusLabels[status]}
    </Tag>
  );
}
