"use client";

import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, Input, Select, Space, Table, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  createEmptyDestination,
  EXPLORE_MONTHS_DATA_KEY,
  getExploreByMonthEntries,
  serializeMonthEntries,
} from "@/lib/explore-by-month";
import type { MonthDestination, MonthEntry } from "@/data/destinations-by-month";
import type { ContentData } from "@/lib/content-values";
import type { ContentValue, TourRecord } from "@/types/cms";

type ExploreByMonthEditorProps = {
  content: ContentData;
  onChange: (key: string, value: ContentValue) => void;
};

type TourOption = {
  value: string;
  label: string;
  region: string;
  tourType: string;
};

export function ExploreByMonthEditor({
  content,
  onChange,
}: ExploreByMonthEditorProps) {
  const { message } = App.useApp();
  const months = getExploreByMonthEntries(content);
  const [tours, setTours] = useState<TourRecord[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadTours() {
      setLoadingTours(true);
      try {
        const response = await fetch("/api/admin/tours");
        const payload = (await response.json()) as {
          tours?: TourRecord[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load tours");
        }
        if (!cancelled) {
          setTours(payload.tours ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          message.error(
            error instanceof Error ? error.message : "Unable to load tours",
          );
        }
      } finally {
        if (!cancelled) setLoadingTours(false);
      }
    }

    void loadTours();
    return () => {
      cancelled = true;
    };
  }, [message]);

  const tourOptions = useMemo<TourOption[]>(
    () =>
      tours
        .filter((tour) => tour.status === "published" || tour.status === "draft")
        .map((tour) => ({
          value: tour.slug,
          label: `${tour.title} (${tour.slug})`,
          region: tour.region,
          tourType: tour.tourType,
        })),
    [tours],
  );

  function commit(next: MonthEntry[]) {
    onChange(EXPLORE_MONTHS_DATA_KEY, serializeMonthEntries(next));
  }

  function updateDestination(
    monthKey: string,
    destinationId: string,
    patch: Partial<MonthDestination>,
  ) {
    commit(
      months.map((month) => {
        if (month.month !== monthKey) return month;
        return {
          ...month,
          destinations: month.destinations.map((dest) =>
            dest.id === destinationId ? { ...dest, ...patch } : dest,
          ),
        };
      }),
    );
  }

  function addDestination(monthKey: string) {
    commit(
      months.map((month) =>
        month.month === monthKey
          ? {
              ...month,
              destinations: [...month.destinations, createEmptyDestination()],
            }
          : month,
      ),
    );
  }

  function removeDestination(monthKey: string, destinationId: string) {
    commit(
      months.map((month) =>
        month.month === monthKey
          ? {
              ...month,
              destinations: month.destinations.filter(
                (dest) => dest.id !== destinationId,
              ),
            }
          : month,
      ),
    );
  }

  return (
    <section className="cms-destination-name-editor">
      <Typography.Title level={5} style={{ margin: "0 0 8px" }}>
        Monthly destinations
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
        Pick a tour from the Tour Library for each card, then write the month-
        specific description. Name, region, type, image, and link come from the
        tour automatically.
      </Typography.Paragraph>

      <div style={{ display: "grid", gap: 20 }}>
        {months.map((month) => (
          <div
            key={month.month}
            style={{
              border: "1px solid #e8e2d4",
              borderRadius: 12,
              padding: 16,
              background: "#fffdf8",
            }}
          >
            <Space
              align="center"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Typography.Text strong>
                {month.label} ({month.month})
              </Typography.Text>
              <Button
                icon={<PlusOutlined />}
                onClick={() => addDestination(month.month)}
                size="small"
              >
                Add destination
              </Button>
            </Space>

            <Table<MonthDestination>
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={month.destinations}
              loading={loadingTours}
              locale={{ emptyText: "No destinations for this month" }}
              columns={[
                {
                  title: "Tour",
                  dataIndex: "tourSlug",
                  width: 320,
                  render: (_, dest) => (
                    <Select
                      showSearch
                      allowClear
                      placeholder="Select from Tour Library"
                      style={{ width: "100%" }}
                      options={tourOptions}
                      optionFilterProp="label"
                      value={dest.tourSlug || undefined}
                      onChange={(slug) => {
                        if (!dest.id) return;
                        updateDestination(month.month, dest.id, {
                          tourSlug: slug ?? "",
                          // Clear legacy snapshot fields so public resolve uses the tour.
                          name: "",
                          region: "",
                          tag: "",
                          image: "",
                          href: "",
                        });
                      }}
                    />
                  ),
                },
                {
                  title: "Description",
                  dataIndex: "desc",
                  render: (_, dest) => (
                    <Input.TextArea
                      rows={2}
                      placeholder="Month-specific blurb shown on the card"
                      value={dest.desc}
                      onChange={(event) => {
                        if (!dest.id) return;
                        updateDestination(month.month, dest.id, {
                          desc: event.target.value,
                        });
                      }}
                    />
                  ),
                },
                {
                  title: "",
                  width: 56,
                  render: (_, dest) => (
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        if (!dest.id) return;
                        removeDestination(month.month, dest.id);
                      }}
                      size="small"
                    />
                  ),
                },
              ]}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
