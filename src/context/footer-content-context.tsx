"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ContentData } from "@/lib/content-values";

const FooterContentContext = createContext<ContentData>({});

export function FooterContentProvider({
  content,
  children,
}: {
  content: ContentData;
  children: ReactNode;
}) {
  return (
    <FooterContentContext.Provider value={content}>
      {children}
    </FooterContentContext.Provider>
  );
}

export function useFooterContent(): ContentData {
  return useContext(FooterContentContext);
}
