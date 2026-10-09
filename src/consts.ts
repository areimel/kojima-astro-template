export const SITE_TITLE = "Kojima | Intelligence System";
export const SITE_DESCRIPTION =
  "Explore Kojima, a private-intelligence platform concept for connecting signals, investigating context, and building a shared operating picture.";

// Retained for existing template attribution links.
export const GITHUB_URL =
  "https://github.com/shadcnblocks/mainline-astro-template";

export const SITE_METADATA = {
  title: { default: SITE_TITLE, template: "%s | Kojima" },
  description: SITE_DESCRIPTION,
  keywords: [
    "Kojima",
    "private intelligence",
    "situational awareness",
    "intelligence platform",
    "analysis workspace",
    "situation room",
    "product demo",
  ],
  authors: [{ name: "Kojima" }],
  creator: "Kojima",
  publisher: "Kojima",
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml", sizes: "any" }],
  },
  openGraph: {
    siteName: "Kojima",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const MAIN_NAV = [
  { label: "Overview", href: "/" },
  { label: "Platform", href: "/#platform" },
  { label: "Intelligence", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
