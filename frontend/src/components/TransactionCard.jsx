import { styleOf } from '../lib/constants';
import { formatDate, formatMoney } from '../lib/format';

export default function TransactionCard({ tx, onClick, currency }) {
  const income = tx.type === 'income';
  const s = styleOf(tx.category);
  return (
    <button onClick={() => onClick?.(tx)} className="flex w-full items-center gap-3 rounded-3xl p-2.5 text-left transition hover:bg-ink/5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl" style={{ background: `${s.color}55` }} aria-hidden="true">{s.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{tx.description || tx.category}</span>
        <span className="block text-xs text-ink/60">{tx.category} · {formatDate(tx.transactionDate)}</span>
      </span>
      <span className={`font-extrabold ${income ? 'text-[#0E9F6E]' : ''}`}>{income ? '+' : '-'}{formatMoney(tx.amount, currency)}</span>
    </button>
  );
}
