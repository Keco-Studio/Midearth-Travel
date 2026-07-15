"use client";

import {
  DeleteOutlined,
  FilePdfOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  Image,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  Upload,
} from "antd";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { TourRecord } from "@/types/cms";

type TourEditorProps = {
  tour: TourRecord;
  tourTypeOptions: string[];
  onCancel: () => void;
  onUpdate: (tour: TourRecord) => void;
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
  tourType: [{ required: true, message: "Select a tour type" }],
};

export function TourEditor({ tour, tourTypeOptions, onCancel, onUpdate }: TourEditorProps) {
  const [form] = Form.useForm<TourRecord>();
  const [imagePreview, setImagePreview] = useState(tour.image || "/file.svg");
  const [pdfFileName, setPdfFileName] = useState(tour.pdfFileName);
  const temporaryImageUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (temporaryImageUrl.current) {
        URL.revokeObjectURL(temporaryImageUrl.current);
      }
    },
    [],
  );

  function handleImageSelection(file: File) {
    if (temporaryImageUrl.current) {
      URL.revokeObjectURL(temporaryImageUrl.current);
    }

    const previewUrl = URL.createObjectURL(file);
    temporaryImageUrl.current = previewUrl;
    setImagePreview(previewUrl);
    form.setFieldValue("image", previewUrl);
    return Upload.LIST_IGNORE;
  }

  function removeImage() {
    if (temporaryImageUrl.current) {
      URL.revokeObjectURL(temporaryImageUrl.current);
      temporaryImageUrl.current = null;
    }

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
                <Select options={tourTypeOptions.map((value) => ({ value, label: value }))} />
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
          <Row gutter={[16, 0]}>
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
          <Row gutter={[24, 16]} align="top">
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
                <Upload accept="image/*" showUploadList={false} beforeUpload={handleImageSelection}>
                  <Button icon={<UploadOutlined />}>Choose image</Button>
                </Upload>
                <Button icon={<DeleteOutlined />} onClick={removeImage}>
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
          <Row gutter={[16, 8]}>
            <ToggleField name="specialOffer" label="Special offer package" />
            <ToggleField name="specialDeals" label="Special deals package" />
            <ToggleField name="vacationPackage" label="Vacation package" />
            <ToggleField name="travelNewsPackage" label="Travel news package" />
            <ToggleField name="busTourPackage" label="Bus tour package" />
            <Col xs={24} md={12} lg={8}>
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
      <Typography.Title level={5}>{title}</Typography.Title>
      {children}
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
      <Form.Item name={name} label={label} valuePropName="checked">
        <Switch checkedChildren="Yes" unCheckedChildren="No" />
      </Form.Item>
    </Col>
  );
}
