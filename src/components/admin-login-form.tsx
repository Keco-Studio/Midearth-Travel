"use client";

import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ADMIN_LOGIN_EMAIL_MAX_LENGTH,
  ADMIN_LOGIN_PASSWORD_MAX_LENGTH,
} from "@/lib/admin-login-input";

type LoginValues = {
  email: string;
  password: string;
};

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: LoginValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to sign in");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="cms-login-page">
      <Card className="cms-login-card">
        <div className="cms-login-brand" aria-hidden="true">MT</div>
        <Typography.Title level={1}>Midearth CMS</Typography.Title>
        <Typography.Paragraph type="secondary">
          Sign in with your administrator account.
        </Typography.Paragraph>

        {error ? <Alert type="error" message={error} showIcon /> : null}

        <Form<LoginValues>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          className="cms-login-form"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Enter your email" }]}
          >
            <Input
              prefix={<MailOutlined />}
              autoComplete="username"
              inputMode="email"
              maxLength={ADMIN_LOGIN_EMAIL_MAX_LENGTH}
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Enter your password" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete="current-password"
              maxLength={ADMIN_LOGIN_PASSWORD_MAX_LENGTH}
              size="large"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block size="large">
            Sign in
          </Button>
        </Form>
      </Card>
    </main>
  );
}
