"use client";

import { AutoComplete } from "antd";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

type TourTypeAutoCompleteProps = {
  value?: string;
  options: string[];
  "aria-label"?: string;
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
  onCommit?: (value: string) => void;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
};

export function TourTypeAutoComplete({
  value = "",
  options,
  placeholder = "Select or type a type",
  className,
  onChange,
  onCommit,
  onClick,
  "aria-label": ariaLabel,
}: TourTypeAutoCompleteProps) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const visibleOptions = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase("en");

    if (!query) {
      return options;
    }

    return options.filter((item) => item.toLocaleLowerCase("en").includes(query));
  }, [keyword, options]);

  function commitDraft(nextValue = draft) {
    const next = nextValue.trim();

    if (!next) {
      setDraft(value);
      onChange?.(value);
      return;
    }

    setDraft(next);
    onChange?.(next);

    if (next !== value) {
      onCommit?.(next);
    }
  }

  return (
    <AutoComplete
      className={className}
      open={open}
      value={draft}
      options={visibleOptions.map((item) => ({ value: item }))}
      aria-label={ariaLabel}
      placeholder={placeholder}
      filterOption={false}
      onClick={(event) => {
        onClick?.(event);
        setKeyword("");
        setOpen(true);
      }}
      onFocus={() => {
        setKeyword("");
        setOpen(true);
      }}
      onChange={(next) => {
        setDraft(next);
        setKeyword(next);
        setOpen(true);
        onChange?.(next);
      }}
      onSelect={(selected) => {
        const next = String(selected);
        setDraft(next);
        setKeyword("");
        setOpen(false);
        onChange?.(next);
        onCommit?.(next);
      }}
      onBlur={() => {
        setOpen(false);
        setKeyword("");
        commitDraft();
      }}
    />
  );
}
