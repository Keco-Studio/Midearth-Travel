"use client";

import "@ant-design/v5-patch-for-react-19";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import { midEarthTheme } from "@/theme/mid-earth-theme";

type AntdAppProviderProps = {
  children: React.ReactNode;
};

export function AntdAppProvider({ children }: AntdAppProviderProps) {
  return (
    <AntdRegistry>
      <ConfigProvider locale={enUS} theme={midEarthTheme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
