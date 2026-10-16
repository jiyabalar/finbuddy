import Card from './ui/Card';

export default function ChartCard({ title, subtitle, action, children, tone = 'white', className = '' }) {
  return (
    <Card tone={tone} className={className}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-xl font-extrabold">{title}</h3>{subtitle && <p className="text-sm text-ink/60">{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-full bg-ink/10 p-1" role="tablist">
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${value === v ? 'bg-ink text-paper' : 'text-ink/70 hover:text-ink'}`}>{label}</button>
      ))}
    </div>
  );
}
