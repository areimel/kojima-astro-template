import {
  ArrowRight,
  ArrowUpRight,
  Crosshair,
  Layers,
  Radio,
} from "lucide-react";

import { InstrumentGraphic } from "./instrument-graphic";

import { Button } from "@/components/ui/button";

const capabilities = [
  {
    number: "01",
    icon: Radio,
    title: "See the signal.",
    copy: "Bring fragmented reporting into one operational picture. Track the regions, industries, and developments that matter to your team.",
    detail: "COLLECT / ORGANIZE / MONITOR",
  },
  {
    number: "02",
    icon: Layers,
    title: "Connect the context.",
    copy: "Move from isolated events to a connected view of exposure. Give every assessment the context it needs to support a decision.",
    detail: "CORRELATE / INVESTIGATE / ASSESS",
  },
  {
    number: "03",
    icon: Crosshair,
    title: "Act with clarity.",
    copy: "Turn analysis into concise briefings. Put the evidence, uncertainty, and operational implications in front of the right people.",
    detail: "BRIEF / ALIGN / DECIDE",
  },
];

export function IntelligenceSections() {
  return (
    <>
      <div className="intel-system-strip" aria-label="Platform focus">
        <span>
          <i aria-hidden="true" /> PURPOSE-BUILT FOR INTELLIGENCE TEAMS
        </span>
        <span>GEOPOLITICAL RISK</span>
        <span>CORPORATE SECURITY</span>
        <span>STRATEGIC FORESIGHT</span>
      </div>
      <section
        id="platform"
        className="intel-capabilities"
        aria-labelledby="platform-title"
      >
        <div className="intel-section-top">
          <p className="kicker">01 / OPERATIONAL ADVANTAGE</p>
          <span className="registration-mark" aria-hidden="true" />
        </div>
        <div className="intel-section-heading">
          <h2 id="platform-title">
            Less noise.
            <br />
            More intelligence.
          </h2>
          <p>
            From the first signal to the final briefing.
            <br />
            One connected environment for seeing what comes next.
          </p>
        </div>
        <div className="capability-grid">
          {capabilities.map(({ number, icon: Icon, title, copy, detail }) => (
            <article key={number} className="capability-card">
              <div className="capability-marker">
                <Icon size={28} strokeWidth={1} />
                <span>MODULE / {number}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <div className="capability-detail">
                {detail}
                <span aria-hidden="true">↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="intel-briefing" aria-labelledby="briefing-title">
        <div className="briefing-visual" aria-hidden="true">
          <InstrumentGraphic
            variant="wave"
            palette="paper"
            complexity={45}
            decorative
          />
        </div>
        <div className="briefing-content">
          <p className="kicker">02 / THE ANALYST’S PERSPECTIVE</p>
          <h2 id="briefing-title">
            The world is connected.
            <br />
            Your intelligence
            <br />
            should be, too.
          </h2>
          <p>
            Geopolitics doesn’t happen in isolation. Neither do supply-chain
            disruptions, policy shifts, or emerging market risks. Kojima brings
            the bigger picture into focus.
          </p>
          <Button asChild variant="outline">
            <a href="/about">
              Inside Kojima <ArrowUpRight />
            </a>
          </Button>
          <div className="briefing-footnote">
            <span>HUMAN JUDGMENT, AT THE CENTER.</span>
            <span>解析 / ANALYSIS</span>
          </div>
        </div>
      </section>
      <section className="intel-cta" aria-labelledby="cta-title">
        <div>
          <p className="kicker">YOUR NEXT MOVE STARTS HERE</p>
          <h2 id="cta-title">
            A clearer picture.
            <br />A stronger position.
          </h2>
        </div>
        <div>
          <Button size="lg" asChild>
            <a href="/contact">
              Request a briefing <ArrowRight />
            </a>
          </Button>
          <p>Explore what your intelligence workspace could be.</p>
        </div>
      </section>
    </>
  );
}
