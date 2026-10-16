import { useState } from 'react';
import { Lightbulb, Pencil } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Fields';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui/States';
import { FinnyBubble } from '../components/Mascot';
import BudgetProgress from '../components/BudgetProgress';
import { BUDGET_CATEGORIES, styleOf } from '../lib/constants';
import { formatMoney } from '../lib/format';

function BudgetForm({ existing, suggestion, onDone, onCancel }) {
  const initial = Object.fromEntries(BUDGET_CATEGORIES.map((c) => [c, existing?.rows.find((r) => r.category === c)?.allocated ?? suggestion?.[c] ?? '']));
  const [total, setTotal] = useState(existing?.budget?.totalBudget ?? '');
  const [alloc, setAlloc] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const allocated = Object.values(alloc).reduce((a, v) => a + (Number(v) || 0), 0);
  const left = (Number(total) || 0) - allocated;
  const now = new Date();

  const submit = async (e) => {
    e.preventDefault();
    if (!(Number(total) > 0)) return setError('Enter your total monthly budget.');
    if (left < 0) return setError('Category amounts add up to more than your total budget.');
    const categories = Object.entries(alloc).filter(([, v]) => Number(v) > 0).map(([category, v]) => ({ category, allocatedAmount: Number(v) }));
    if (!categories.length) return setError('Allocate money to at least one category.');
    setSaving(true); setError('');
    const body = { month: now.getMonth() + 1, year: now.getFullYear(), totalBudget: Number(total), categories };
    try {
      if (existing?.budget) await api.put(`/budgets/${existing.budget.id}`, body); else await api.post('/budgets', body);
      onDone();
    } catch (err) { setError(errorMessage(err, 'Budget could not be created.')); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Input label="Total monthly budget (₹)" type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="e.g. 10000" />
      <div className="grid gap-3 sm:grid-cols-2">
        {BUDGET_CATEGORIES.map((c) => <Input key={c} label={`${styleOf(c).emoji} ${c}`} type="number" min="0" value={alloc[c]} onChange={(e) => setAlloc({ ...alloc, [c]: e.target.value })} />)}
      </div>
      <p className={`rounded-2xl px-4 py-2 text-sm font-bold ${left < 0 ? 'bg-coral/15 text-coral' : 'bg-mint/40'}`}>{left < 0 ? `Over by ${formatMoney(-left)}` : `${formatMoney(left)} unallocated`}</p>
      {error && <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-2 text-sm font-bold text-coral">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit" loading={saving}>{existing?.budget ? 'Update budget' : 'Create budget'}</Button></div>
    </form>
  );
}

export default function Budget() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/budgets', null, 'Unable to load your budget.');
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const cur = user.currency;
  const money = (n) => formatMoney(n, cur);

  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { budget, rows, totals, recommendation, health } = data;
  const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const worst = [...rows].sort((a, b) => b.percent - a.percent)[0];
  const mood = !budget ? 'neutral' : rows.some((r) => r.status === 'danger') ? 'sad' : rows.some((r) => r.status === 'warning') ? 'worried' : 'happy';
  const useSuggestion = () => { setSuggestion(Object.fromEntries(recommendation.map((r) => [r.category, r.amount]))); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold sm:text-4xl">Smart budget</h1><p className="text-ink/65">{month}</p></div>
        <Button variant="lime" icon={Pencil} onClick={() => { setSuggestion(null); setOpen(true); }}>{budget ? 'Edit budget' : 'Create budget'}</Button>
      </div>

      {!budget ? (
        <EmptyState title="No budget for this month" text="Split your month into categories. I’ll warn you at 80% and cheer when you stay under." action="Create budget" onAction={() => setOpen(true)} />
      ) : (
        <>
          <FinnyBubble mood={mood}>
            {mood === 'happy' && 'You’re doing great! You’re under budget this month.'}
            {mood === 'worried' && `Careful — ${worst.category} is at ${Math.round(worst.percent)}% of its limit.`}
            {mood === 'sad' && `Uh-oh. ${worst.category} has gone over budget. Let’s cut back elsewhere.`}
          </FinnyBubble>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card tone="brand"><p className="text-sm font-bold opacity-80">Budget</p><p className="font-display text-4xl font-extrabold">{money(budget.totalBudget)}</p></Card>
            <Card tone="lilac"><p className="text-sm font-bold opacity-80">Actual spending</p><p className="font-display text-4xl font-extrabold">{money(totals.spent)}</p></Card>
            <Card tone={totals.remaining < 0 ? 'sun' : 'lime'}><p className="text-sm font-bold opacity-80">Remaining</p><p className="font-display text-4xl font-extrabold">{money(totals.remaining)}</p></Card>
            <Card tone="mint"><p className="text-sm font-bold opacity-80">Percentage used</p><p className="font-display text-4xl font-extrabold">{Math.round(totals.percent)}%</p></Card>
          </section>
          <Card>
            <h3 className="mb-5 text-xl font-extrabold">Category budgets</h3>
            <div className="grid gap-6 md:grid-cols-2">{rows.map((r) => <BudgetProgress key={r.id} {...r} currency={cur} />)}</div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-ink/60"><tr><th className="py-2">Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th className="text-right">Used</th></tr></thead>
                <tbody>{rows.map((r) => <tr key={r.id} className="border-t border-ink/10"><td className="py-2.5 font-bold">{styleOf(r.category).emoji} {r.category}</td><td>{money(r.allocated)}</td><td>{money(r.spent)}</td><td className={r.remaining < 0 ? 'font-bold text-coral' : ''}>{money(r.remaining)}</td><td className="text-right font-bold">{Math.round(r.percent)}%</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Card tone="lilac">
        <h3 className="mb-2 flex items-center gap-2 text-xl font-extrabold"><Lightbulb size={20} />Budget recommendation</h3>
        {recommendation.length ? (
          <>
            <p className="mb-3 text-sm">Based on what you actually spent (+5% buffer, rounded up). Health score this month: <b>{health.score}/100</b>.</p>
            <ul className="mb-4 flex flex-wrap gap-2">{recommendation.map((r) => <li key={r.category} className="rounded-full bg-card px-4 py-2 text-sm font-bold">Consider allocating {money(r.amount)} to {r.category.toLowerCase()}</li>)}</ul>
            <Button variant="ink" onClick={useSuggestion}>Use these suggestions</Button>
          </>
        ) : <p className="text-sm">Add some expenses and I’ll suggest category limits based on your habits.</p>}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={budget ? 'Edit monthly budget' : 'Create monthly budget'} wide>
        <BudgetForm existing={data} suggestion={suggestion} onCancel={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />
      </Modal>
    </div>
  );
}
