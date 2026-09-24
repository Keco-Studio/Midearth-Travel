"use client";

import { Input, Typography } from "antd";
import { ExploreByMonthEditor } from "@/components/explore-by-month-editor";
import type { BusToursContent } from "@/lib/bus-tours-content";
import type { TourRecord } from "@/types/cms";

type Props = {
  content: BusToursContent;
  tours: TourRecord[];
  onChange: (content: BusToursContent) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function BusToursContentEditor({ content, tours, onChange, onDirtyChange }: Props) {
  function update(key: keyof BusToursContent, value: string) {
    onDirtyChange(true);
    onChange({ ...content, [key]: value });
  }

  return (
    <section className="cms-destination-name-editor" style={{ marginTop: 32 }}>
      <Typography.Title level={5} style={{ margin: "0 0 8px" }}>
        Bus Tours Content
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        Controls the Bus Tours page only. Monthly cards can reference published Bus Tour packages only.
      </Typography.Paragraph>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        <LabelledInput label="Month eyebrow (English)" value={content.monthEyebrowEn} onChange={(value) => update("monthEyebrowEn", value)} />
        <LabelledInput label="月份眉题（中文）" value={content.monthEyebrowZh} onChange={(value) => update("monthEyebrowZh", value)} />
        <LabelledInput label="Month title (English)" value={content.monthTitleEn} onChange={(value) => update("monthTitleEn", value)} />
        <LabelledInput label="月份标题（中文）" value={content.monthTitleZh} onChange={(value) => update("monthTitleZh", value)} />
        <LabelledInput label="Region eyebrow (English)" value={content.regionEyebrowEn} onChange={(value) => update("regionEyebrowEn", value)} />
        <LabelledInput label="地区眉题（中文）" value={content.regionEyebrowZh} onChange={(value) => update("regionEyebrowZh", value)} />
        <LabelledInput label="Region title (English)" value={content.regionTitleEn} onChange={(value) => update("regionTitleEn", value)} />
        <LabelledInput label="地区标题（中文）" value={content.regionTitleZh} onChange={(value) => update("regionTitleZh", value)} />
      </div>
      <div style={{ marginTop: 24 }}>
        <ExploreByMonthEditor
          content={content}
          tours={tours}
          tourFilter={(tour) => tour.busTourPackage || tour.destinationCategoryIds.includes("bus-tours")}
          onChange={(key, value) => update(key as keyof BusToursContent, value as string)}
        />
      </div>
    </section>
  );
}

function LabelledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span style={{ display: "block", marginBottom: 6, fontSize: 13 }}>{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
