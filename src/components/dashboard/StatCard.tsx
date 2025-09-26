import Card from '../ui/Card';

export default function StatCard({ title, value, timeframe = '30D', subtitle }: { title: string; value: string | number; timeframe?: '1D'|'1W'|'30D'; subtitle?: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {subtitle && <div className="mt-1 text-xs text-muted max-w-xs">{subtitle}</div>}
        </div>
        <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold text-muted">{timeframe}</span>
      </div>
      <div className="mt-6 text-center">
        <div className="text-3xl font-semibold text-indigo-600 dark:text-indigo-400">{value}</div>
        <div className="text-xs text-subtle">Avg/ day</div>
      </div>
      <div className="mt-6 flex items-center justify-center gap-6 text-[10px] text-muted">
        <div className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-sky-500 inline-block"></span> Google Ads</div>
        <div className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-indigo-500 inline-block"></span> Meta Ads</div>
      </div>
    </Card>
  );
}

