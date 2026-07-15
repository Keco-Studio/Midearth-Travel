"use client";

import "./cms-home-module-menu.css";
import { StatusTag } from "@/components/status-tag";
import type { ContentStatus } from "@/types/cms";

const homeModuleTextColor = "#12312b";

type HomeModuleMenuItemProps = {
  path: string;
  label: string;
  moduleIndex: number;
  status?: ContentStatus;
  onNavigate: (path: string) => void;
};

export function HomeModuleMenuItem({
  path,
  label,
  moduleIndex,
  status,
  onNavigate,
}: HomeModuleMenuItemProps) {
  function handleActivate() {
    onNavigate(path);
  }

  return (
    <span
      className="cms-home-module-link"
      role="button"
      tabIndex={0}
      style={{ color: homeModuleTextColor, gap: 12 }}
      onClick={handleActivate}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleActivate();
        }
      }}
    >
      <span className="cms-home-module-index" style={{ color: homeModuleTextColor }}>
        {moduleIndex}
      </span>
      <span className="cms-home-module-label" style={{ color: homeModuleTextColor }}>
        {label}
      </span>
      {status ? (
        <span className="cms-home-module-status">
          <StatusTag status={status} variant="badge" />
        </span>
      ) : null}
    </span>
  );
}

export function MenuBrandHeader() {
  return (
    <div className="cms-menu-brand">
      <div className="cms-menu-brand-mark">MT</div>
      <div>
        <div className="cms-menu-brand-title">Midearth CMS</div>
        <div className="cms-menu-brand-subtitle">MidEarth Travel</div>
      </div>
    </div>
  );
}

export const menuBrandMarkStyle = {
  width: 44,
  height: 44,
  borderRadius: 8,
  background: "#c8953f",
  color: "#12312b",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
} as const;
