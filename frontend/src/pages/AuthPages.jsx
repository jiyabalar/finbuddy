import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Fields';
import Mascot from '../components/Mascot';
import { Logo } from '../components/Layout';
import { Flower, Sparkle } from '../components/ui/Deco';

function Shell({ title, subtitle, mood, children, side }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-brand p-10 text-white lg:flex lg:flex-col">
        <Logo className="text-white" />
        <Flower size={420} color="#6E67E6" className="absolute -bottom-24 -right-24" />
        <Sparkle className="absolute right-20 top-24" size={44} color="#DDF247" />
        <div className="relative my-auto"><Mascot mood={mood} size={230} /><p className="mt-6 font-display text-4xl font-extrabold leading-tight">{side}</p></div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Logo className="mb-8 lg:hidden" />
          <h1 className="text-4xl font-extrabold">{title}</h1>
          <p className="mb-7 mt-1 text-ink/70">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) v.email = 'Enter a valid email';
    if (!form.password) v.password = 'Enter your password';
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true); setError('');
    try { await login(form.email, form.password, form.remember); nav(loc.state?.from?.pathname || '/dashboard', { replace: true }); }
    catch (err) { setError(errorMessage(err, 'Invalid email or password.')); }
    finally { setLoading(false); }
  };

  return (
    <Shell title="Welcome back 👋" subtitle="Log in to see how your money is doing." mood="happy" side="Your money. Your goals. Your smarter future.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="you@college.edu" />
        <Input label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} className="h-4 w-4 accent-[#5B54D6]" />Remember me</label>
          <button type="button" onClick={() => setForgot(!forgot)} className="font-bold text-brand underline dark:text-brand-soft">Forgot password?</button>
        </div>
        {forgot && <p className="rounded-2xl bg-lilac px-4 py-3 text-sm">Password reset by email is a UI placeholder in this version. Ask an admin to reset it, or register a new account.</p>}
        {error && <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-sm font-bold text-coral">{error}</p>}
        <Button type="submit" loading={loading} className="w-full !py-3.5">Login</Button>
        <p className="text-center text-sm">New here? <Link to="/register" className="font-bold text-brand underline dark:text-brand-soft">Create an account</Link></p>
        <p className="rounded-2xl bg-lime/60 px-4 py-3 text-xs"><b>Demo:</b> jiya@finbuddy.demo / Demo@1234</p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', college: '', monthlyIncome: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (form.name.trim().length < 2) v.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) v.email = 'Enter a valid email';
    if (form.password.length < 8) v.password = 'Use at least 8 characters';
    if (form.confirm !== form.password) v.confirm = 'Passwords do not match';
    if (form.monthlyIncome !== '' && Number(form.monthlyIncome) < 0) v.monthlyIncome = 'Income cannot be negative';
    setErrors(v);
    if (Object.keys(v).length) return;
    setLoading(true); setError('');
    try {
      await register({ name: form.name, email: form.email, password: form.password, college: form.college, monthlyIncome: Number(form.monthlyIncome) || 0 });
      nav('/dashboard', { replace: true });
    } catch (err) { setError(errorMessage(err)); } finally { setLoading(false); }
  };

  return (
    <Shell title="Create your account 🌱" subtitle="Takes under a minute. Finny will be waiting." mood="celebrating" side="Let’s build your smarter future.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Full name" value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Password" type="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
          <Input label="Confirm password" type="password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        </div>
        <Input label="College / University" value={form.college} onChange={set('college')} />
        <Input label="Monthly income (₹)" type="number" min="0" value={form.monthlyIncome} onChange={set('monthlyIncome')} error={errors.monthlyIncome} hint="Pocket money, allowance, stipend — roughly." />
        {error && <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-3 text-sm font-bold text-coral">{error}</p>}
        <Button type="submit" loading={loading} className="w-full !py-3.5">Create account</Button>
        <p className="text-center text-sm">Already have an account? <Link to="/login" className="font-bold text-brand underline dark:text-brand-soft">Login</Link></p>
      </form>
    </Shell>
  );
}
