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
  onSaved: (settings: SiteSettings) => void;
};

export function SettingsPanel({ settings, onSaved }: SettingsPanelProps) {
  const { message } = App.useApp();

  const initialValues: SettingsFormValues = {
    siteName: settings.siteName,
    tagline: settings.tagline,
    primaryPhoneLabel: settings.primaryPhoneLabel,
    primaryPhoneHref: settings.primaryPhoneHref,
    secondaryPhoneLabel: settings.secondaryPhoneLabel,
    secondaryPhoneHref: settings.secondaryPhoneHref,
    emailLabel: settings.emailLabel,
    emailHref: settings.emailHref,
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
      onFinish={async (values) => {
        try {
          const response = await fetch("/api/admin/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: values }),
          });
          const payload = await readResponse<{ settings: SiteSettings }>(response);
          onSaved(payload.settings);
          message.success("Global settings saved to Supabase");
          return true;
        } catch (error) {
          message.error(
            error instanceof Error ? error.message : "Global settings could not be saved",
          );
          return false;
        }
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

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status})`);
  }

  return payload;
}
