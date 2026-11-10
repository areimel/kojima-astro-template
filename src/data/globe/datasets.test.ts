import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import heroConfig from "./configs/hero.json";
import minimalConfig from "./configs/minimal.json";
import orbitalConfig from "./configs/orbital.json";
import hotspots from "./hotspots.json";
import offices from "./offices.json";
import routes from "./routes.json";
import satellites from "./satellites.json";
import { parseGlobeData, resolveConfig } from "../../components/encom-globe/schema";

const signalFeedPath = fileURLToPath(
  new URL("../../../public/globe/feeds/signal-feed.json", import.meta.url),
);
const signalFeed = JSON.parse(readFileSync(signalFeedPath, "utf8")) as Record<string, unknown>;

const datasets: [string, Record<string, unknown>][] = [
  ["offices", offices],
  ["hotspots", hotspots],
  ["routes", routes],
  ["satellites", satellites],
  ["signal-feed", signalFeed],
];

const configs: [string, Record<string, unknown>][] = [
  ["hero", heroConfig],
  ["minimal", minimalConfig],
  ["orbital", orbitalConfig],
];

/** Every collection in a dataset, flattened, so ids can be checked across the whole file. */
const allItems = (data: Record<string, unknown>) =>
  Object.values(data).flatMap((value) => (Array.isArray(value) ? (value as { id?: unknown }[]) : []));

describe("globe demo datasets", () => {
  it.each(datasets)("%s parses without issues", (_name, data) => {
    const { issues } = parseGlobeData(data);
    expect(issues).toEqual([]);
  });

  it.each(datasets)("%s has unique, present ids", (_name, data) => {
    const ids = allItems(data).map((item) => item.id);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(configs)("%s config resolves", (_name, cfg) => {
    expect(() => resolveConfig(cfg)).not.toThrow();
  });
});
