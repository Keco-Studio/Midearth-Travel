"use client";

import { CopyOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Form, Input, Tooltip, Typography } from "antd";
import { useState } from "react";

type InviteValues = {
  email: string;
};

export function AdminInviteForm() {
  const { message } = App.useApp();
  const [form] = Form.useForm<InviteValues>();
  const [error, setError] = useState<string | null>(null);
  const [registrationUrl, setRegistrationUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: InviteValues) {
    setSubmitting(true);
    setError(null);
    setRegistrationUrl(null);

    try {
      const response = await fetch("/api/admin/auth/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; registrationUrl?: string }
        | null;

      if (!response.ok || !payload?.registrationUrl) {
        setError(payload?.error ?? "Unable to create invitation");
        return;
      }

      setRegistrationUrl(payload.registrationUrl);
    } catch {
      setError("Unable to create invitation");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyRegistrationUrl() {
    if (!registrationUrl) return;

    try {
      await navigator.clipboard.writeText(registrationUrl);
      message.success("Invitation link copied");
    } catch {
      message.error("Unable to copy invitation link");
    }
  }

  return (
    <main className="cms-login-page">
      <Card className="cms-login-card">
        <div className="cms-login-brand" aria-hidden="true">MT</div>
        <Typography.Title level={1}>Invite administrator</Typography.Title>
        <Typography.Paragraph type="secondary">
          Create a one-time registration link for a new administrator.
        </Typography.Paragraph>

        {error ? <Alert type="error" message={error} showIcon /> : null}

        <Form<InviteValues>
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          className="cms-login-form"
        >
          <Form.Item
            name="email"
            label="Administrator email"
            rules={[
              { required: true, message: "Enter an email address" },
              { type: "email", message: "Enter a valid email address" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              size="large"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block size="large">
            Create invitation
          </Button>
        </Form>

        {registrationUrl ? (
          <div className="cms-invitation-link">
            <Typography.Paragraph type="secondary">
              Send this link manually. It expires in 7 days and works once.
            </Typography.Paragraph>
            <Input
              aria-label="Administrator registration link"
              readOnly
              value={registrationUrl}
              addonAfter={
                <Tooltip title="Copy invitation link">
                  <Button
                    aria-label="Copy invitation link"
                    icon={<CopyOutlined />}
                    onClick={copyRegistrationUrl}
                    type="text"
                  />
                </Tooltip>
              }
            />
          </div>
        ) : null}
      </Card>
    </main>
  );
}
