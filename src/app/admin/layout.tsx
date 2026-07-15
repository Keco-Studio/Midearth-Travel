import type { Metadata } from "next";
import { AntdAppProvider } from "@/components/antd-app-provider";
import "./admin.css";

export const metadata: Metadata = {
  title: "Midearth CMS",
  description: "Content management workspace for MidEarth Travel.",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AntdAppProvider>
      <div className="cms-root">{children}</div>
    </AntdAppProvider>
  );
}
