"use client";

import {
  ProForm,
  ProFormDigit,
  ProFormItem,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { App, Button, Col, Input, Space, Upload } from "antd";
import { DeleteOutlined, LinkOutlined, UploadOutlined } from "@ant-design/icons";
import { useMemo } from "react";
import { AssetPreview } from "@/components/asset-preview";
import { FORBIDDEN_FIELD_KEYS } from "@/lib/content-rules";
import { validateInlineImageFile } from "@/lib/inline-image-upload";
import { getModuleFieldViewModels } from "@/lib/module-editor";
import type { ContentValue, FieldDefinition, HomeModuleRecord } from "@/types/cms";

type HomeModuleEditorProps = {
  module: HomeModuleRecord;
  onChange: (key: string, value: ContentValue) => void;
};

export function HomeModuleEditor({ module, onChange }: HomeModuleEditorProps) {
  const { message } = App.useApp();
  const fields = useMemo(
    () =>
      getModuleFieldViewModels(module).filter(
        (field) =>
          !FORBIDDEN_FIELD_KEYS.includes(
            field.definition.key as (typeof FORBIDDEN_FIELD_KEYS)[number],
          ),
      ),
    [module],
  );

  return (
    <ProForm
      key={module.id}
      layout="vertical"
      grid
      rowProps={{ gutter: [24, 0] }}
      colProps={{ xs: 24, lg: 12 }}
      submitter={false}
      initialValues={module.data}
      onValuesChange={(changedValues) => {
        const [key, value] = Object.entries(changedValues)[0] ?? [];
        if (key) {
          onChange(key, value as ContentValue);
        }
      }}
    >
      {fields.map((field) => (
        <FieldControl
          definition={field.definition}
          errors={field.errors}
          key={field.definition.key}
          name={field.definition.key}
          onUploadError={(error) => message.error(error)}
          value={field.value}
        />
      ))}
    </ProForm>
  );
}

type FieldControlProps = {
  definition: FieldDefinition;
  name: string;
  value: ContentValue | "";
  errors: string[];
  onUploadError: (error: string) => void;
};

function FieldControl({
  definition,
  name,
  value,
  errors,
  onUploadError,
}: FieldControlProps) {
  const rules = [
    ...(definition.required
      ? [{ required: true, message: `${definition.label} is required.` }]
      : []),
    ...(definition.maxLength
      ? [{ max: definition.maxLength, message: `${definition.label} is too long.` }]
      : []),
    ...(errors.length > 0 ? [{ message: errors[0] }] : []),
  ];

  const commonProps = {
    name,
    label: definition.label,
    rules,
    tooltip: definition.helper,
    colProps: { xs: 24, lg: definition.type === "textarea" ? 24 : 12 },
  };

  if (definition.type === "textarea") {
    return (
      <ProFormTextArea
        {...commonProps}
        fieldProps={{
          rows: 5,
          maxLength: definition.maxLength,
          showCount: Boolean(definition.maxLength),
          style: { resize: "vertical" },
        }}
      />
    );
  }

  if (definition.type === "toggle") {
    return (
      <ProFormSwitch
        {...commonProps}
        fieldProps={{
          checkedChildren: "Visible",
          unCheckedChildren: "Hidden",
        }}
      />
    );
  }

  if (definition.type === "select") {
    return (
      <ProFormSelect
        {...commonProps}
        options={(definition.options ?? []).map((option) => ({
          label: option,
          value: option,
        }))}
      />
    );
  }

  if (definition.type === "number") {
    return <ProFormDigit {...commonProps} />;
  }

  if (definition.type === "readonly") {
    return (
      <ProFormText
        {...commonProps}
        fieldProps={{ readOnly: true, value: String(value ?? "") }}
      />
    );
  }

  if (definition.type === "image") {
    const { colProps, name, label, rules, tooltip } = commonProps;
    const previewUrl = typeof value === "string" ? value : "";

    return (
      <Col {...colProps}>
        <ProFormItem name={name} label={label} rules={rules} tooltip={tooltip}>
          <InlineImageUpload
            alt={definition.label}
            fallbackValue={previewUrl}
            maxLength={definition.maxLength}
            onError={onUploadError}
            variant={definition.key.toLowerCase().includes("qr") ? "qr" : "image"}
          />
        </ProFormItem>
      </Col>
    );
  }

  if (definition.type === "link") {
    return (
      <ProFormText
        {...commonProps}
        fieldProps={{
          maxLength: definition.maxLength,
          prefix: <LinkOutlined />,
          placeholder: definition.key.toLowerCase().includes("phone") ? "tel:+1..." : "https://",
        }}
      />
    );
  }

  return (
    <ProFormText
      {...commonProps}
      fieldProps={{
        maxLength: definition.maxLength,
        showCount: Boolean(definition.maxLength),
      }}
    />
  );
}

type InlineImageUploadProps = {
  value?: string;
  onChange?: (value: string) => void;
  alt: string;
  fallbackValue: string;
  maxLength?: number;
  variant: "image" | "qr";
  onError: (error: string) => void;
};

function InlineImageUpload({
  value,
  onChange,
  alt,
  fallbackValue,
  maxLength,
  variant,
  onError,
}: InlineImageUploadProps) {
  const currentValue = value ?? fallbackValue;

  function handleImageSelection(file: File) {
    const validation = validateInlineImageFile(file);

    if (!validation.ok) {
      onError(validation.error);
      return Upload.LIST_IGNORE;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange?.(reader.result);
      }
    };
    reader.onerror = () => onError("Image could not be read");
    reader.readAsDataURL(file);

    return Upload.LIST_IGNORE;
  }

  return (
    <Space className="cms-inline-image-field" direction="vertical" size={12}>
      <Input
        maxLength={maxLength}
        placeholder="/images/example.jpg"
        value={currentValue}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <AssetPreview alt={alt} url={currentValue} variant={variant} />
      <Space className="cms-inline-image-actions" wrap>
        <Upload
          accept="image/*"
          beforeUpload={handleImageSelection}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />}>Choose Image</Button>
        </Upload>
        <Button
          disabled={!currentValue}
          icon={<DeleteOutlined />}
          onClick={() => onChange?.("")}
        >
          Remove Image
        </Button>
      </Space>
    </Space>
  );
}
