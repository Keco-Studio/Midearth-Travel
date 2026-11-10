"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Switch,
  Tooltip,
  Typography,
  Upload,
} from "antd";
import { useMemo, useState } from "react";
import { AssetPreview } from "@/components/asset-preview";
import {
  createEmptyHeroSlide,
  HERO_SLIDES_DATA_KEY,
  moveHeroSlide,
  parseHeroSlides,
  type HeroSlide,
  type HeroSlideFocalPoint,
  withHeroSlides,
} from "@/lib/hero-slides";
import { validateInlineImageFile } from "@/lib/inline-image-upload";
import type { ContentData } from "@/lib/content-values";
import type { ContentValue, TourRecord } from "@/types/cms";

type HeroSlidesEditorProps = {
  content: ContentData;
  tours: TourRecord[];
  onChange: (key: string, value: ContentValue) => void;
  onImageUpload: (fieldKey: string, file: File) => Promise<string>;
};

const focalPointOptions: Array<{ label: string; value: HeroSlideFocalPoint }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

export function HeroSlidesEditor({
  content,
  tours,
  onChange,
  onImageUpload,
}: HeroSlidesEditorProps) {
  const { message } = App.useApp();
  const [uploadingSlideId, setUploadingSlideId] = useState<string | null>(null);
  const slides = parseHeroSlides(content);
  const tourOptions = useMemo(
    () =>
      tours
        .filter((tour) => tour.status === "published")
        .sort((left, right) => left.title.localeCompare(right.title))
        .map((tour) => ({
          label: `${tour.title} (${tour.slug})`,
          value: tour.slug,
        })),
    [tours],
  );

  function commit(next: HeroSlide[]) {
    const nextContent = withHeroSlides(content, next);
    onChange(HERO_SLIDES_DATA_KEY, nextContent[HERO_SLIDES_DATA_KEY]);
    if (
      nextContent.backgroundImage !== content.backgroundImage &&
      typeof nextContent.backgroundImage === "string"
    ) {
      onChange("backgroundImage", nextContent.backgroundImage);
    }
  }

  function updateSlide(id: string, patch: Partial<HeroSlide>) {
    commit(
      slides.map((slide) =>
        slide.id === id ? { ...slide, ...patch } : slide,
      ),
    );
  }

  async function uploadSlideImage(slide: HeroSlide, file: File) {
    const validation = validateInlineImageFile(file);
    if (!validation.ok) {
      message.error(validation.error);
      return;
    }

    setUploadingSlideId(slide.id);
    try {
      const url = await onImageUpload(`slide-${slide.id}`, file);
      updateSlide(slide.id, { image: url });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setUploadingSlideId(null);
    }
  }

  return (
    <section style={{ marginTop: 8 }}>
      <Space
        align="start"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}
      >
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Background slides
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Slides rotate in this order. Only enabled slides with images are published.
          </Typography.Paragraph>
        </div>
        <Button
          icon={<PlusOutlined />}
          onClick={() => commit([...slides, createEmptyHeroSlide()])}
          type="primary"
        >
          Add slide
        </Button>
      </Space>

      <div style={{ display: "grid", gap: 12 }}>
        {slides.map((slide, index) => {
          const uploading = uploadingSlideId === slide.id;

          return (
            <article
              key={slide.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: 20,
                padding: 16,
                border: "1px solid #e8e2d4",
                borderRadius: 8,
                background: "#fffdf8",
              }}
            >
              <div style={{ display: "grid", alignContent: "start", gap: 10 }}>
                <Space style={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography.Text strong>
                    Slide {String(index + 1).padStart(2, "0")}
                  </Typography.Text>
                  <Space size={4}>
                    <Tooltip title="Move up">
                      <Button
                        aria-label={`Move slide ${index + 1} up`}
                        disabled={index === 0}
                        icon={<ArrowUpOutlined />}
                        onClick={() => commit(moveHeroSlide(slides, slide.id, "up"))}
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Move down">
                      <Button
                        aria-label={`Move slide ${index + 1} down`}
                        disabled={index === slides.length - 1}
                        icon={<ArrowDownOutlined />}
                        onClick={() => commit(moveHeroSlide(slides, slide.id, "down"))}
                        size="small"
                      />
                    </Tooltip>
                    <Popconfirm
                      cancelText="Keep slide"
                      okButtonProps={{ danger: true }}
                      okText="Delete"
                      onConfirm={() => commit(slides.filter((item) => item.id !== slide.id))}
                      title="Delete this slide?"
                    >
                      <Tooltip title="Delete slide">
                        <Button
                          aria-label={`Delete slide ${index + 1}`}
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                </Space>

                <div style={{ aspectRatio: "16 / 9", overflow: "hidden" }}>
                  <AssetPreview
                    alt={`Hero slide ${index + 1}`}
                    url={slide.image}
                    variant="image"
                  />
                </div>
                <Input
                  aria-label={`Slide ${index + 1} image URL`}
                  onChange={(event) => updateSlide(slide.id, { image: event.target.value })}
                  placeholder="Upload an image or enter its URL"
                  value={slide.image}
                />
                <Upload
                  accept="image/*"
                  beforeUpload={(file) => {
                    void uploadSlideImage(slide, file);
                    return Upload.LIST_IGNORE;
                  }}
                  disabled={uploading}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {slide.image ? "Replace image" : "Upload image"}
                  </Button>
                </Upload>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                  alignContent: "start",
                  gap: 16,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <Typography.Text>Featured tour (optional)</Typography.Text>
                  <Select
                    allowClear
                    onChange={(tourSlug) => updateSlide(slide.id, { tourSlug: tourSlug ?? "" })}
                    optionFilterProp="label"
                    options={tourOptions}
                    placeholder="Select a published tour"
                    showSearch
                    value={slide.tourSlug || undefined}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <Typography.Text>Crop focus</Typography.Text>
                  <Segmented
                    onChange={(focalPoint) =>
                      updateSlide(slide.id, {
                        focalPoint: focalPoint as HeroSlideFocalPoint,
                      })
                    }
                    options={focalPointOptions}
                    value={slide.focalPoint}
                  />
                </label>

                <Space>
                  <Switch
                    checked={slide.enabled}
                    onChange={(enabled) => updateSlide(slide.id, { enabled })}
                  />
                  <Typography.Text>{slide.enabled ? "Enabled" : "Disabled"}</Typography.Text>
                </Space>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
