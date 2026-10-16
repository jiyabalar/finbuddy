import { useState } from 'react';
import { CalendarClock, Pencil, PiggyBank, Plus, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/Fields';
import { EmptyState, ErrorState, PageSkeleton } from '../components/ui/States';
import Mascot from '../components/Mascot';
import { formatDate, formatMoney, toInputDate } from '../lib/format';

function GoalForm({ initial, onDone, onCancel }) {
  const [f, setF] = useState({ name: initial?.name ?? '', targetAmount: initial?.targetAmount ?? '', currentAmount: initial?.currentAmount ?? 0, targetDate: initial?.targetDate ? toInputDate(initial.targetDate) : '', category: initial?.category ?? '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setError('Give your goal a name.');
    if (!(Number(f.targetAmount) > 0)) return setError('Target amount must be greater than 0.');
    setSaving(true); setError('');
    try {
      const body = { ...f, targetAmount: Number(f.targetAmount), currentAmount: Number(f.currentAmount) || 0, targetDate: f.targetDate || null };
      if (initial) await api.put(`/goals/${initial.id}`, body); else await api.post('/goals', body);
      onDone();
    } catch (err) { setError(errorMessage(err, 'Goal could not be saved.')); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Input label="Goal name" value={f.name} onChange={set('name')} placeholder="e.g. Buy headphones" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Target amount (₹)" type="number" min="0" value={f.targetAmount} onChange={set('targetAmount')} />
        <Input label="Saved so far (₹)" type="number" min="0" value={f.currentAmount} onChange={set('currentAmount')} />
        <Input label="Target date" type="date" value={f.targetDate} onChange={set('targetDate')} />
        <Input label="Category" value={f.category} onChange={set('category')} placeholder="Tech, Travel…" />
      </div>
      {error && <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-2 text-sm font-bold text-coral">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button><Button type="submit" loading={saving}>{initial ? 'Save goal' : 'Create goal'}</Button></div>
    </form>
  );
}

export default function Goals() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/goals', null, 'Unable to load your goals.');
  const [modal, setModal] = useState(null); // {mode:'form'|'add'|'delete', goal?}
  const [amount, setAmount] = useState('');
  const [err, setErr] = useState('');
  const money = (n) => formatMoney(n, user.currency);
  const close = () => { setModal(null); setAmount(''); setErr(''); };

  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const goals = data.items;

  const contribute = async (e) => {
    e.preventDefault();
    if (!(Number(amount) > 0)) return setErr('Enter an amount greater than 0.');
    try { await api.post(`/goals/${modal.goal.id}/contribute`, { amount: Number(amount) }); close(); reload(); } catch (x) { setErr(errorMessage(x)); }
  };
  const remove = async () => { try { await api.delete(`/goals/${modal.goal.id}`); close(); reload(); } catch (x) { setErr(errorMessage(x, 'Could not delete this goal.')); } };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold sm:text-4xl">Savings goals</h1><p className="text-ink/65">You’re saving about {money(data.monthlySaving)} this month.</p></div>
        <Button variant="lime" icon={Plus} onClick={() => setModal({ mode: 'form' })}>New goal</Button>
      </div>
      {goals.length === 0 ? (
        <EmptyState title="Dream big, save small 🎯" text="Create a goal — headphones, a laptop, a trip — and I’ll estimate when you’ll get there." action="Create your first goal" onAction={() => setModal({ mode: 'form' })} />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g, i) => {
            const p = g.projection;
            const tone = p.completed ? 'lime' : ['lilac', 'mint', 'white'][i % 3];
            return (
              <Card key={g.id} tone={tone} className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="text-2xl font-extrabold">{g.name}</h3>{g.category && <span className="text-xs font-bold opacity-70">{g.category}</span>}</div>
                  <Mascot mood={p.completed ? 'celebrating' : p.percent >= 50 ? 'happy' : 'neutral'} size={64} label="" />
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-sm font-bold"><span>{money(g.currentAmount)} saved</span><span>{money(g.targetAmount)}</span></div>
                  <div className="h-4 overflow-hidden rounded-full bg-ink/15" role="progressbar" aria-valuenow={Math.round(p.percent)} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.name} progress`}><div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${p.percent}%` }} /></div>
                  <div className="mt-1.5 flex justify-between text-xs font-bold"><span>{Math.round(p.percent)}%</span><span>{p.completed ? 'Goal reached! 🎉' : `${money(p.remaining)} to go`}</span></div>
                </div>
                <p className="flex items-center gap-2 text-sm"><CalendarClock size={16} />
                  {p.completed ? 'Fully funded' : p.estimatedDate ? <>Estimated: <b>{formatDate(p.estimatedDate, { month: 'long', year: 'numeric' })}</b> (~{p.monthsLeft} mo)</> : 'Save some money this month to see an estimate'}
                  {g.targetDate && !p.completed && <span className="opacity-70"> · target {formatDate(g.targetDate, { month: 'short', year: 'numeric' })}</span>}
                </p>
                {!p.completed && p.monthsIfExtra && p.monthsLeft && p.monthsIfExtra < p.monthsLeft && <p className="rounded-2xl bg-card/60 px-3 py-2 text-xs font-bold">💡 Saving ₹500 more per month could get you there {p.monthsLeft - p.monthsIfExtra} month(s) earlier.</p>}
                <div className="mt-auto flex flex-wrap gap-2">
                  {!p.completed && <Button variant="primary" icon={PiggyBank} onClick={() => setModal({ mode: 'add', goal: g })}>Add money</Button>}
                  <Button variant="ghost" icon={Pencil} onClick={() => setModal({ mode: 'form', goal: g })} aria-label={`Edit ${g.name}`}>Edit</Button>
                  <Button variant="ghost" icon={Trash2} onClick={() => setModal({ mode: 'delete', goal: g })} aria-label={`Delete ${g.name}`}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Modal open={modal?.mode === 'form'} onClose={close} title={modal?.goal ? 'Edit goal' : 'New savings goal'}><GoalForm initial={modal?.goal} onCancel={close} onDone={() => { close(); reload(); }} /></Modal>
      <Modal open={modal?.mode === 'add'} onClose={close} title={`Add money to ${modal?.goal?.name}`}>
        <form onSubmit={contribute} className="space-y-4" noValidate>
          <Input label="Amount (₹)" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus error={err} />
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={close}>Cancel</Button><Button type="submit">Add money</Button></div>
        </form>
      </Modal>
      <Modal open={modal?.mode === 'delete'} onClose={close} title="Delete this goal?">
        <p className="mb-5 text-ink/70">“{modal?.goal?.name}” and its progress will be removed.</p>
        {err && <p role="alert" className="mb-3 text-sm font-bold text-coral">{err}</p>}
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={close}>Keep it</Button><Button variant="danger" onClick={remove}>Delete</Button></div>
      </Modal>
    </div>
  );
}
