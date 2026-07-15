import type { ThemeConfig } from "antd";

export const midEarthTheme: ThemeConfig = {
  token: {
    colorPrimary: "#2f6f5e",
    colorInfo: "#2f6f5e",
    colorSuccess: "#2f6f5e",
    colorWarning: "#b86b13",
    colorError: "#b42318",
    colorLink: "#2f6f5e",
    colorText: "#12312b",
    colorTextSecondary: "#4a4438",
    colorTextTertiary: "#766f64",
    colorBgLayout: "#f4f1ea",
    colorBgContainer: "#ffffff",
    colorBorder: "#e4ded1",
    colorBorderSecondary: "#efe9dd",
    borderRadius: 10,
    borderRadiusSM: 6,
    borderRadiusLG: 14,
    fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`,
    fontSize: 14,
    wireframe: false,
  },
  components: {
    Layout: {
      siderBg: "#12312b",
      headerBg: "rgba(244,241,234,0.92)",
      headerHeight: 60,
      bodyBg: "#f4f1ea",
    },
    Menu: {
      darkItemBg: "#12312b",
      darkSubMenuItemBg: "#0f2a24",
      darkItemColor: "#c9d3ce",
      darkGroupTitleColor: "#dfe8e4",
      darkItemSelectedBg: "rgba(200,149,63,0.16)",
      darkItemSelectedColor: "#fffaf1",
      darkItemHoverBg: "rgba(255,255,255,0.06)",
      darkItemHoverColor: "#fffaf1",
    },
    Table: {
      headerBg: "#f9f6ef",
      headerColor: "#766f64",
      rowHoverBg: "#fbf9f4",
      borderColor: "#efe9dd",
    },
    Card: {
      paddingLG: 24,
    },
    Button: {
      fontWeight: 600,
      primaryShadow: "none",
    },
    Popover: {
      colorBgElevated: "#ffffff",
      colorText: "#12312b",
      colorTextHeading: "#12312b",
    },
  },
};

export const brandGold = "#c8953f";
export const brandCream = "#fffaf1";
export const brandSiderText = "#c9d3ce";

/** ProLayout sider tokens — hover text must stay light on the dark #12312b background. */
export const proLayoutToken = {
  header: {
    heightLayoutHeader: 60,
  },
  sider: {
    colorMenuBackground: "#12312b",
    colorTextMenu: brandSiderText,
    colorTextMenuItemHover: brandCream,
    colorTextMenuSelected: brandCream,
    colorTextMenuTitle: brandCream,
    colorTextMenuSecondary: "#dfe8e4",
    colorBgMenuItemSelected: "rgba(200, 149, 63, 0.16)",
    colorBgMenuItemHover: "rgba(255, 255, 255, 0.06)",
    colorBgCollapsedButton: brandCream,
    colorTextCollapsedButton: "#12312b",
    colorTextCollapsedButtonHover: brandGold,
  },
} as const;
