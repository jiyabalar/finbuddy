import { AlertTriangle, Flame } from 'lucide-react';
import { styleOf } from '../lib/constants';
import { formatMoney } from '../lib/format';

const BAR = { ok: 'bg-mint', warning: 'bg-sun', danger: 'bg-coral' };

export default function BudgetProgress({ category, spent, allocated, percent, status, currency }) {
  const pct = Math.round(percent);
  return (
    <div className="space-y-2" data-testid={`budget-${category}`}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-bold"><span aria-hidden="true">{styleOf(category).emoji}</span>{category}</span>
        <span className="text-ink/70"><b className="text-ink">{formatMoney(spent, currency)}</b> / {formatMoney(allocated, currency)}</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${category} budget used`}>
        <div className={`h-full rounded-full transition-all duration-700 ${BAR[status]}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="flex items-center justify-between text-xs font-bold">
        <span>{pct}%</span>
        {status === 'warning' && <span className="flex items-center gap-1 text-[#B27A00] dark:text-sun"><AlertTriangle size={13} /> Almost there — slow down</span>}
        {status === 'danger' && <span className="flex items-center gap-1 text-coral"><Flame size={13} /> Over budget</span>}
      </div>
    </div>
  );
}
