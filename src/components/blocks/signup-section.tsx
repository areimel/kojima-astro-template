import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SignupSection = () => {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => setReady(true), []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = form.querySelector<HTMLInputElement>("#demo-name");
    if (!name?.value.trim()) {
      setStatus("Enter a name containing more than spaces.");
      name?.focus();
      return;
    }
    form.reset();
    setStatus(
      "Demo validation complete. No account was created and no request was sent. The form has been cleared; no credentials were sent or saved.",
    );
  }
  return (
    <section className="py-24 lg:pt-40 lg:pb-28">
      <div className="container grid items-start gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="kicker mb-6">Kojima / Access protocol</p>
          <h1 className="section-heading">Give your team a clearer picture.</h1>
          <p className="text-muted-foreground mt-6 max-w-lg text-lg">
            Explore a workspace concept for corporate intelligence and
            geopolitical risk teams, from regional monitoring to executive
            briefings.
          </p>
          <div className="technical-panel mt-10">
            <p className="technical-label mb-3">
              Environment / Demonstration only
            </p>
            <p className="text-muted-foreground text-sm">
              This interface has no account service or backend. Use a sample
              email and a made-up password. Credentials are not sent or stored
              by this demo.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-6">
            <a href="/contact">Prepare an access inquiry</a>
          </Button>
        </div>
        <Card className="rounded-none shadow-none">
          <CardHeader>
            <p className="technical-label">Local form / Registration</p>
            <h2 className="text-2xl">Preview registration.</h2>
            <p className="text-muted-foreground text-sm">
              Checks form validity only. No account will be created.
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={submit}
              onChange={() => setStatus("")}
              autoComplete="off"
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="demo-name">Sample name</Label>
                <Input
                  id="demo-name"
                  required
                  maxLength={120}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-email">Sample work email</Label>
                <Input
                  id="demo-email"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="off"
                  placeholder="analyst@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-password">Demo password</Label>
                <Input
                  id="demo-password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-describedby="password-help"
                />
                <p id="password-help" className="text-muted-foreground text-xs">
                  Use 8–128 characters. Do not use a real password.
                </p>
              </div>
              <Button type="submit" disabled={!ready} className="w-full">
                Validate demo registration
              </Button>
              <p role="status" className="text-muted-foreground text-sm">
                {status}
              </p>
              <noscript>
                <p>
                  Enable JavaScript for local form validation. No account
                  service is connected.
                </p>
              </noscript>
            </form>
            <p className="text-muted-foreground mt-6 border-t pt-6 text-sm">
              Explore the entry flow.{" "}
              <a
                href="/login"
                className="text-foreground underline underline-offset-4"
              >
                Demo sign-in
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SignupSection;
