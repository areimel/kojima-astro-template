import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rows = [
  ["Monitoring topics", "5", "25", "100"],
  ["Research workspaces", "1", "5", "20"],
  ["Briefing cadence", "Weekly", "Daily", "Custom"],
  ["Research focus", "Individual desk", "Analyst team", "Multiple teams"],
  ["Monthly / analyst", "$40", "$100", "$200"],
  ["Annual / analyst", "$384", "$960", "$1,920"],
];

export const PricingTable = () => (
  <section className="pb-24 lg:pb-28" aria-labelledby="comparison-title">
    <div className="container">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="kicker mb-4">Scope / Plan comparison</p>
          <h2 id="comparison-title" className="text-3xl md:text-4xl">
            Match the scope of your work.
          </h2>
        </div>
        <Button asChild variant="outline">
          <a href="/contact">Discuss requirements</a>
        </Button>
      </div>
      <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
        A fictional planning framework, not a list of available services.
        Monitoring and briefing workflows are product concepts in this demo.
      </p>
      <div className="bg-card border p-4 md:p-6">
        <Table>
          <TableCaption>
            Illustrative USD pricing. Annual totals include a 20% discount over
            twelve monthly payments. Scroll horizontally on smaller screens.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Demo scope</TableHead>
              {["Observer", "Analyst", "Directorate"].map((name) => (
                <TableHead key={name} scope="col">
                  {name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(([label, ...values]) => (
              <TableRow key={label}>
                <TableHead scope="row" className="py-5">
                  {label}
                </TableHead>
                {values.map((value, index) => (
                  <TableCell
                    key={index}
                    className="px-4 py-5 font-mono text-xs"
                  >
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  </section>
);
