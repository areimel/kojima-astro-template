import type { Palette } from "./engine/types";

import { meta } from "@/components/kojima/panel-heading";
import { cn } from "@/lib/utils";


export interface GlobeCounts {
  pins: number;
  markers: number;
  satellites: number;
}

interface FrameProps {
  title?: string;
  subtitle?: string;
  /** Right-aligned live status, e.g. "SYS | 012" or the hovered item. */
  status?: string;
  legend?: boolean;
  palette: Palette;
  counts: GlobeCounts;
}

const bracket = "absolute size-3 border-primary";

/** Purely presentational Encom-style HUD: corner brackets, meta strip and legend. */
export function EncomGlobeFrame({ title, subtitle, status, legend, palette, counts }: FrameProps) {
  const entries = [
    { label: "Pins", count: counts.pins, color: palette.pin },
    { label: "Markers", count: counts.markers, color: palette.marker },
    { label: "Satellites", count: counts.satellites, color: palette.satelliteCore },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      <span className={cn(bracket, "top-2 left-2 border-t border-l")} />
      <span className={cn(bracket, "top-2 right-2 border-t border-r")} />
      <span className={cn(bracket, "bottom-2 left-2 border-b border-l")} />
      <span className={cn(bracket, "right-2 bottom-2 border-r border-b")} />
      <div className={cn(meta, "absolute inset-x-0 top-0 flex items-baseline justify-between gap-3 px-6 pt-4")}>
        <span className="truncate">
          {title && <span className="text-foreground">{title}</span>}
          {title && subtitle && " / "}
          {subtitle}
        </span>
        {status && <span className="shrink-0 tabular-nums">{status}</span>}
      </div>
      {legend && (
        <ul className={cn(meta, "absolute inset-x-0 bottom-0 flex flex-wrap gap-x-5 gap-y-1 px-6 pb-4")}>
          {entries.map((e) => (
            <li key={e.label} className="flex items-center gap-2">
              <span className="size-2 border border-border" style={{ backgroundColor: e.color }} />
              {e.label} {String(e.count).padStart(2, "0")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
