import { cn } from '@/lib/utils';

export const meta = 'font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground';

export function PanelHeading({ number, title, detail, className }: { number: string; title: string; detail: string; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-5 py-4 sm:px-7', className)}>
      <h2 className="text-sm font-medium"><span className="mr-4 font-mono text-primary">{number}</span>{title}</h2>
      <span className={meta}>{detail}</span>
    </div>
  );
}
