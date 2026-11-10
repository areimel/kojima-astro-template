import type { PresetName } from '@/lib/animations/types';

export type SampleKind = 'text' | 'block' | 'list' | 'number' | 'dot';

export interface LabPreset {
  name: PresetName;
  description: string;
  sampleKind: SampleKind;
}

export interface LabFamily {
  family: string;
  presets: LabPreset[];
}

export const LAB_FAMILIES: LabFamily[] = [
  {
    family: 'Text',
    presets: [
      { name: 'decode', description: 'Scrambled ciphertext resolves into plain text.', sampleKind: 'text' },
      { name: 'typewriter', description: 'A transmission typed out one character at a time.', sampleKind: 'text' },
    ],
  },
  {
    family: 'Glitch',
    presets: [
      { name: 'glitch-in', description: 'Signal tears, then locks onto the feed.', sampleKind: 'text' },
      { name: 'slice', description: 'Horizontal bands slide into alignment.', sampleKind: 'block' },
      { name: 'flicker-in', description: 'A failing monitor stabilises on target.', sampleKind: 'text' },
    ],
  },
  {
    family: 'Reveal',
    presets: [
      { name: 'fade-up', description: 'Quiet entrance for low-key briefings.', sampleKind: 'text' },
      { name: 'scan-wipe', description: 'A scanner sweeps across and exposes the panel.', sampleKind: 'block' },
      { name: 'redact', description: 'The black bar lifts to reveal the line.', sampleKind: 'text' },
      { name: 'boot-stagger', description: 'Systems come online one after another.', sampleKind: 'list' },
    ],
  },
  {
    family: 'Ambient & hover',
    presets: [
      { name: 'blink', description: 'Cursor-style status beacon.', sampleKind: 'dot' },
      { name: 'pulse', description: 'Live-signal heartbeat.', sampleKind: 'dot' },
      { name: 'flicker', description: 'Unstable feed, always on.', sampleKind: 'text' },
      { name: 'counter', description: 'Intercept tally counts up to the final figure.', sampleKind: 'number' },
      { name: 'glitch-hover', description: 'Distorts when a hand reaches for it.', sampleKind: 'text' },
    ],
  },
];
