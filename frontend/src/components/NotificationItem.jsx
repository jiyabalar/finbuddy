import { AlertTriangle, Bell, Check, Flame, Lightbulb, PartyPopper, Target, Trash2 } from 'lucide-react';
import { timeAgo } from '../lib/format';
import Mascot from './Mascot';

const META = {
  budget_warning: { icon: AlertTriangle, bg: 'bg-sun', mood: 'worried' },
  budget_exceeded: { icon: Flame, bg: 'bg-coral', mood: 'sad' },
  goal_progress: { icon: Target, bg: 'bg-mint', mood: 'happy' },
  goal_completed: { icon: PartyPopper, bg: 'bg-lime', mood: 'celebrating' },
  insight: { icon: Lightbulb, bg: 'bg-lilac', mood: 'happy' },
  reminder: { icon: Bell, bg: 'bg-lilac', mood: 'neutral' },
};

export default function NotificationItem({ n, onRead, onDelete }) {
  const m = META[n.type] || META.reminder;
  return (
    <div className={`flex items-start gap-3 rounded-3xl p-4 transition ${n.isRead ? 'bg-card/60' : 'bg-card shadow-soft ring-2 ring-brand/40'}`}>
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${m.bg}`}><Mascot mood={m.mood} size={44} label="" /></div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-extrabold"><m.icon size={16} aria-hidden="true" />{n.title}{!n.isRead && <span className="h-2 w-2 rounded-full bg-brand" aria-label="unread" />}</p>
        <p className="text-sm text-ink/75">{n.message}</p>
        <p className="mt-1 text-xs text-ink/50">{timeAgo(n.createdAt)}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        {!n.isRead && <button onClick={() => onRead(n.id)} aria-label="Mark as read" className="rounded-full p-2 hover:bg-ink/10"><Check size={18} /></button>}
        <button onClick={() => onDelete(n.id)} aria-label="Delete notification" className="rounded-full p-2 text-coral hover:bg-coral/15"><Trash2 size={18} /></button>
      </div>
    </div>
  );
}
