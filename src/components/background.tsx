import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BackgroundProps = {
  children: ReactNode;
  variant?: "top" | "bottom";
  className?: string;
};

export const Background = ({
  children,
  variant = "top",
  className,
}: BackgroundProps) => (
  <div
    className={cn(
      "bg-background text-foreground relative isolate",
      variant === "top" ? "border-border border-t" : "border-border border-b",
      className,
    )}
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-30"
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, var(--border) 0, var(--border) 1px, transparent 1px, transparent 96px)",
      }}
    />
    {children}
  </div>
);
