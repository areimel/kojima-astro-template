import type { GlobeConfigInput, GlobeDataInput } from "@/components/encom-globe";
import hero from "@/data/globe/configs/hero.json";
import minimal from "@/data/globe/configs/minimal.json";
import orbital from "@/data/globe/configs/orbital.json";
import hotspots from "@/data/globe/hotspots.json";
import offices from "@/data/globe/offices.json";
import routes from "@/data/globe/routes.json";
import satellites from "@/data/globe/satellites.json";


export { hero, hotspots, minimal, offices, orbital, routes, satellites };

export const FEED_URL = "/globe/feeds/signal-feed.json";

export const configs = { hero, minimal, orbital } as Record<string, GlobeConfigInput>;

export const DATASETS = {
  offices: { pins: offices.pins },
  hotspots: { pins: hotspots.pins },
  routes: { markers: routes.markers },
  satellites: { satellites: satellites.satellites, constellations: satellites.constellations },
} satisfies Record<string, GlobeDataInput>;

export type DatasetName = keyof typeof DATASETS | "all";

export const allData: GlobeDataInput = {
  pins: [...offices.pins, ...hotspots.pins],
  markers: routes.markers,
  satellites: satellites.satellites,
  constellations: satellites.constellations,
};

export const datasetFor = (name: DatasetName): GlobeDataInput => (name === "all" ? allData : DATASETS[name]);

export const CITIES = [
  { label: "London", lat: 51.51, lng: -0.13 },
  { label: "Tokyo", lat: 35.68, lng: 139.69 },
  { label: "New York", lat: 40.71, lng: -74.01 },
  { label: "Singapore", lat: 1.35, lng: 103.82 },
  { label: "Sydney", lat: -33.87, lng: 151.21 },
] as const;
