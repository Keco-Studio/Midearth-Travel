"use client";

import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type RegistrationValues = {
  email: string;
  password: string;
  confirmPassword: string;
};

const INVITATION_UNAVAILABLE = "This invitation is unavailable";

export function AdminRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(
    token ? null : INVITATION_UNAVAILABLE,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: RegistrationValues) {
    if (!token) {
      setError(INVITATION_UNAVAILABLE);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password, token }),
      });

      if (!response.ok) {
        setError(INVITATION_UNAVAILABLE);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError(INVITATION_UNAVAILABLE);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="cms-login-page">
      <Card className="cms-login-card">
        <div className="cms-login-brand" aria-hidden="true">MT</div>
        <Typography.Title level={1}>Administrator registration</Typography.Title>
        <Typography.Paragraph type="secondary">
          Set a password to activate your administrator account.
        </Typography.Paragraph>

        {error ? <Alert type="error" message={error} showIcon /> : null}

        <Form<RegistrationValues>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          className="cms-login-form"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Enter your email" },
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
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Enter a password" },
              { min: 12, message: "Use at least 12 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete="new-password"
              maxLength={256}
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  return !value || getFieldValue("password") === value
                    ? Promise.resolve()
                    : Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              autoComplete="new-password"
              maxLength={256}
              size="large"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block size="large">
            Create account
          </Button>
        </Form>
      </Card>
    </main>
  );
}
