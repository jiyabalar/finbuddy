import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import useFetch from '../hooks/useFetch';
import Button from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import NotificationItem from '../components/NotificationItem';

export default function Notifications() {
  const { data, loading, error, reload, setData } = useFetch('/notifications', null, 'Unable to load notifications.');
  const [err, setErr] = useState('');
  const act = async (fn, optimistic) => {
    setErr('');
    try { await fn(); setData((d) => optimistic(d)); } catch (e) { setErr(errorMessage(e)); reload(); }
  };
  const markRead = (id) => act(() => api.put(`/notifications/${id}/read`), (d) => ({ ...d, unread: d.unread - 1, items: d.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
  const markAll = () => act(() => api.put('/notifications/read-all'), (d) => ({ ...d, unread: 0, items: d.items.map((n) => ({ ...n, isRead: true })) }));
  const remove = (id) => act(() => api.delete(`/notifications/${id}`), (d) => ({ ...d, unread: d.items.filter((n) => n.id !== id && !n.isRead).length, items: d.items.filter((n) => n.id !== id) }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold sm:text-4xl">Notifications</h1><p className="text-ink/65">{data ? `${data.unread} unread` : ' '}</p></div>
        <Button variant="soft" icon={CheckCheck} onClick={markAll} disabled={!data?.unread}>Mark all as read</Button>
      </div>
      {err && <p role="alert" className="rounded-2xl bg-coral/15 px-4 py-2 text-sm font-bold text-coral">{err}</p>}
      {loading && !data ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 !rounded-3xl" />)}</div>
        : error && !data ? <ErrorState message={error} onRetry={reload} />
        : data.items.length === 0 ? <EmptyState title="All caught up!" text="Budget alerts and goal updates will show up here." mood="happy" />
        : <div className="space-y-3">{data.items.map((n) => <NotificationItem key={n.id} n={n} onRead={markRead} onDelete={remove} />)}</div>}
    </div>
  );
}
