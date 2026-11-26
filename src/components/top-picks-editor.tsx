"use client";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Empty,
  Image,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import type { ContentData } from "@/lib/content-values";
import {
  addTopPickSlug,
  moveTopPickSlug,
  parseTopPickSlugs,
  removeTopPickSlug,
  serializeTopPickSlugs,
  TOP_PICKS_DATA_KEY,
} from "@/lib/top-picks";
import type { ContentValue, TourRecord } from "@/types/cms";

type TopPicksEditorProps = {
  content: ContentData;
  tours: TourRecord[];
  onChange: (key: string, value: ContentValue) => void;
};

export function TopPicksEditor({
  content,
  tours,
  onChange,
}: TopPicksEditorProps) {
  const [selectedTourSlug, setSelectedTourSlug] = useState<string>();
  const selectedSlugs = parseTopPickSlugs(content);
  const toursBySlug = useMemo(
    () => new Map(tours.map((tour) => [tour.slug, tour])),
    [tours],
  );
  const tourOptions = useMemo(() => {
    const selected = new Set(selectedSlugs);
    return tours
      .filter((tour) => !selected.has(tour.slug))
      .map((tour) => ({
        label: `${tour.title}${tour.code ? ` (${tour.code})` : ""}`,
        value: tour.slug,
      }));
  }, [selectedSlugs, tours]);

  function commit(next: string[]) {
    onChange(TOP_PICKS_DATA_KEY, serializeTopPickSlugs(next));
  }

  function addSelectedTour() {
    if (!selectedTourSlug) return;
    commit(addTopPickSlug(selectedSlugs, selectedTourSlug));
    setSelectedTourSlug(undefined);
  }

  return (
    <section className="cms-top-picks-editor">
      <div className="cms-top-picks-editor-heading">
        <div>
          <Typography.Title level={5}>Selected tours</Typography.Title>
          <Typography.Paragraph type="secondary">
            Add tours in the order they should appear on the homepage. Changes
            sync with Tour Library when published.
          </Typography.Paragraph>
        </div>
        <Space.Compact className="cms-top-picks-add-control">
          <Select
            aria-label="Tour to add to Our Top Picks"
            onChange={setSelectedTourSlug}
            optionFilterProp="label"
            options={tourOptions}
            placeholder="Select a tour"
            showSearch
            value={selectedTourSlug}
          />
          <Button
            aria-label="Add selected tour to Our Top Picks"
            disabled={!selectedTourSlug}
            icon={<PlusOutlined />}
            onClick={addSelectedTour}
            type="primary"
          >
            Add
          </Button>
        </Space.Compact>
      </div>

      {selectedSlugs.length === 0 ? (
        <Empty description="No Our Top Picks tours selected" />
      ) : (
        <div className="cms-top-picks-list">
          {selectedSlugs.map((slug, index) => {
            const tour = toursBySlug.get(slug);
            const title = tour?.title ?? slug;
            return (
              <article className="cms-top-picks-item" key={slug}>
                <span className="cms-top-picks-order" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                {tour?.image ? (
                  <Image
                    alt=""
                    className="cms-top-picks-image"
                    height={58}
                    preview={false}
                    src={tour.image}
                    width={78}
                  />
                ) : null}
                <div className="cms-top-picks-summary">
                  <Space wrap size={8}>
                    <Typography.Text strong>{title}</Typography.Text>
                    {tour?.code ? <Tag>{tour.code}</Tag> : null}
                    {tour?.status && tour.status !== "published" ? (
                      <Tag color="gold">{tour.status}</Tag>
                    ) : null}
                  </Space>
                  <Typography.Text type="secondary">
                    {tour?.region || "Tour no longer available"}
                  </Typography.Text>
                </div>
                <Space className="cms-top-picks-actions" size={4}>
                  <Tooltip title="Move up">
                    <Button
                      aria-label={`Move ${title} up`}
                      disabled={index === 0}
                      icon={<ArrowUpOutlined />}
                      onClick={() => commit(moveTopPickSlug(selectedSlugs, slug, "up"))}
                      size="small"
                    />
                  </Tooltip>
                  <Tooltip title="Move down">
                    <Button
                      aria-label={`Move ${title} down`}
                      disabled={index === selectedSlugs.length - 1}
                      icon={<ArrowDownOutlined />}
                      onClick={() => commit(moveTopPickSlug(selectedSlugs, slug, "down"))}
                      size="small"
                    />
                  </Tooltip>
                  <Popconfirm
                    cancelText="Keep"
                    okButtonProps={{ danger: true }}
                    okText="Remove"
                    onConfirm={() => commit(removeTopPickSlug(selectedSlugs, slug))}
                    title="Remove this tour from Our Top Picks?"
                  >
                    <Tooltip title="Remove">
                      <Button
                        aria-label={`Remove ${title} from Our Top Picks`}
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
