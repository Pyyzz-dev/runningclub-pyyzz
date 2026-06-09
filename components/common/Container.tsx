import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const maxWidthMap = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-7xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-full",
} as const;

export type ContainerMaxWidth = keyof typeof maxWidthMap;

interface ContainerProps {
  children: ReactNode;
  maxWidth?: ContainerMaxWidth;
  className?: string;
}

export function Container({
  children,
  maxWidth = "xl",
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        "container-custom",
        maxWidth !== "xl" && maxWidthMap[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
}
