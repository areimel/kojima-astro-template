import { useRef, useState } from "react";

import {
  ArrowDown,
  ArrowUpRight,
  Crosshair,
  Download,
  RefreshCw,
} from "lucide-react";

import {
  InstrumentGraphic,
  type InstrumentGraphicProps,
} from "./instrument-graphic";
import { IntelligenceSections } from "./intelligence-sections";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";


const instruments = [
  {
    id: "radar",
    label: "01 / RADAR",
    name: "Horizon scan",
    description: "Find the signals that change the picture.",
  },
  {
    id: "wave",
    label: "02 / FREQUENCY",
    name: "Signal analysis",
    description: "Separate emerging patterns from background noise.",
  },
  {
    id: "grid",
    label: "03 / MATRIX",
    name: "Network mapping",
    description: "Connect events, entities, and operational exposure.",
  },
] as const;
const signals = [
  {
    region: "EMEA",
    time: "08:42",
    title: "Maritime corridor activity",
    category: "SUPPLY CHAIN",
    level: "ELEVATED",
  },
  {
    region: "APAC",
    time: "08:36",
    title: "Policy outlook revised",
    category: "REGULATORY",
    level: "MONITOR",
  },
  {
    region: "AMER",
    time: "08:21",
    title: "Energy market movement",
    category: "MARKET RISK",
    level: "REVIEW",
  },
] as const;

export function IntelligenceHome() {
  const [variant, setVariant] =
    useState<NonNullable<InstrumentGraphicProps["variant"]>>("radar");
  const [palette, setPalette] =
    useState<NonNullable<InstrumentGraphicProps["palette"]>>("orange");
  const [complexity, setComplexity] = useState(65);
  const [seed, setSeed] = useState(932598536);
  const [region, setRegion] = useState("ALL REGIONS");
  const [status, setStatus] = useState("");
  const plate = useRef<HTMLDivElement>(null);
  const instrument = instruments.find((item) => item.id === variant)!;
  const shownSignals = signals.filter(
    (signal) => region === "ALL REGIONS" || signal.region === region,
  );

  function exportGraphic() {
    const svg = plate.current?.querySelector("svg");
    if (!svg) return;
    const url = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svg)], {
        type: "image/svg+xml;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `kojima-${variant}-${seed}.svg`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Instrument plate exported as SVG.");
  }

  return (
    <div className="kojima-home">
      <section className="intel-intro" aria-labelledby="intro-title">
        <div className="intel-eyebrow">
          <span>
            <i aria-hidden="true" /> PRIVATE INTELLIGENCE / PUBLIC CLARITY
          </span>
          <span>
            EST. 2026 <span aria-hidden="true">↗</span> SYSTEM 01
          </span>
        </div>
        <div className="intel-heading-row">
          <h1 id="intro-title">
            Read the world.
            <br />
            <span>Stay ahead of it.</span>
          </h1>
          <div className="intel-intro-copy">
            <p>
              A sharper operational picture for a world that won’t stand still.
              Intelligence for the decisions that matter.
            </p>
            <Button asChild>
              <a href="/contact">
                Request access <ArrowUpRight />
              </a>
            </Button>
            <a className="intel-text-link" href="#platform">
              Explore the platform <ArrowDown size={13} />
            </a>
          </div>
        </div>
      </section>

      <section
        className="instrument-workspace"
        aria-label="Interactive intelligence instrument preview"
      >
        <aside className="instrument-index">
          <div className="intel-panel-label">
            <span>INSTRUMENT INDEX</span>
            <span>03</span>
          </div>
          <div className="instrument-options">
            {instruments.map((item) => (
              <button
                key={item.id}
                className={`instrument-option ${variant === item.id ? "is-active" : ""}`}
                onClick={() => {
                  setVariant(item.id);
                  setStatus(`${item.name} selected.`);
                }}
                aria-pressed={variant === item.id}
              >
                <div className="instrument-thumbnail">
                  <InstrumentGraphic
                    variant={item.id}
                    palette={variant === item.id ? "orange" : "paper"}
                    complexity={30}
                    decorative
                  />
                </div>
                <span>
                  {item.label}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
          <div className="instrument-index-note">
            <Crosshair size={22} strokeWidth={1} />
            <p>
              EVERY SIGNAL
              <br />
              HAS A CONTEXT.
            </p>
            <span>35°40′ N / 139°42′ E</span>
          </div>
        </aside>

        <div className="instrument-stage">
          <div className="intel-panel-label">
            <span>FIELD OF VIEW / {variant.toUpperCase()}</span>
            <span>
              FIG. 0{instruments.findIndex((item) => item.id === variant) + 1}
            </span>
          </div>
          <div ref={plate} className="instrument-plate">
            <InstrumentGraphic
              variant={variant}
              palette={palette}
              seed={seed}
              complexity={complexity}
            />
          </div>
          <div className="instrument-caption">
            <strong>{instrument.name}</strong>
            <span>SEED {seed}</span>
            <span className="demo-tag">SYNTHETIC STUDY</span>
          </div>
        </div>

        <aside className="instrument-controls" aria-label="Instrument controls">
          <div className="intel-control-panel">
            <div className="intel-panel-label">
              <span>01 / DISPLAY CONFIGURATION</span>
              <span aria-hidden="true">+</span>
            </div>
            <h2>{instrument.name}</h2>
            <p>{instrument.description}</p>
            <div className="instrument-trait">
              <span>INSTRUMENT</span>
              <span>{variant.toUpperCase()}</span>
            </div>
            <div className="instrument-trait">
              <span>PALETTE</span>
              <span>{palette.toUpperCase()}</span>
            </div>
            <fieldset className="palette-picker">
              <legend>SELECT PALETTE</legend>
              {(["orange", "paper", "dark"] as const).map((value) => (
                <button
                  key={value}
                  className={`palette-swatch palette-${value}`}
                  aria-label={`${value} palette`}
                  aria-pressed={palette === value}
                  onClick={() => {
                    setPalette(value);
                    setStatus(`${value} palette selected.`);
                  }}
                >
                  <span aria-hidden="true">{palette === value ? "+" : ""}</span>
                </button>
              ))}
            </fieldset>
            <div className="density-label">
              <span id="density-label">DETAIL DENSITY</span>
              <output>{complexity}%</output>
            </div>
            <Slider
              aria-labelledby="density-label"
              value={[complexity]}
              onValueChange={([value]) => setComplexity(value)}
              min={0}
              max={100}
              step={5}
            />
            <div className="range-captions">
              <span>ESSENTIAL</span>
              <span>COMPLEX</span>
            </div>
          </div>
          <div className="intel-control-panel">
            <div className="intel-panel-label">
              <span>02 / SIGNAL REGISTER</span>
              <span className="signal-dot" aria-hidden="true" />
            </div>
            <div className="region-filter">
              <label htmlFor="signal-region">REGION</label>
              <select
                id="signal-region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
              >
                {["ALL REGIONS", "EMEA", "APAC", "AMER"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
            <ul className="signal-list">
              {shownSignals.map((signal) => (
                <li key={signal.region}>
                  <div>
                    <span>
                      {signal.time} / {signal.region}
                    </span>
                    <span
                      className={
                        signal.level === "ELEVATED" ? "signal-elevated" : ""
                      }
                    >
                      {signal.level}
                    </span>
                  </div>
                  <h3>{signal.title}</h3>
                  <p>{signal.category}</p>
                </li>
              ))}
            </ul>
            <p className="synthetic-disclosure">
              ILLUSTRATIVE SCENARIOS · NO LIVE DATA
            </p>
          </div>
          <div className="instrument-actions">
            <Button
              variant="outline"
              onClick={() => {
                setSeed((value) => (value + 7919) >>> 0);
                setStatus("New synthetic instrument study generated.");
              }}
            >
              <RefreshCw /> New study
            </Button>
            <Button variant="outline" onClick={exportGraphic}>
              <Download /> Export SVG
            </Button>
          </div>
          <p className="instrument-status" role="status">
            {status || "INTERACTIVE PREVIEW / EXPLORE THE SYSTEM"}
          </p>
        </aside>
      </section>

      <IntelligenceSections />
    </div>
  );
}
