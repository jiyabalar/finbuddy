import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import Mascot from '../Mascot';

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-2xl bg-ink/10 ${className}`} />;

export function PageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-24" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 !rounded-4xl" />)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72 !rounded-4xl" /><Skeleton className="h-72 !rounded-4xl" /></div>
    </div>
  );
}

export function EmptyState({ title, text, action, onAction, mood = 'neutral' }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-4xl bg-lilac/60 px-6 py-10 text-center">
      <Mascot mood={mood} size={110} />
      <h3 className="text-xl font-extrabold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-ink/70">{text}</p>}
      {action && <Button variant="lime" onClick={onAction}>{action}</Button>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-4xl bg-coral/15 px-6 py-10 text-center">
      <AlertTriangle className="text-coral" size={32} />
      <p className="font-bold">{message}</p>
      {onRetry && <Button variant="ink" onClick={onRetry}>Try again</Button>}
    </div>
  );
}
