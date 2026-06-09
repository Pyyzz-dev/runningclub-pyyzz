import type { ReactNode } from "react";

interface ConditionalSiteChromeProps {
  children: ReactNode;
}

/** Wrapper layout — Header/Footer tự ẩn trên /admin */
export function ConditionalSiteChrome({ children }: ConditionalSiteChromeProps) {
  return <div className="flex min-h-screen flex-col">{children}</div>;
}
