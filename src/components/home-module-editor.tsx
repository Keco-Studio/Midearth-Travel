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
import { useCallback, useMemo, useState } from "react";
import { AssetPreview } from "@/components/asset-preview";
import { DestinationCategoryEditor } from "@/components/destination-category-editor";
import { FooterLinksEditor } from "@/components/footer-links-editor";
import { ServiceCardsEditor, TestimonialsEditor } from "@/components/home-collection-editors";
import { FORBIDDEN_FIELD_KEYS } from "@/lib/content-rules";
import { FOOTER_LINK_FIELD_KEYS } from "@/lib/footer-links";
import { validateInlineImageFile } from "@/lib/inline-image-upload";
import { getHomeModuleEditorKey, getModuleFieldViewModels } from "@/lib/module-editor";
import type { DestinationCategory } from "@/lib/destination-categories";
import type { Service } from "@/data/services";
import type { Testimonial } from "@/data/testimonials";
import type { ContentValue, FieldDefinition, HomeModuleRecord } from "@/types/cms";

type HomeModuleEditorProps = {
  module: HomeModuleRecord;
  onChange: (key: string, value: ContentValue) => void;
  onImageUpload: (fieldKey: string, file: File) => Promise<string>;
  onSupplementalDirtyChange: (
    moduleId: HomeModuleRecord["id"],
    dirty: boolean,
  ) => void;
  destinationCategories: DestinationCategory[];
  services: Service[];
  testimonials: Testimonial[];
  onDestinationCategoriesChange: (categories: DestinationCategory[]) => void;
  onServicesChange: (services: Service[]) => void;
  onTestimonialsChange: (testimonials: Testimonial[]) => void;
};

export function HomeModuleEditor({
  module,
  onChange,
  onImageUpload,
  onSupplementalDirtyChange,
  destinationCategories,
  services,
  testimonials,
  onDestinationCategoriesChange,
  onServicesChange,
  onTestimonialsChange,
}: HomeModuleEditorProps) {
  const { message } = App.useApp();
  const fields = useMemo(
    () =>
      getModuleFieldViewModels(module).filter(
        (field) =>
          !FORBIDDEN_FIELD_KEYS.includes(
            field.definition.key as (typeof FORBIDDEN_FIELD_KEYS)[number],
          ) &&
          !(
            module.id === "footer" &&
            FOOTER_LINK_FIELD_KEYS.includes(
              field.definition.key as (typeof FOOTER_LINK_FIELD_KEYS)[number],
            )
          ),
      ),
    [module],
  );
  const setSupplementalDirty = useCallback(
    (dirty: boolean) => onSupplementalDirtyChange(module.id, dirty),
    [module.id, onSupplementalDirtyChange],
  );

  return (
    <>
      <ProForm
      key={getHomeModuleEditorKey(module)}
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
            onImageUpload={onImageUpload}
            value={field.value}
          />
        ))}
      </ProForm>
      {module.id === "categoryGrid" ? (
        <DestinationCategoryEditor
          categories={destinationCategories}
          onDirtyChange={setSupplementalDirty}
          onChange={onDestinationCategoriesChange}
        />
      ) : null}
      {module.id === "aboutSection" ? (
        <ServiceCardsEditor
          records={services}
          onDirtyChange={setSupplementalDirty}
          onChange={onServicesChange}
        />
      ) : null}
      {module.id === "testimonials" ? (
        <TestimonialsEditor
          records={testimonials}
          onDirtyChange={setSupplementalDirty}
          onChange={onTestimonialsChange}
        />
      ) : null}
      {module.id === "footer" ? (
        <FooterLinksEditor content={module.data} onChange={onChange} />
      ) : null}
    </>
  );
}

type FieldControlProps = {
  definition: FieldDefinition;
  name: string;
  value: ContentValue | "";
  errors: string[];
  onUploadError: (error: string) => void;
  onImageUpload: (fieldKey: string, file: File) => Promise<string>;
};

function FieldControl({
  definition,
  name,
  value,
  errors,
  onUploadError,
  onImageUpload,
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
            onUpload={(file) => onImageUpload(definition.key, file)}
            variant={
              definition.key.toLowerCase().includes("qr")
                ? "qr"
                : definition.key.toLowerCase().includes("iconimage")
                  ? "icon"
                  : "image"
            }
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
  variant: "image" | "icon" | "qr";
  onError: (error: string) => void;
  onUpload: (file: File) => Promise<string>;
};

function InlineImageUpload({
  value,
  onChange,
  alt,
  fallbackValue,
  maxLength,
  variant,
  onError,
  onUpload,
}: InlineImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const currentValue = value ?? fallbackValue;

  async function handleImageSelection(file: File) {
    const validation = validateInlineImageFile(file);

    if (!validation.ok) {
      onError(validation.error);
      return;
    }

    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange?.(url);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
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
          beforeUpload={(file) => {
            void handleImageSelection(file);
            return Upload.LIST_IGNORE;
          }}
          disabled={uploading}
          showUploadList={false}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            Upload Image
          </Button>
        </Upload>
        <Button
          disabled={!currentValue || uploading}
          icon={<DeleteOutlined />}
          onClick={() => onChange?.("")}
        >
          Remove Image
        </Button>
      </Space>
    </Space>
  );
}
