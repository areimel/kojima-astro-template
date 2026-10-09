import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Contact = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [status, setStatus] = useState("");
  const [prepared, setPrepared] = useState("");
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || message.length < 20) {
      setPrepared("");
      setStatus(
        "Enter your name and at least 20 characters describing your inquiry, excluding surrounding spaces.",
      );
      return;
    }
    setPrepared(
      [
        "KOJIMA / DEMO INQUIRY",
        "Prepared locally. No message sent.",
        "",
        `Name: ${name}`,
        `Email: ${data.get("email")}`,
        `Organization: ${data.get("organization") || "Not provided"}`,
        "",
        message,
      ].join("\n"),
    );
    setStatus(
      "Demo request prepared locally; no message sent. Download a text copy below.",
    );
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([prepared], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "kojima-demo-inquiry.txt";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="py-24 lg:pt-40 lg:pb-28">
      <div className="container grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="kicker mb-6">01 / Request access</p>
          <h1 className="section-heading max-w-xl">
            Start with the questions that matter.
          </h1>
          <p className="text-muted-foreground mt-6 max-w-lg text-lg">
            Define a private-intelligence workflow for your corporate
            intelligence or geopolitical risk team. What do you monitor, and
            which decisions depend on your briefings?
          </p>
          <div className="mt-10 divide-y border-y">
            {[
              [
                "01 / Monitoring",
                "Regions, entities, and developments your team follows.",
              ],
              [
                "02 / Assessment",
                "Political and commercial context behind emerging risks.",
              ],
              [
                "03 / Briefings",
                "Decision-ready reporting for your stakeholders.",
              ],
            ].map(([title, copy]) => (
              <div key={title} className="py-5">
                <h2 className="technical-label">{title}</h2>
                <p className="mt-2 text-sm">{copy}</p>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground mt-6 text-sm">
            Kojima is a product demo. This form prepares an inquiry in your
            browser; it does not contact a sales team. Use sample information.
          </p>
        </div>
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <p className="technical-label">Inquiry / Local preparation</p>
            <h2 className="text-2xl">Define your brief.</h2>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={prepare}
              onChange={() => {
                setPrepared("");
                setStatus("");
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="contact-name">Full name</Label>
                <Input
                  id="contact-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Work email</Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-org">Organization (optional)</Label>
                <Input
                  id="contact-org"
                  name="organization"
                  autoComplete="organization"
                  maxLength={160}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">
                  Intelligence requirements
                </Label>
                <Textarea
                  id="contact-message"
                  name="message"
                  required
                  minLength={20}
                  maxLength={5000}
                  aria-describedby="message-help"
                  className="min-h-36"
                  placeholder="Describe your regional focus, monitoring priorities, and briefing cadence."
                />
                <p id="message-help" className="text-muted-foreground text-xs">
                  20–5,000 characters. Please use sample information.
                </p>
              </div>
              <Button type="submit" disabled={!ready} className="w-full">
                Prepare demo request
              </Button>
              <p role="status" className="text-muted-foreground text-sm">
                {status}
              </p>
              {prepared && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={download}
                  className="w-full"
                >
                  Download inquiry (.txt)
                </Button>
              )}
              <noscript>
                <p>
                  Enable JavaScript to prepare a local inquiry. No submission
                  service is connected.
                </p>
              </noscript>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
