import { ArrowUpRight } from "lucide-react";

import { MAIN_NAV } from "@/consts";

export function Footer() {
  return (
    <footer className="bg-background text-foreground border-border mt-20 border-t">
      <div className="mx-auto max-w-[1600px] px-5 pt-10 md:px-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <p className="text-primary font-mono text-[10px] tracking-[0.16em] uppercase">
              Private intelligence / A clearer operating picture
            </p>
            <p className="mt-4 max-w-sm text-lg">
              Connect the signals.
              <br />
              Bring the situation into focus.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-8 gap-y-4 font-mono text-xs"
          >
            {MAIN_NAV.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="hover:text-primary focus-visible:outline-ring flex h-fit min-h-6 items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4"
              >
                {label}
                <ArrowUpRight aria-hidden="true" className="size-3" />
              </a>
            ))}
          </nav>
        </div>
        <nav
          aria-label="Resources and account"
          className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-6 font-mono text-xs"
        >
          {[
            ["Pricing", "/pricing"],
            ["FAQ", "/faq"],
            ["Sign in", "/login"],
            ["Register", "/signup"],
            ["UI kit", "/components"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="flex min-h-6 items-center hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {label}
            </a>
          ))}
        </nav>
        <a
          href="/"
          aria-label="Kojima home"
          className="focus-visible:outline-ring mt-10 block w-fit text-[clamp(4rem,18.5vw,19rem)] leading-[1.05] font-bold tracking-[-0.075em] focus-visible:outline-2"
        >
          KOJIMA<span className="text-primary">.</span>
        </a>
        <div className="text-muted-foreground border-border mt-6 flex flex-wrap justify-between gap-4 border-t py-6 font-mono text-[10px] tracking-wider uppercase">
          <span>&copy; {new Date().getFullYear()} Kojima</span>
          <span>Intelligence system / Product demo</span>
          <a
            href="/privacy"
            className="hover:text-foreground focus-visible:outline-ring focus-visible:outline-2"
          >
            Privacy policy
          </a>
        </div>
      </div>
    </footer>
  );
}
