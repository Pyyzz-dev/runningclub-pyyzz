"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface HeaderMobileContextValue {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  segment: string | null;
}

const HeaderMobileContext = createContext<HeaderMobileContextValue | null>(null);

export function HeaderMobileProvider({
  segment,
  children,
}: {
  segment: string | null;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <HeaderMobileContext.Provider value={{ mobileOpen, setMobileOpen, segment }}>
      {children}
    </HeaderMobileContext.Provider>
  );
}

export function useHeaderMobile() {
  const ctx = useContext(HeaderMobileContext);
  if (!ctx) {
    throw new Error("useHeaderMobile must be used within HeaderMobileProvider");
  }
  return ctx;
}
