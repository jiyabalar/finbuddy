import { Link } from 'react-router-dom';
import { ArrowUpRight, BarChart3, Bot, PiggyBank, Receipt, Target } from 'lucide-react';
import Mascot from '../components/Mascot';
import { Logo } from '../components/Layout';
import { LinkButton } from '../components/ui/Button';
import { Cloud, Flower, Marquee, Scallop, Sparkle, Squiggle } from '../components/ui/Deco';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: Receipt, title: 'Track Expenses', text: 'Log spending in seconds with categories, payment methods and smart search.', bg: 'bg-lilac', shape: '#8C86F0' },
  { icon: PiggyBank, title: 'Smart Budgeting', text: 'Set monthly limits and get nudged at 80% — before you overspend.', bg: 'bg-lime', shape: '#5B54D6' },
  { icon: Target, title: 'Savings Goals', text: 'Headphones, laptop, trip. See exactly when you’ll get there.', bg: 'bg-brand text-white', shape: '#DDF247' },
  { icon: BarChart3, title: 'Financial Insights', text: 'Trends, top categories and a health score that actually means something.', bg: 'bg-mint', shape: '#FFFFFF' },
  { icon: Bot, title: 'AI Assistant', text: 'Ask Finny “Can I afford this?” and get answers from your real numbers.', bg: 'bg-sun', shape: '#FFFFFF' },
];
const STEPS = [['Track your money', 'Add income and expenses as they happen.'], ['Set your budget', 'Split your month into categories that fit your life.'], ['Understand your habits', 'Spot trends and get friendly nudges.'], ['Reach your goals', 'Watch your savings grow, one rupee at a time.']];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? '/dashboard' : '/register';
  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Site">
          <Link to="/login" className="rounded-full px-4 py-2 text-sm font-bold hover:bg-ink/5">Login</Link>
          <LinkButton to={cta} variant="lime">{user ? 'Open app' : 'Get Started'}</LinkButton>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-6 lg:grid-cols-[1.15fr_1fr]">
        <Cloud className="absolute -left-10 top-4 w-40 opacity-80" />
        <div className="relative">
          <h1 className="font-display text-[clamp(3.6rem,13vw,8.5rem)] font-extrabold leading-[.88] text-brand">FinBuddy</h1>
          <Squiggle className="mt-3 w-40" color="#7EE2B8" />
          <p className="mt-5 font-display text-2xl font-extrabold sm:text-3xl">Your money. Your goals. Your smarter future.</p>
          <p className="mt-3 max-w-lg text-lg text-ink/75">Track your spending, build smarter budgets and reach your financial goals — all in one place.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton to={cta} variant="primary" icon={ArrowUpRight} className="!px-7 !py-3.5 !text-base">Get Started</LinkButton>
            <LinkButton to="/login" variant="ghost" className="!px-7 !py-3.5 !text-base">Login</LinkButton>
          </div>
        </div>
        <div className="relative mx-auto grid aspect-square w-full max-w-md place-items-center">
          <Flower size={460} color="#E4D5F8" className="absolute inset-0 h-full w-full animate-spin_slow" />
          <div className="relative rounded-full bg-brand p-6 shadow-pop ring-4 ring-ink"><Mascot mood="celebrating" size={240} /></div>
          <Sparkle className="absolute left-4 top-10" size={44} />
          <Sparkle className="absolute bottom-12 right-2" size={34} color="#5B54D6" />
          <div className="absolute -left-2 bottom-16 rotate-[-6deg] rounded-2xl bg-lime px-4 py-2 text-sm font-extrabold text-[#1B1848] shadow-pop sm:left-0">You did it! 🎯</div>
          <div className="absolute right-0 top-6 rotate-[5deg] rounded-2xl bg-mint px-4 py-2 text-sm font-extrabold text-[#1B1848] shadow-pop">Under budget 🎉</div>
        </div>
      </section>

      {/* TICKER */}
      <div className="bg-mint py-4 text-[#1B1848] -rotate-1 scale-105"><Marquee items={['Track', 'Budget', 'Save', 'Understand', 'Grow', 'Repeat']} /></div>

      {/* WHY */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="max-w-xl font-display text-5xl font-extrabold">Why FinBuddy?</h2>
        <p className="mt-3 max-w-lg text-ink/70">Built for students: small budgets, big goals, zero boring spreadsheets.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <article key={f.title} className={`relative overflow-hidden rounded-4xl p-6 ${f.bg} ${i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'} ${i === 4 ? 'sm:col-span-2 lg:col-span-3' : ''}`}>
              <Flower size={120} color={f.shape} className="absolute -right-6 -top-6 opacity-40" />
              <f.icon size={30} className="relative" />
              <h3 className="relative mt-10 text-2xl font-extrabold">{f.title}</h3>
              <p className="relative mt-1 opacity-85">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <Scallop color="#5B54D6" />
      <section className="bg-brand px-5 pb-24 pt-10 text-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-5xl font-extrabold">How it works</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="rounded-4xl bg-white/10 p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-lime font-display text-xl font-extrabold text-[#1B1848]">{i + 1}</span>
                <h3 className="mt-5 text-xl font-extrabold">{t}</h3><p className="mt-1 text-white/80">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="relative grid items-center gap-6 overflow-hidden rounded-4xl bg-lime p-8 text-[#1B1848] sm:grid-cols-[1fr_auto] sm:p-14">
          <Sparkle className="absolute right-10 top-8" size={40} color="#5B54D6" />
          <div>
            <h2 className="font-display text-4xl font-extrabold sm:text-6xl">Take control of your money today.</h2>
            <LinkButton to={cta} variant="ink" icon={ArrowUpRight} className="mt-7 !px-7 !py-3.5 !text-base">Start Managing My Money</LinkButton>
          </div>
          <Mascot mood="happy" size={190} className="mx-auto" />
        </div>
      </section>
      <footer className="mx-auto max-w-6xl px-5 pb-10 text-center text-xs text-ink/60">
        © {new Date().getFullYear()} FinBuddy · FinBuddy provides educational budgeting assistance and is not a substitute for professional financial advice.
      </footer>
    </div>
  );
}
