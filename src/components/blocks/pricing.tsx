import { useState } from "react";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Observer",
    monthly: 40,
    annualMonthly: 32,
    description: "A focused desk for regional research.",
    features: [
      "5 monitoring topics",
      "1 research workspace",
      "Weekly briefing concept",
    ],
  },
  {
    name: "Analyst",
    monthly: 100,
    annualMonthly: 80,
    description: "A shared picture for corporate intelligence teams.",
    features: [
      "25 monitoring topics",
      "5 research workspaces",
      "Daily briefing concept",
    ],
  },
  {
    name: "Directorate",
    monthly: 200,
    annualMonthly: 160,
    description: "A wider view across geopolitical risk teams.",
    features: [
      "100 monitoring topics",
      "20 research workspaces",
      "Custom briefing cadence concept",
    ],
  },
];

export const Pricing = ({
  className,
  headingLevel = "h2",
}: {
  className?: string;
  headingLevel?: "h1" | "h2";
}) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const Heading = headingLevel;
  return (
    <section className={cn("py-24 lg:py-28", className)}>
      <div className="container">
        <p className="kicker mb-6">Plans / Illustrative pricing</p>
        <Heading className="section-heading max-w-3xl">
          A research desk.
          <br />
          An intelligence operation.
        </Heading>
        <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
          Explore a fictional model for corporate intelligence and geopolitical
          risk teams. These demo tiers are not offers for sale; no subscriptions
          or payments are available.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4 border-y py-5">
          <Switch
            id="annual-billing"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="annual-billing">Annual billing / save 20%</Label>
          <span className="text-muted-foreground font-mono text-xs">
            USD · PER ANALYST
          </span>
        </div>
        <noscript>
          <p className="mt-4 text-sm">
            Annual examples are shown. Enable JavaScript to compare monthly
            billing.
          </p>
        </noscript>
        <div
          className="mt-8 grid gap-5 md:grid-cols-3"
          aria-live="polite"
          aria-atomic="true"
        >
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={cn(
                "h-full rounded-none shadow-none",
                index === 1 && "border-t-primary border-t-4",
              )}
            >
              <CardContent className="flex h-full flex-col gap-6">
                <div>
                  <p className="technical-label mb-4">
                    0{index + 1} / Demo tier
                  </p>
                  <h3 className="text-2xl">{plan.name}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {plan.description}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-4xl tracking-tight">
                    ${isAnnual ? plan.annualMonthly : plan.monthly}
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      / month
                    </span>
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {isAnnual
                      ? `$${plan.annualMonthly * 12} per analyst, billed yearly`
                      : `$${plan.monthly} per analyst, billed monthly`}
                  </p>
                </div>
                <ul className="space-y-3 border-t pt-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={index === 1 ? "default" : "outline"}
                  className="mt-auto w-full"
                >
                  <a href="/contact">Request access</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-muted-foreground mt-5 text-xs">
          All prices, limits, and workflows are illustrative. Request access
          opens the local demo inquiry form.
        </p>
      </div>
    </section>
  );
};
