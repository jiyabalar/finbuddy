import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import ChartCard from '../components/ChartCard';
import { ErrorState, PageSkeleton } from '../components/ui/States';
import { styleOf } from '../lib/constants';
import { formatDate, formatMoney } from '../lib/format';

const axis = { tickLine: false, axisLine: false, tick: { fontSize: 11, fill: 'currentColor' } };
const tip = { contentStyle: { borderRadius: 16, border: 'none', boxShadow: '0 10px 30px -12px rgba(27,24,72,.3)' } };

export default function Insights() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/analytics/trends', { months: 6 }, 'Unable to load your insights.');
  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const money = (n) => formatMoney(n, user.currency);
  const { series, categories, stats } = data;
  const total = categories.reduce((a, c) => a + c.total, 0);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold sm:text-4xl">Insights</h1><p className="text-ink/65">The last 6 months at a glance.</p></div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card tone="lime"><p className="text-sm font-bold opacity-80">Highest spending day</p><p className="font-display text-3xl font-extrabold">{stats.highestSpendingDay ? money(stats.highestSpendingDay.amount) : '—'}</p><p className="text-xs font-bold opacity-70">{stats.highestSpendingDay ? formatDate(stats.highestSpendingDay.date, { dateStyle: 'medium' }) : 'No spending yet'}</p></Card>
        <Card tone="lilac"><p className="text-sm font-bold opacity-80">Average daily spending</p><p className="font-display text-3xl font-extrabold">{money(stats.averageDailySpending)}</p><p className="text-xs font-bold opacity-70">This month</p></Card>
        <Card tone="brand"><p className="text-sm font-bold opacity-80">Average monthly spending</p><p className="font-display text-3xl font-extrabold">{money(stats.averageMonthlySpending)}</p></Card>
        <Card tone="mint"><p className="text-sm font-bold opacity-80">Savings percentage</p><p className="font-display text-3xl font-extrabold">{Math.round(stats.savingsPercentage)}%</p><p className="text-xs font-bold opacity-70">Of this month’s income</p></Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Monthly spending trend">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={series} margin={{ left: -12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} /><Tooltip formatter={(v) => money(v)} {...tip} /><Line type="monotone" dataKey="expenses" name="Spent" stroke="#5B54D6" strokeWidth={4} dot={{ r: 5, fill: '#DDF247', stroke: '#5B54D6', strokeWidth: 3 }} /></LineChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="Category breakdown" subtitle="This month">
          {categories.length === 0 ? <p className="py-20 text-center text-ink/60">No expenses this month.</p> : (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="total" nameKey="category" innerRadius={55} outerRadius={95} paddingAngle={3} cornerRadius={8}>{categories.map((c) => <Cell key={c.category} fill={styleOf(c.category).color} stroke="none" />)}</Pie><Tooltip formatter={(v) => money(v)} {...tip} /><Legend iconType="circle" /></PieChart></ResponsiveContainer></div>
          )}
        </ChartCard>
        <ChartCard title="Income vs expense">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={series} margin={{ left: -12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} /><Tooltip formatter={(v) => money(v)} {...tip} /><Legend iconType="circle" /><Bar dataKey="income" name="Income" fill="#7EE2B8" radius={[8, 8, 0, 0]} /><Bar dataKey="expenses" name="Expenses" fill="#5B54D6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </ChartCard>
        <ChartCard title="Savings trend">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={series} margin={{ left: -12 }}><defs><linearGradient id="sv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7EE2B8" stopOpacity={0.9} /><stop offset="100%" stopColor="#7EE2B8" stopOpacity={0.05} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} /><XAxis dataKey="label" {...axis} /><YAxis {...axis} /><Tooltip formatter={(v) => money(v)} {...tip} /><Area type="monotone" dataKey="savings" name="Savings" stroke="#0E9F6E" strokeWidth={3} fill="url(#sv)" /></AreaChart></ResponsiveContainer></div>
        </ChartCard>
      </section>

      <ChartCard title="Top spending categories" subtitle="This month" tone="lilac">
        {categories.length === 0 ? <p className="text-sm">Nothing to rank yet.</p> : (
          <ol className="space-y-3">
            {categories.slice(0, 5).map((c, i) => (
              <li key={c.category} className="flex items-center gap-3 rounded-3xl bg-card/70 p-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-ink font-display font-extrabold text-paper">{i + 1}</span>
                <span className="flex-1 font-bold">{styleOf(c.category).emoji} {c.category}</span>
                <span className="hidden h-2.5 w-32 overflow-hidden rounded-full bg-ink/10 sm:block"><span className="block h-full rounded-full bg-brand" style={{ width: `${(c.total / total) * 100}%` }} /></span>
                <span className="font-extrabold">{money(c.total)}</span>
              </li>
            ))}
          </ol>
        )}
      </ChartCard>
    </div>
  );
}
