import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionBgVariant = "default" | "muted" | "primary";

const bgVariants: Record<SectionBgVariant, string> = {
  default: "bg-background",
  muted: "bg-muted/50",
  primary: "bg-primary/5",
};

interface SectionProps {
  title: string;
  subtitle?: string;
  bg?: SectionBgVariant;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}

export function Section({
  title,
  subtitle,
  bg = "default",
  children,
  className,
  containerClassName,
  id,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn("section-padding", bgVariants[bg], className)}
    >
      <div className={cn("container-custom", containerClassName)}>
        <div className="mb-8 md:mb-10">
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
