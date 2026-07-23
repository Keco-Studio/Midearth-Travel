"use client";

import {
  DeleteOutlined,
  FilePdfOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  Form,
  Image,
  Input,
  Row,
  Space,
  Switch,
  Typography,
  Upload,
  Select,
} from "antd";
import { useState } from "react";
import type { ReactNode } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TourTypeAutoComplete } from "@/components/tour-type-autocomplete";
import { validateInlineImageFile } from "@/lib/inline-image-upload";
import type { TourRecord } from "@/types/cms";

type TourEditorProps = {
  tour: TourRecord;
  tourTypeOptions: string[];
  onCancel: () => void;
  onUpdate: (tour: TourRecord) => void;
  onImageUpload: (file: File) => Promise<string>;
};

const statusOptions = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "unpublished", label: "Unpublished" },
];

const requiredRules = {
  title: [{ required: true, whitespace: true, message: "Enter an English title" }],
  slug: [{ required: true, whitespace: true, message: "Enter a slug" }],
  region: [{ required: true, whitespace: true, message: "Enter a region" }],
  duration: [{ required: true, whitespace: true, message: "Enter an English duration" }],
  tourType: [{ required: true, whitespace: true, message: "Enter or select a tour type" }],
};

export function TourEditor({
  tour,
  tourTypeOptions,
  onCancel,
  onUpdate,
  onImageUpload,
}: TourEditorProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<TourRecord>();
  const [imagePreview, setImagePreview] = useState(tour.image || "/file.svg");
  const [pdfFileName, setPdfFileName] = useState(tour.pdfFileName);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleImageSelection(file: File) {
    const validation = validateInlineImageFile(file);
    if (!validation.ok) {
      message.error(validation.error);
      return;
    }

    setUploadingImage(true);
    try {
      const url = await onImageUpload(file);
      setImagePreview(url);
      form.setFieldValue("image", url);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Tour image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage() {
    setImagePreview("/file.svg");
    form.setFieldValue("image", "");
  }

  function handlePdfSelection(file: File) {
    setPdfFileName(file.name);
    form.setFieldValue("pdfFileName", file.name);
    return Upload.LIST_IGNORE;
  }

  function removePdf() {
    setPdfFileName("");
    form.setFieldValue("pdfFileName", "");
  }

  return (
    <div className="cms-tour-editor">
      <Form<TourRecord>
        className="cms-tour-editor-form"
        form={form}
        layout="vertical"
        initialValues={tour}
        requiredMark="optional"
        onFinish={onUpdate}
      >
        <Form.Item name="image" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="pdfFileName" hidden>
          <Input />
        </Form.Item>

        <EditorSection title="Tour information">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item name="title" label="Title (English)" rules={requiredRules.title}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedTitle" label="Title (Chinese)">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="slug" label="Slug" rules={requiredRules.slug}>
                <Input readOnly />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="code" label="Tour code">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="tourType" label="Tour type" rules={requiredRules.tourType}>
                <TourTypeAutoComplete options={tourTypeOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="region" label="Package region" rules={requiredRules.region}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="subregion" label="Package subregion">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </EditorSection>

        <EditorSection title="Schedule and highlights">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item name="departures" label="Departure dates (English)">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedDepartures" label="Departure dates (Chinese)">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="highlights" label="Highlights (English)">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedHighlights" label="Highlights (Chinese)">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="duration" label="Duration (English)" rules={requiredRules.duration}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedDuration" label="Duration (Chinese)">
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </EditorSection>

        <EditorSection title="Pricing">
          <Row gutter={[16, 0]} className="cms-tour-editor-price-grid">
            <PriceField name="child" label="Child" />
            <PriceField name="single" label="Single" />
            <PriceField name="double" label="Double" />
            <PriceField name="triple" label="Triple" />
            <PriceField name="quad" label="Quad" />
          </Row>
        </EditorSection>

        <EditorSection title="Tour descriptions">
          <Form.Item name="description" label="Description (English)">
            <RichTextEditor />
          </Form.Item>
          <Form.Item name="localizedDescription" label="Description (Chinese)">
            <RichTextEditor />
          </Form.Item>
        </EditorSection>

        <EditorSection title="Media and PDF">
          <Row gutter={[24, 16]} align="top" className="cms-tour-editor-media-grid">
            <Col xs={24} lg={10}>
              <Typography.Text className="cms-tour-editor-field-label">Tour image</Typography.Text>
              <div className="cms-tour-editor-image-preview">
                <Image
                  src={imagePreview}
                  fallback="/file.svg"
                  alt={`${tour.title} preview`}
                  preview={false}
                />
              </div>
              <Space wrap>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  disabled={uploadingImage}
                  beforeUpload={(file) => {
                    void handleImageSelection(file);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingImage}>
                    Upload image
                  </Button>
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  disabled={uploadingImage}
                  onClick={removeImage}
                >
                  Remove image
                </Button>
              </Space>
            </Col>
            <Col xs={24} lg={14}>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item name="pdfTitle" label="PDF title (English)">
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="localizedPdfTitle" label="PDF title (Chinese)">
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Typography.Text className="cms-tour-editor-field-label">Tour PDF</Typography.Text>
              <div className="cms-tour-editor-file-row">
                <FilePdfOutlined />
                <Typography.Text ellipsis title={pdfFileName || "No PDF selected"}>
                  {pdfFileName || "No PDF selected"}
                </Typography.Text>
              </div>
              <Space wrap>
                <Upload
                  accept="application/pdf"
                  showUploadList={false}
                  beforeUpload={handlePdfSelection}
                >
                  <Button icon={<UploadOutlined />}>Choose PDF</Button>
                </Upload>
                <Button icon={<DeleteOutlined />} disabled={!pdfFileName} onClick={removePdf}>
                  Remove PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </EditorSection>

        <EditorSection title="Publishing and categories">
          <Row gutter={[16, 8]} className="cms-tour-editor-publishing-grid">
            <ToggleField name="specialOffer" label="Special offer package" />
            <ToggleField name="specialDeals" label="Special deals package" />
            <ToggleField name="vacationPackage" label="Vacation package" />
            <ToggleField name="travelNewsPackage" label="Travel news package" />
            <ToggleField name="busTourPackage" label="Bus tour package" />
            <Col xs={24} md={12} lg={8} className="cms-tour-editor-publishing-controls">
              <Form.Item name="status" label="Status">
                <Select options={statusOptions} />
              </Form.Item>
              <Form.Item label="Order">
                <Input defaultValue="1" inputMode="numeric" />
              </Form.Item>
            </Col>
          </Row>
        </EditorSection>

        <div className="cms-tour-editor-actions">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" className="cms-primary-action">
            Update
          </Button>
        </div>
      </Form>
    </div>
  );
}

function EditorSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cms-tour-editor-section">
      <div className="cms-tour-editor-section-heading">
        <span className="cms-tour-editor-section-marker" aria-hidden="true" />
        <Typography.Title level={5}>{title}</Typography.Title>
      </div>
      <div className="cms-tour-editor-section-body">{children}</div>
    </section>
  );
}

function PriceField({ name, label }: { name: keyof TourRecord["fares"]; label: string }) {
  return (
    <Col xs={24} sm={12} lg={8} xl={4}>
      <Form.Item name={["fares", name]} label={`${label} price`}>
        <Input />
      </Form.Item>
    </Col>
  );
}

function ToggleField({
  name,
  label,
}: {
  name:
    | "specialOffer"
    | "specialDeals"
    | "vacationPackage"
    | "travelNewsPackage"
    | "busTourPackage";
  label: string;
}) {
  return (
    <Col xs={24} md={12} lg={8}>
      <Form.Item
        name={name}
        label={label}
        valuePropName="checked"
        className="cms-tour-editor-toggle"
      >
        <Switch checkedChildren="Yes" unCheckedChildren="No" />
      </Form.Item>
    </Col>
  );
}
