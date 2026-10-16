import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, BarChart3, Bot, LogOut, Menu, Moon, PiggyBank, Receipt, Rocket, Search, Settings, Sun, Target, Home, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import FloatingChatbot from './Chatbot';
import { Sparkle } from './ui/Deco';

const NAV = [
  ['/dashboard', 'Dashboard', Home], ['/expenses', 'Expenses', Receipt], ['/budget', 'Budget', PiggyBank], ['/goals', 'Goals', Target],
  ['/insights', 'Insights', BarChart3], ['/notifications', 'Notifications', Bell], ['/finny', 'Finny', Bot], ['/settings', 'Settings', Settings],
];

export function Logo({ className = '' }) {
  return (
    <Link to="/" className={`flex items-center gap-2 font-display text-2xl font-extrabold ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-lime text-lg text-[#1B1848]">👛</span>FinBuddy
    </Link>
  );
}

function SideNav({ onNavigate, unread }) {
  const { user } = useAuth();
  const items = user.role === 'admin' ? [...NAV, ['/devops', 'DevOps', Rocket]] : NAV;
  return (
    <nav className="flex flex-col gap-1.5" aria-label="Main">
      {items.map(([to, label, Icon]) => (
        <NavLink key={to} to={to} onClick={onNavigate}
          className={({ isActive }) => `flex items-center gap-3 rounded-full px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-lime text-[#1B1848]' : 'text-white/85 hover:bg-white/10'}`}>
          <Icon size={19} />{label}
          {to === '/notifications' && unread > 0 && <span className="ml-auto rounded-full bg-coral px-2 py-0.5 text-xs text-white">{unread}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, logout, dark, setDark } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState('');
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    setDrawer(false); setMenu(false);
    api.get('/notifications').then((r) => setUnread(r.data.unread)).catch(() => {});
  }, [loc.pathname]);

  const submitSearch = (e) => { e.preventDefault(); nav(`/expenses?q=${encodeURIComponent(q)}`); };
  const sidebar = (
    <div className="flex h-full flex-col gap-6 bg-brand p-5 text-white">
      <div className="flex items-center justify-between"><Logo className="text-white" />
        <button className="rounded-full p-2 hover:bg-white/10 lg:hidden" onClick={() => setDrawer(false)} aria-label="Close menu"><X /></button></div>
      <SideNav onNavigate={() => setDrawer(false)} unread={unread} />
      <div className="relative mt-auto rounded-3xl bg-white/10 p-4 text-sm">
        <Sparkle className="absolute right-3 top-3" size={22} color="#DDF247" />
        <p className="font-bold">Tip from Finny</p><p className="text-white/80">Log expenses the same day — it takes 10 seconds!</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-ink/50" />
          <aside className="relative h-full w-72 animate-pop_in" onClick={(e) => e.stopPropagation()}>{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-paper/85 px-4 py-3 backdrop-blur sm:px-8">
          <button className="rounded-full bg-ink/10 p-2.5 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={20} /></button>
          <form onSubmit={submitSearch} className="relative max-w-md flex-1" role="search">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/50" />
            <input className="field !rounded-full !pl-11" placeholder="Search transactions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search transactions" />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="rounded-full bg-ink/10 p-2.5" aria-label="Toggle dark mode">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
            <Link to="/notifications" className="relative rounded-full bg-ink/10 p-2.5" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
              <Bell size={19} />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-white">{unread}</span>}
            </Link>
            <div className="relative">
              <button onClick={() => setMenu(!menu)} className="grid h-11 w-11 place-items-center rounded-full bg-lime text-xl" aria-label="Profile menu" aria-expanded={menu}>{user.avatar || user.name[0]}</button>
              {menu && (
                <div className="absolute right-0 top-14 w-56 animate-pop_in rounded-3xl bg-card p-2 shadow-pop ring-2 ring-ink">
                  <p className="truncate px-3 py-2 text-sm font-bold">{user.name}<span className="block text-xs font-normal text-ink/60">{user.email}</span></p>
                  <Link to="/settings" className="block rounded-2xl px-3 py-2 text-sm font-bold hover:bg-ink/5">Profile & settings</Link>
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold text-coral hover:bg-coral/10"><LogOut size={16} />Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="page-in px-4 pb-28 pt-2 sm:px-8"><Outlet /></main>
      </div>
      {loc.pathname !== '/finny' && <FloatingChatbot />}
    </div>
  );
}
