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
  Input,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import {
  addHotSalePromotion,
  getTourRecordOriginalPrice,
  HOT_SALES_DATA_KEY,
  moveHotSalePromotion,
  parseHotSalePromotions,
  removeHotSalePromotion,
  serializeHotSalePromotions,
  updateHotSalePromotion,
  type HotSalePromotion,
} from "@/lib/hot-sales";
import type { ContentData } from "@/lib/content-values";
import type { ContentValue, TourRecord } from "@/types/cms";

type HotSalesEditorProps = {
  content: ContentData;
  tours: TourRecord[];
  onChange: (key: string, value: ContentValue) => void;
};

export function HotSalesEditor({
  content,
  tours,
  onChange,
}: HotSalesEditorProps) {
  const [selectedTourSlug, setSelectedTourSlug] = useState<string>();
  const promotions = parseHotSalePromotions(content);
  const toursBySlug = useMemo(
    () => new Map(tours.map((tour) => [tour.slug, tour])),
    [tours],
  );
  const tourOptions = useMemo(
    () => {
      const selectedSlugs = new Set(
        promotions.map((promotion) => promotion.tourSlug),
      );
      return tours
        .filter((tour) => !selectedSlugs.has(tour.slug))
        .map((tour) => ({
          label: `${tour.title}${tour.code ? ` (${tour.code})` : ""}`,
          value: tour.slug,
        }));
    },
    [promotions, tours],
  );

  function commit(next: HotSalePromotion[]) {
    onChange(HOT_SALES_DATA_KEY, serializeHotSalePromotions(next));
  }

  function addSelectedTour() {
    if (!selectedTourSlug) return;
    commit(addHotSalePromotion(promotions, selectedTourSlug));
    setSelectedTourSlug(undefined);
  }

  return (
    <section className="cms-hot-sales-editor">
      <div className="cms-hot-sales-editor-heading">
        <div>
          <Typography.Title level={5}>Promoted tours</Typography.Title>
          <Typography.Paragraph type="secondary">
            Add tours in display order. Original prices come from Tour Library fares.
          </Typography.Paragraph>
        </div>
        <Space.Compact className="cms-hot-sales-add-control">
          <Select
            aria-label="Tour to add to Hot Sales"
            onChange={setSelectedTourSlug}
            optionFilterProp="label"
            options={tourOptions}
            placeholder="Select a tour"
            showSearch
            value={selectedTourSlug}
          />
          <Button
            aria-label="Add selected tour to Hot Sales"
            disabled={!selectedTourSlug}
            icon={<PlusOutlined />}
            onClick={addSelectedTour}
            type="primary"
          >
            Add
          </Button>
        </Space.Compact>
      </div>

      {promotions.length === 0 ? (
        <Empty description="No Hot Sales tours selected" />
      ) : (
        <div className="cms-hot-sales-list">
          {promotions.map((promotion, index) => {
            const tour = toursBySlug.get(promotion.tourSlug);
            const originalPrice = tour ? getTourRecordOriginalPrice(tour) : null;
            return (
              <article className="cms-hot-sales-item" key={promotion.tourSlug}>
                <header className="cms-hot-sales-item-header">
                  <div>
                    <Space wrap size={8}>
                      <Typography.Text strong>
                        {tour?.title ?? promotion.tourSlug}
                      </Typography.Text>
                      {tour?.code ? <Tag>{tour.code}</Tag> : null}
                      {tour?.status && tour.status !== "published" ? (
                        <Tag color="gold">{tour.status}</Tag>
                      ) : null}
                    </Space>
                    <Typography.Paragraph type="secondary">
                      Original price: {originalPrice ?? "No valid fare"}
                    </Typography.Paragraph>
                  </div>
                  <Space size={4}>
                    <Tooltip title="Move up">
                      <Button
                        aria-label={`Move ${tour?.title ?? promotion.tourSlug} up`}
                        disabled={index === 0}
                        icon={<ArrowUpOutlined />}
                        onClick={() =>
                          commit(
                            moveHotSalePromotion(
                              promotions,
                              promotion.tourSlug,
                              "up",
                            ),
                          )
                        }
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Move down">
                      <Button
                        aria-label={`Move ${tour?.title ?? promotion.tourSlug} down`}
                        disabled={index === promotions.length - 1}
                        icon={<ArrowDownOutlined />}
                        onClick={() =>
                          commit(
                            moveHotSalePromotion(
                              promotions,
                              promotion.tourSlug,
                              "down",
                            ),
                          )
                        }
                        size="small"
                      />
                    </Tooltip>
                    <Popconfirm
                      cancelText="Keep"
                      okButtonProps={{ danger: true }}
                      okText="Remove"
                      onConfirm={() =>
                        commit(
                          removeHotSalePromotion(
                            promotions,
                            promotion.tourSlug,
                          ),
                        )
                      }
                      title="Remove this tour from Hot Sales?"
                    >
                      <Tooltip title="Remove">
                        <Button
                          aria-label={`Remove ${tour?.title ?? promotion.tourSlug} from Hot Sales`}
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                </header>
                <div className="cms-hot-sales-fields">
                  <label>
                    <Typography.Text>Discounted price (CAD)</Typography.Text>
                    <Input
                      onChange={(event) =>
                        commit(
                          updateHotSalePromotion(
                            promotions,
                            promotion.tourSlug,
                            { salePrice: event.target.value },
                          ),
                        )
                      }
                      placeholder="e.g. 599"
                      value={promotion.salePrice}
                    />
                  </label>
                  <label>
                    <Typography.Text>Offer description (English)</Typography.Text>
                    <Input
                      maxLength={160}
                      onChange={(event) =>
                        commit(
                          updateHotSalePromotion(
                            promotions,
                            promotion.tourSlug,
                            { offerDescription: event.target.value },
                          ),
                        )
                      }
                      placeholder="e.g. 3rd & 4th guests 50% off"
                      value={promotion.offerDescription}
                    />
                  </label>
                  <label>
                    <Typography.Text>Offer description (Chinese)</Typography.Text>
                    <Input
                      maxLength={160}
                      onChange={(event) =>
                        commit(
                          updateHotSalePromotion(
                            promotions,
                            promotion.tourSlug,
                            { localizedOfferDescription: event.target.value },
                          ),
                        )
                      }
                      placeholder="例如：第三、四人半价"
                      value={promotion.localizedOfferDescription}
                    />
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
