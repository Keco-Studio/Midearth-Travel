"use client";

import { LogoutOutlined, UserAddOutlined } from "@ant-design/icons";
import { App, Avatar, Button, Dropdown, type MenuProps, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminAccountMenuProps = {
  email: string;
};

export function AdminAccountMenu({ email }: AdminAccountMenuProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const menuItems: MenuProps["items"] = [
    {
      key: "email",
      disabled: true,
      label: email,
    },
    {
      key: "invite",
      icon: <UserAddOutlined />,
      label: "Invite administrator",
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log out",
    },
  ];

  async function handleMenuClick({ key }: { key: string }) {
    if (key === "invite") {
      router.push("/admin/invite");
      return;
    }

    if (key !== "logout") return;

    setLoggingOut(true);
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      message.error("Unable to log out");
      setLoggingOut(false);
    }
  }

  return (
    <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={["click"]}>
      <Tooltip title="Administrator account">
        <Button
          aria-label="Administrator account menu"
          loading={loggingOut}
          shape="circle"
          type="text"
        >
          <Avatar style={{ background: "#12312b", color: "#fffaf1" }}>
            {email.slice(0, 1).toUpperCase()}
          </Avatar>
        </Button>
      </Tooltip>
    </Dropdown>
  );
}
