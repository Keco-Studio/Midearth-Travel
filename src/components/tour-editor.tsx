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
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { TourTypeAutoComplete } from "@/components/tour-type-autocomplete";
import {
  applyDestinationCategoryAssignments,
  resolveTourDestinationCategoryIds,
} from "@/lib/tour-destination-categories";
import type { DestinationCategory } from "@/lib/destination-categories";
import { destinationCategorySeeds } from "@/lib/destination-categories";
import { validateInlineImageFile } from "@/lib/inline-image-upload";
import type { TourRecord } from "@/types/cms";

type TourEditorProps = {
  tour: TourRecord;
  tourTypeOptions: string[];
  destinationCategories?: DestinationCategory[];
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
  duration: [{ required: true, whitespace: true, message: "Enter an English duration" }],
  tourType: [{ required: true, whitespace: true, message: "Enter or select a tour type" }],
};

export function TourEditor({
  tour,
  tourTypeOptions,
  destinationCategories = destinationCategorySeeds,
  onCancel,
  onUpdate,
  onImageUpload,
}: TourEditorProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<TourRecord>();
  const [imagePreview, setImagePreview] = useState(tour.image || "/file.svg");
  const [pdfFileName, setPdfFileName] = useState(tour.pdfFileName);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const initialValues = useMemo(
    () => ({
      ...tour,
      destinationCategoryIds: resolveTourDestinationCategoryIds(tour),
    }),
    [tour],
  );

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

  async function handlePdfSelection(file: File) {
    if (!file.type.toLocaleLowerCase("en").includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      message.error("Select a PDF file");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 20 * 1024 * 1024) {
      message.error("PDF must be 20 MB or smaller");
      return Upload.LIST_IGNORE;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.set("slug", tour.slug);
      formData.set("kind", "pdf");
      formData.set("file", file);
      const response = await fetch("/api/admin/tours/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Tour PDF upload failed");
      }
      setPdfFileName(payload.url);
      form.setFieldValue("pdfFileName", payload.url);
      message.success("PDF uploaded");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Tour PDF upload failed");
    } finally {
      setUploadingPdf(false);
    }
    return Upload.LIST_IGNORE;
  }

  function removePdf() {
    setPdfFileName("");
    form.setFieldValue("pdfFileName", "");
  }

  function handleFinish(values: TourRecord) {
    const merged: TourRecord = {
      ...tour,
      ...values,
      essentials: {
        ...tour.essentials,
        ...values.essentials,
      },
      fares: {
        ...tour.fares,
        ...values.fares,
      },
      destinationCategoryIds:
        values.destinationCategoryIds ?? tour.destinationCategoryIds ?? [],
    };
    onUpdate(applyDestinationCategoryAssignments(merged, destinationCategories));
  }

  return (
    <div className="cms-tour-editor">
      <Form<TourRecord>
        className="cms-tour-editor-form"
        form={form}
        layout="vertical"
        initialValues={initialValues}
        requiredMark="optional"
        onFinish={handleFinish}
      >
        <Form.Item name="image" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="pdfFileName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="region" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="destinationCategoryIds" hidden>
          <Select mode="multiple" options={[]} />
        </Form.Item>
        <Form.Item name="busTourPackage" valuePropName="checked" hidden>
          <Switch />
        </Form.Item>
        <Form.Item name="vacationPackage" valuePropName="checked" hidden>
          <Switch />
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

        <EditorSection title="Trip essentials">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item name="departureCity" label="Departure city (English)">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedDepartureCity" label="Departure city (Chinese)">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name={["essentials", "departureTime"]} label="Departure time">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12} />
            <Col xs={24} lg={12}>
              <Form.Item name={["essentials", "meetingPlace"]} label="Meeting place (English)">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name={["essentials", "localizedMeetingPlace"]}
                label="Meeting place (Chinese)"
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name={["essentials", "hotels"]} label="Hotels (English)">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name={["essentials", "localizedHotels"]}
                label="Hotels (Chinese)"
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name={["essentials", "escortedCoach"]}
                label="Escorted coach (English)"
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name={["essentials", "localizedEscortedCoach"]}
                label="Escorted coach (Chinese)"
              >
                <Input.TextArea rows={3} />
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

        <EditorSection title="Policies and exclusions">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item name="admissions" label="Admissions (English)">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedAdmissions" label="Admissions (Chinese)">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="cancellation" label="Cancellation (English)">
                <Input.TextArea rows={5} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedCancellation" label="Cancellation (Chinese)">
                <Input.TextArea rows={5} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="importantNotice" label="Important notice (English)">
                <Input.TextArea rows={5} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="localizedImportantNotice"
                label="Important notice (Chinese)"
              >
                <Input.TextArea rows={5} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="included" label="Included (English)">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedIncluded" label="Included (Chinese)">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="notIncluded" label="Not included (English)">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="localizedNotIncluded" label="Not included (Chinese)">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
          </Row>
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
              <Form.Item
                name="galleryImages"
                label="Gallery images"
                style={{ marginTop: 16 }}
                extra="One image URL per line. Cover image is always first on the tour page."
              >
                <Input.TextArea rows={4} placeholder={"https://...\n/path/to/image.jpg"} />
              </Form.Item>
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
                  accept="application/pdf,.pdf"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void handlePdfSelection(file);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingPdf}>
                    Upload PDF
                  </Button>
                </Upload>
                <Button
                  icon={<DeleteOutlined />}
                  disabled={!pdfFileName || uploadingPdf}
                  onClick={removePdf}
                >
                  Remove PDF
                </Button>
              </Space>
            </Col>
          </Row>
        </EditorSection>

        <EditorSection title="Publishing and categories">
          <Row gutter={[16, 8]} className="cms-tour-editor-publishing-grid">
            <ToggleField
              name="specialOffer"
              label="Our Top Picks"
              tooltip="Show this tour on the homepage Our Top Picks section. No limit on how many can be featured."
            />
            <ToggleField name="specialDeals" label="Hot sale" />
            <ToggleField
              name="travelNewsPackage"
              label="Explore by Month package"
              tooltip="Mark tours that should be offered as Explore-by-Month destinations."
            />
            <Col span={24}>
              <Typography.Text type="secondary">
                Where to Go — linked to Destination names (rename there and labels update here)
              </Typography.Text>
            </Col>
            <DestinationCategoryToggles categories={destinationCategories} />
            <Col xs={24} md={12} lg={8} className="cms-tour-editor-publishing-controls">
              <Form.Item name="status" label="Status">
                <Select options={statusOptions} />
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
  tooltip,
}: {
  name: "specialOffer" | "specialDeals" | "travelNewsPackage";
  label: string;
  tooltip?: string;
}) {
  return (
    <Col xs={24} md={12} lg={8}>
      <Form.Item
        name={name}
        label={label}
        tooltip={tooltip}
        valuePropName="checked"
        className="cms-tour-editor-toggle"
      >
        <Switch checkedChildren="Yes" unCheckedChildren="No" />
      </Form.Item>
    </Col>
  );
}

function DestinationCategoryToggles({
  categories,
}: {
  categories: DestinationCategory[];
}) {
  const form = Form.useFormInstance<TourRecord>();
  const selected = (Form.useWatch("destinationCategoryIds", form) as string[] | undefined) ?? [];

  return (
    <>
      {categories.map((category) => {
        const checked = selected.includes(category.id);
        return (
          <Col xs={24} md={12} lg={8} key={category.id}>
            <Form.Item
              label={category.titleEn}
              tooltip="Synced with Destination names in the homepage Category Grid module"
              className="cms-tour-editor-toggle"
            >
              <Switch
                checked={checked}
                checkedChildren="Yes"
                unCheckedChildren="No"
                onChange={(nextChecked) => {
                  const nextIds = nextChecked
                    ? [...selected, category.id]
                    : selected.filter((id) => id !== category.id);
                  form.setFieldValue("destinationCategoryIds", [...new Set(nextIds)]);
                }}
              />
            </Form.Item>
          </Col>
        );
      })}
    </>
  );
}
