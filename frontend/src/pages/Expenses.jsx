import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { Select } from '../components/ui/Fields';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import TransactionForm from '../components/TransactionForm';
import { Tabs } from '../components/ChartCard';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, styleOf } from '../lib/constants';
import { formatDate, formatMoney } from '../lib/format';

export default function Expenses() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('expense');
  const [filters, setFilters] = useState({ q: params.get('q') || '', category: '', from: '', to: '', sort: 'date_desc' });
  const [modal, setModal] = useState(params.get('add') ? { mode: 'add' } : null); // {mode:'add'|'edit'|'view'|'delete', tx?}
  const [toast, setToast] = useState('');
  const [debouncedQ, setDebouncedQ] = useState(filters.q);
  const cur = user.currency;

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(filters.q), 300); return () => clearTimeout(t); }, [filters.q]);
  useEffect(() => { if (params.get('add') || params.get('q') !== null) setParams({}, { replace: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const endpoint = tab === 'income' ? '/income' : '/transactions';
  const query = { ...filters, q: debouncedQ || undefined, category: filters.category || undefined, from: filters.from || undefined, to: filters.to || undefined, ...(tab === 'expense' ? { type: 'expense' } : {}) };
  const { data, loading, error, reload } = useFetch(endpoint, query, 'Unable to load transactions.');
  const items = data?.items || [];
  const total = items.reduce((a, t) => a + t.amount, 0);
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  const save = async (payload) => {
    try {
      if (modal.mode === 'edit') await api.put(`${endpoint}/${modal.tx.id}`, payload);
      else await api.post(endpoint, payload);
    } catch (e) { throw new Error(errorMessage(e, tab === 'income' ? 'Income could not be saved.' : 'Expense could not be saved.')); }
    setModal(null); flash(modal.mode === 'edit' ? 'Changes saved ✅' : tab === 'income' ? 'Income added 💰' : 'Expense added ✅'); reload();
  };
  const remove = async () => {
    try { await api.delete(`${endpoint}/${modal.tx.id}`); setModal(null); flash('Deleted'); reload(); }
    catch (e) { flash(errorMessage(e, 'Could not delete that transaction.')); setModal(null); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold sm:text-4xl">{tab === 'income' ? 'Income' : 'Expenses'}</h1><p className="text-ink/65">{items.length} entries · {formatMoney(total, cur)}</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={tab} onChange={(t) => { setTab(t); setFilters((f) => ({ ...f, category: '' })); }} options={[['expense', 'Expenses'], ['income', 'Income']]} />
          <Button variant="lime" icon={Plus} onClick={() => setModal({ mode: 'add' })}>{tab === 'income' ? 'Add income' : 'Add expense'}</Button>
        </div>
      </div>

      <Card className="!p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" /><input aria-label="Search" className="field !pl-10" placeholder="Search description…" value={filters.q} onChange={set('q')} /></div>
          <Select aria-label="Category" value={filters.category} onChange={set('category')} placeholder={tab === 'income' ? 'All sources' : 'All categories'} options={tab === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES} />
          <input aria-label="From date" type="date" className="field" value={filters.from} onChange={set('from')} />
          <input aria-label="To date" type="date" className="field" value={filters.to} onChange={set('to')} />
          <Select aria-label="Sort" value={filters.sort} onChange={set('sort')} options={[['date_desc', 'Newest first'], ['date_asc', 'Oldest first'], ['amount_desc', 'Amount: high → low'], ['amount_asc', 'Amount: low → high']]} />
        </div>
      </Card>

      {loading && !data ? <Skeleton className="h-72 !rounded-4xl" /> : error ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
        <EmptyState title="Your financial journey starts here 🌱" text={tab === 'income' ? 'No income recorded yet.' : 'No expenses match your filters yet.'} action={tab === 'income' ? 'Add Your First Income' : 'Add Your First Expense'} onAction={() => setModal({ mode: 'add' })} />
      ) : (
        <Card className="overflow-x-auto !p-2 sm:!p-3">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="text-ink/60"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">{tab === 'income' ? 'Source' : 'Category'}</th>{tab === 'expense' && <th className="p-3">Payment</th>}<th className="p-3 text-right">Amount</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-t border-ink/10 hover:bg-ink/5">
                  <td className="whitespace-nowrap p-3">{formatDate(t.transactionDate)}</td>
                  <td className="max-w-[220px] truncate p-3 font-bold">{t.description || '—'}</td>
                  <td className="p-3"><span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: `${styleOf(t.category).color}55` }}>{styleOf(t.category).emoji} {t.category}</span></td>
                  {tab === 'expense' && <td className="p-3">{t.paymentMethod}</td>}
                  <td className={`whitespace-nowrap p-3 text-right font-extrabold ${t.type === 'income' ? 'text-[#0E9F6E]' : ''}`}>{t.type === 'income' ? '+' : '-'}{formatMoney(t.amount, cur)}</td>
                  <td className="whitespace-nowrap p-3 text-right">
                    <button aria-label={`View ${t.description || t.category}`} onClick={() => setModal({ mode: 'view', tx: t })} className="rounded-full p-2 hover:bg-ink/10"><Eye size={17} /></button>
                    <button aria-label={`Edit ${t.description || t.category}`} onClick={() => setModal({ mode: 'edit', tx: t })} className="rounded-full p-2 hover:bg-ink/10"><Pencil size={17} /></button>
                    <button aria-label={`Delete ${t.description || t.category}`} onClick={() => setModal({ mode: 'delete', tx: t })} className="rounded-full p-2 text-coral hover:bg-coral/15"><Trash2 size={17} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal open={modal?.mode === 'add' || modal?.mode === 'edit'} onClose={() => setModal(null)} title={`${modal?.mode === 'edit' ? 'Edit' : 'Add'} ${tab === 'income' ? 'income' : 'expense'}`}>
        <TransactionForm type={tab} initial={modal?.tx} onSubmit={save} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal?.mode === 'view'} onClose={() => setModal(null)} title="Transaction details">
        {modal?.tx && <dl className="grid grid-cols-2 gap-4 text-sm">{[['Amount', formatMoney(modal.tx.amount, cur)], ['Category', modal.tx.category], ['Date', formatDate(modal.tx.transactionDate, { dateStyle: 'medium' })], ['Payment', modal.tx.paymentMethod || '—'], ['Description', modal.tx.description || '—']].map(([k, v]) => <div key={k}><dt className="text-ink/60">{k}</dt><dd className="text-base font-bold">{v}</dd></div>)}</dl>}
      </Modal>
      <Modal open={modal?.mode === 'delete'} onClose={() => setModal(null)} title="Delete this entry?">
        <p className="mb-5 text-ink/70">“{modal?.tx?.description || modal?.tx?.category}” will be removed permanently.</p>
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setModal(null)}>Keep it</Button><Button variant="danger" onClick={remove}>Delete</Button></div>
      </Modal>
      {toast && <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-pop_in rounded-full bg-ink px-5 py-3 text-sm font-bold text-paper shadow-pop">{toast}</div>}
    </div>
  );
}
