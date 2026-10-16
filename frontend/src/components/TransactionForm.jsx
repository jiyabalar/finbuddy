import { useState } from 'react';
import Button from './ui/Button';
import { Input, Select } from './ui/Fields';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_METHODS } from '../lib/constants';
import { toInputDate } from '../lib/format';

/** Used for both expenses (type="expense") and income (type="income"). */
export default function TransactionForm({ type = 'expense', initial, onSubmit, onCancel }) {
  const isIncome = type === 'income';
  const [form, setForm] = useState({
    amount: initial?.amount ?? '',
    category: initial?.category ?? '',
    date: toInputDate(initial?.transactionDate),
    paymentMethod: initial?.paymentMethod || 'UPI',
    description: initial?.description ?? '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!(Number(form.amount) > 0)) e.amount = 'Enter an amount greater than 0';
    if (!form.category) e.category = isIncome ? 'Choose a source' : 'Choose a category';
    if (!form.date) e.date = 'Pick a date';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    setServerError('');
    try {
      await onSubmit({ type, amount: Number(form.amount), category: form.category, date: form.date, paymentMethod: isIncome ? undefined : form.paymentMethod, description: form.description });
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Amount (₹)" type="number" min="0" step="0.01" inputMode="decimal" value={form.amount} onChange={set('amount')} error={errors.amount} placeholder="e.g. 180" />
        <Select label={isIncome ? 'Source' : 'Category'} value={form.category} onChange={set('category')} error={errors.category} placeholder={isIncome ? 'Select source' : 'Select category'} options={isIncome ? INCOME_SOURCES : EXPENSE_CATEGORIES} />
        <Input label="Date" type="date" value={form.date} onChange={set('date')} error={errors.date} />
        {!isIncome && <Select label="Payment method" value={form.paymentMethod} onChange={set('paymentMethod')} options={PAYMENT_METHODS} />}
      </div>
      <Input label="Description" value={form.description} onChange={set('description')} placeholder={isIncome ? 'e.g. Monthly allowance' : 'e.g. Lunch with friends'} maxLength={200} />
      {serverError && <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-2 text-sm font-bold text-coral">{serverError}</p>}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" loading={saving}>{initial ? 'Save changes' : isIncome ? 'Add income' : 'Add expense'}</Button>
      </div>
    </form>
  );
}
