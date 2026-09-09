"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ContentData } from "@/lib/content-values";

const NavbarContentContext = createContext<ContentData>({});

export function NavbarContentProvider({
  content,
  children,
}: {
  content: ContentData;
  children: ReactNode;
}) {
  return (
    <NavbarContentContext.Provider value={content}>
      {children}
    </NavbarContentContext.Provider>
  );
}

export function useNavbarContent(): ContentData {
  return useContext(NavbarContentContext);
}
