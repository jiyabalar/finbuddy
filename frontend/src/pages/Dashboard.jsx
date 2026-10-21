import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Lightbulb, PiggyBank, Plus, Wallet } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui/States';
import { FinnyBubble } from '../components/Mascot';
import ChartCard, { Tabs } from '../components/ChartCard';
import BudgetProgress from '../components/BudgetProgress';
import TransactionCard from '../components/TransactionCard';
import { Sparkle } from '../components/ui/Deco';
import { useAuth } from '../context/AuthContext';
import { styleOf } from '../lib/constants';
import { formatDate, formatMoney, greeting } from '../lib/format';

function SummaryCard({ tone, label, value, icon: Icon, sub }) {
  return (
    <Card tone={tone} className="relative overflow-hidden">
      <Icon className="absolute right-5 top-5 opacity-60" size={22} />
      <p className="text-sm font-bold opacity-80">{label}</p>
      <p className="mt-3 font-display text-4xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs font-bold opacity-75">{sub}</p>}
    </Card>
  );
}

function HealthScore({ health }) {
  const r = 54; const c = 2 * Math.PI * r;
  const color = health.score >= 80 ? '#7EE2B8' : health.score >= 60 ? '#DDF247' : health.score >= 40 ? '#FFC93C' : '#FF7A6B';
  return (
    <Card tone="brand" className="relative overflow-hidden">
      <Sparkle className="absolute right-5 top-5" size={26} color="#DDF247" />
      <h3 className="text-xl font-extrabold">Financial health</h3>
      <div className="mt-3 flex items-center gap-5">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 130 130" className="-rotate-90" role="img" aria-label={`Health score ${health.score} out of 100`}>
            <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="14" />
            <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - health.score / 100)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center"><div><p className="font-display text-4xl font-extrabold leading-none">{health.score}</p><p className="text-xs opacity-80">/ 100</p></div></div>
        </div>
        <div><p className="font-display text-2xl font-extrabold">{health.label}</p><p className="mt-1 text-sm text-white/80">{health.explanation}</p></div>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/80">
        {health.factors.map((f) => <li key={f.name} className="flex justify-between"><span>{f.name}</span><b>{Math.round(f.points)}/{f.max}</b></li>)}
      </ul>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [period, setPeriod] = useState('month');
  const { data, loading, error, reload } = useFetch('/analytics/overview', { period }, 'Unable to load your dashboard.');
  const [selected, setSelected] = useState(null);

  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const cur = data.user.currency;
  const money = (n) => formatMoney(n, cur);
  const { summary, health, spending, budget, recent, insights, finny } = data;
  const brandNew = recent.length === 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{greeting()}, {user.name.split(' ')[0]}! 👋</h1>
          <p className="text-ink/65">your money , your goals , your future -manage it .</p>
        </div>
        <Button variant="lime" icon={Plus} onClick={() => nav('/expenses?add=1')}>Add expense</Button>
      </section>

      <FinnyBubble mood={finny.mood} size={104}>{finny.message}</FinnyBubble>

      {brandNew ? (
        <EmptyState title="Your financial journey starts here 🌱" text="Add your income and first expense — your dashboard will come alive." action="Add Your First Expense" onAction={() => nav('/expenses?add=1')} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
            <SummaryCard tone="lime" label="Total income" value={money(summary.income)} icon={ArrowDownLeft} sub="This month" />
            <SummaryCard tone="lilac" label="Total spent" value={money(summary.expenses)} icon={ArrowUpRight} sub={data.prediction ? `On pace for ${money(data.prediction)}` : undefined} />
            <SummaryCard tone="brand" label="Remaining" value={money(summary.remaining)} icon={Wallet} sub="Income − expenses" />
            <SummaryCard tone="mint" label="Savings" value={money(summary.savings)} icon={PiggyBank} sub={`${Math.round(summary.savingsRate)}% savings rate`} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <HealthScore health={health} />
            <ChartCard title="Spending overview" subtitle={`${money(spending.total)} spent`}
              action={<Tabs value={period} onChange={setPeriod} options={[['week', 'This week'], ['month', 'This month'], ['lastMonth', 'Last month']]} />}>
              {spending.byCategory.length === 0 ? <p className="py-16 text-center text-ink/60">No spending in this period yet.</p> : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spending.byCategory} margin={{ left: -12, right: 4 }}>
                      <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} interval={0} angle={-25} height={50} textAnchor="end" />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'currentColor' }} />
                      <Tooltip formatter={(v) => money(v)} cursor={{ fill: 'rgba(91,84,214,.08)' }} contentStyle={{ borderRadius: 16, border: 'none' }} />
                      <Bar dataKey="total" radius={[10, 10, 10, 10]}>{spending.byCategory.map((c) => <Cell key={c.category} fill={styleOf(c.category).color} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-extrabold">Budget overview</h3><button onClick={() => nav('/budget')} className="text-sm font-bold text-brand underline dark:text-brand-soft">Manage</button></div>
              {budget.hasBudget ? <div className="space-y-5">{budget.rows.slice(0, 5).map((r) => <BudgetProgress key={r.id} {...r} currency={cur} />)}</div>
                : <EmptyState title="No budget yet" text="Create a monthly budget and I’ll warn you before you overspend." action="Create budget" onAction={() => nav('/budget')} />}
            </Card>
            <Card>
              <div className="mb-2 flex items-center justify-between"><h3 className="text-xl font-extrabold">Recent transactions</h3><button onClick={() => nav('/expenses')} className="text-sm font-bold text-brand underline dark:text-brand-soft">See all</button></div>
              {recent.map((t) => <TransactionCard key={t.id} tx={t} currency={cur} onClick={setSelected} />)}
            </Card>
          </section>

          <Card tone="lilac">
            <h3 className="mb-3 flex items-center gap-2 text-xl font-extrabold"><Lightbulb size={20} />Smart insights</h3>
            {insights.length === 0 ? <p className="text-sm">Add a few more transactions and I’ll find patterns for you.</p> : (
              <ul className="grid gap-2 md:grid-cols-2">
                {insights.map((i) => <li key={i.text} className={`rounded-2xl bg-card/70 px-4 py-3 text-sm font-bold ${i.tone === 'warn' ? 'border-l-4 border-sun' : i.tone === 'good' ? 'border-l-4 border-mint' : 'border-l-4 border-brand'}`}>{i.text}</li>)}
                {data.recommendation.length > 0 && <li className="rounded-2xl border-l-4 border-brand bg-card/70 px-4 py-3 text-sm font-bold">Consider allocating {money(data.recommendation[0].amount)} to {data.recommendation[0].category.toLowerCase()} next month.</li>}
              </ul>
            )}
          </Card>
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction details">
        {selected && (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[['Type', selected.type], ['Amount', money(selected.amount)], ['Category', selected.category], ['Date', formatDate(selected.transactionDate, { dateStyle: 'medium' })], ['Payment', selected.paymentMethod || '—'], ['Description', selected.description || '—']].map(([k, v]) => (
              <div key={k}><dt className="text-ink/60">{k}</dt><dd className="text-base font-bold capitalize">{v}</dd></div>
            ))}
          </dl>
        )}
      </Modal>
    </div>
  );
}
