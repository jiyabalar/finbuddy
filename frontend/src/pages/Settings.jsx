import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Input, Select, Toggle } from '../components/ui/Fields';
import { AVATARS, CURRENCIES, DISCLAIMER } from '../lib/constants';

export default function Settings() {
  const { user, updateProfile, dark, setDark } = useAuth();
  const prefs = { notifications: true, budgetAlerts: true, ...(user.preferences || {}) };
  const [f, setF] = useState({ name: user.name, email: user.email, college: user.college || '', monthlyIncome: user.monthlyIncome, currency: user.currency, avatar: user.avatar || '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (patch, okText = 'Saved ✅') => {
    setSaving(true); setMsg({ type: '', text: '' });
    try { await updateProfile(patch); setMsg({ type: 'ok', text: okText }); } catch (e) { setMsg({ type: 'err', text: errorMessage(e, 'Could not save your changes.') }); } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div><h1 className="text-3xl font-extrabold sm:text-4xl">Profile & settings</h1></div>
      {msg.text && <p role={msg.type === 'err' ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm font-bold ${msg.type === 'err' ? 'bg-coral/15 text-coral' : 'bg-mint/50'}`}>{msg.text}</p>}
      <Card>
        <h3 className="mb-4 text-xl font-extrabold">Profile</h3>
        <div className="mb-5"><p className="mb-2 text-sm font-bold">Avatar</p><div className="flex flex-wrap gap-2">{AVATARS.map((a) => <button key={a} type="button" onClick={() => setF({ ...f, avatar: a })} aria-label={`Avatar ${a}`} aria-pressed={f.avatar === a} className={`grid h-12 w-12 place-items-center rounded-full text-2xl ${f.avatar === a ? 'bg-lime ring-2 ring-ink' : 'bg-ink/5'}`}>{a}</button>)}</div></div>
        <form onSubmit={(e) => { e.preventDefault(); save({ ...f, monthlyIncome: Number(f.monthlyIncome) || 0, avatar: f.avatar || null }); }} className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" value={f.name} onChange={set('name')} />
          <Input label="Email" type="email" value={f.email} onChange={set('email')} />
          <Input label="College / University" value={f.college} onChange={set('college')} />
          <Input label="Monthly income" type="number" min="0" value={f.monthlyIncome} onChange={set('monthlyIncome')} />
          <Select label="Currency" value={f.currency} onChange={set('currency')} options={CURRENCIES} />
          <div className="flex items-end justify-end sm:col-span-2"><Button type="submit" loading={saving}>Save profile</Button></div>
        </form>
      </Card>
      <Card>
        <h3 className="mb-4 text-xl font-extrabold">Preferences</h3>
        <div className="space-y-3">
          <Toggle label="Dark mode" hint="Easier on the eyes at night" checked={dark} onChange={(v) => { setDark(v); save({ preferences: { darkMode: v } }, 'Theme saved'); }} />
          <Toggle label="Notifications" hint="Show alerts in the notification center" checked={prefs.notifications} onChange={(v) => save({ preferences: { notifications: v } }, 'Preference saved')} />
          <Toggle label="Budget alerts" hint="Warn me at 80% and 100% of a category budget" checked={prefs.budgetAlerts} onChange={(v) => save({ preferences: { budgetAlerts: v } }, 'Preference saved')} />
        </div>
      </Card>
      <p className="rounded-3xl bg-lilac px-5 py-4 text-sm">{DISCLAIMER}</p>
    </div>
  );
}
