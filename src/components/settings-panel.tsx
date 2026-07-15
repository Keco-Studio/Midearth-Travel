"use client";

import {
  ProForm,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { App } from "antd";
import type { SiteSettings } from "@/types/cms";

type SettingsFormValues = {
  siteName: string;
  tagline: string;
  primaryPhoneLabel: string;
  primaryPhoneHref: string;
  secondaryPhoneLabel: string;
  secondaryPhoneHref: string;
  emailLabel: string;
  emailHref: string;
  officeAddress: string;
};

type SettingsPanelProps = {
  settings: SiteSettings;
};

export function SettingsPanel({ settings }: SettingsPanelProps) {
  const { message } = App.useApp();

  const initialValues: SettingsFormValues = {
    siteName: settings.siteName,
    tagline: "Travel · Ottawa",
    primaryPhoneLabel: settings.primaryPhone,
    primaryPhoneHref: "tel:+16132365226",
    secondaryPhoneLabel: "613-236-2323",
    secondaryPhoneHref: "tel:+16132362323",
    emailLabel: settings.email,
    emailHref: `mailto:${settings.email}`,
    officeAddress: settings.officeAddress,
  };

  return (
    <ProForm<SettingsFormValues>
      initialValues={initialValues}
      layout="vertical"
      style={{ maxWidth: 640 }}
      submitter={{
        searchConfig: { submitText: "Save" },
        resetButtonProps: false,
      }}
      onFinish={async () => {
        message.success("Settings saved");
        return true;
      }}
    >
      <ProFormText
        name="siteName"
        label="Site name"
        rules={[
          { required: true, message: "Site name is required." },
          { max: 40, message: "Site name must be 40 characters or fewer." },
        ]}
      />
      <ProFormText
        name="tagline"
        label="Tagline"
        rules={[{ max: 60, message: "Tagline must be 60 characters or fewer." }]}
      />
      <ProFormText
        name="primaryPhoneLabel"
        label="Primary phone label"
        rules={[
          { required: true, message: "Primary phone label is required." },
          { max: 30, message: "Primary phone label must be 30 characters or fewer." },
        ]}
      />
      <ProFormText
        name="primaryPhoneHref"
        label="Primary phone href"
        rules={[
          { required: true, message: "Primary phone href is required." },
          {
            pattern: /^tel:/,
            message: "Primary phone href must start with tel:",
          },
        ]}
      />
      <ProFormText
        name="secondaryPhoneLabel"
        label="Secondary phone label"
        rules={[{ max: 30, message: "Secondary phone label must be 30 characters or fewer." }]}
      />
      <ProFormText
        name="secondaryPhoneHref"
        label="Secondary phone href"
        rules={[
          {
            pattern: /^tel:/,
            message: "Secondary phone href must start with tel:",
          },
        ]}
      />
      <ProFormText
        name="emailLabel"
        label="Email label"
        rules={[
          { required: true, message: "Email label is required." },
          { max: 80, message: "Email label must be 80 characters or fewer." },
        ]}
      />
      <ProFormText
        name="emailHref"
        label="Email href"
        rules={[
          { required: true, message: "Email href is required." },
          {
            pattern: /^mailto:/,
            message: "Email href must start with mailto:",
          },
        ]}
      />
      <ProFormTextArea
        name="officeAddress"
        label="Office address"
        fieldProps={{ rows: 3 }}
        rules={[{ max: 160, message: "Office address must be 160 characters or fewer." }]}
      />
    </ProForm>
  );
}
