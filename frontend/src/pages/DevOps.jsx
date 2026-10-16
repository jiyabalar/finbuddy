import { CheckCircle2, Clock, GitCommit, Loader2, Rocket, XCircle } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import Card from '../components/ui/Card';
import { ErrorState, PageSkeleton } from '../components/ui/States';
import { formatDate } from '../lib/format';

const ok = (s) => ['success', 'online', 'live'].includes(String(s).toLowerCase());
function Pill({ value }) {
  const good = ok(value);
  const pending = ['pending', 'running', 'in_progress', 'queued'].includes(String(value).toLowerCase());
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase ${good ? 'bg-mint text-[#1B1848]' : pending ? 'bg-sun text-[#1B1848]' : 'bg-coral text-white'}`}>
    {good ? <CheckCircle2 size={14} /> : pending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}{value}</span>;
}
const Row = ({ label, children }) => <div className="flex items-center justify-between gap-3 border-b border-ink/10 py-3 last:border-0"><span className="text-sm text-ink/70">{label}</span><span className="text-right font-bold">{children}</span></div>;

export default function DevOps() {
  const { data, loading, error, reload } = useFetch('/devops/status', null, 'Unable to load system status.');
  if (loading && !data) return <PageSkeleton />;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const { services, system, pipeline: p, stats } = data;
  const up = Math.floor(system.uptimeSeconds / 60);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold sm:text-4xl">DevOps dashboard</h1><p className="text-ink/65">FinBuddy system status & CI/CD pipeline.</p></div>
      {(p.mock || p.note) && <p className="rounded-2xl bg-sun/40 px-4 py-3 text-sm font-bold">{p.note || 'Showing MOCK pipeline data. Set GITHUB_REPO (and GITHUB_TOKEN for private repos) in the backend .env to show real GitHub Actions runs.'}</p>}
      <section className="grid gap-4 sm:grid-cols-3">
        {[['Frontend', services.frontend], ['Backend API', services.backend], ['Database', services.database]].map(([n, s]) => (
          <Card key={n} tone={ok(s) ? 'lime' : 'sun'}><p className="flex items-center gap-2 font-bold"><span className={`h-3 w-3 rounded-full ${ok(s) ? 'bg-[#0E9F6E]' : 'bg-coral'} animate-twinkle`} />{n}</p><p className="mt-2 font-display text-3xl font-extrabold uppercase">{s}</p></Card>
        ))}
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 text-xl font-extrabold"><Rocket size={20} />Latest pipeline</h3><Pill value={p.live ? 'live' : p.status} /></div>
          <Row label="Build">#{p.build}{p.url && <a className="ml-2 text-brand underline" href={p.url} target="_blank" rel="noreferrer">view</a>}</Row>
          <Row label="Build status"><Pill value={p.status} /></Row>
          <Row label="Tests">{p.tests.total ? `${p.tests.passed} / ${p.tests.total} passed` : ok(p.status) ? 'All passed' : '—'}</Row>
          <Row label="Docker build"><Pill value={p.docker} /></Row>
          <Row label="Deployment"><Pill value={p.deployment} /></Row>
          <Row label="Commit"><span className="inline-flex items-center gap-1.5 font-mono"><GitCommit size={15} />{p.commit}</span></Row>
          <Row label="Message">“{p.message}”</Row>
          <Row label="Deployed"><span className="inline-flex items-center gap-1.5"><Clock size={15} />{formatDate(p.deployedAt, { dateStyle: 'medium', timeStyle: 'short' })}</span></Row>
        </Card>
        <Card tone="ink">
          <h3 className="mb-3 text-xl font-extrabold">System</h3>
          {[['Node', system.node], ['Environment', system.env], ['Uptime', `${up} min`], ['Memory', `${system.memoryMb} MB`], ['Chatbot mode', system.aiMode], ['Users', stats.users], ['Transactions', stats.transactions]].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-paper/15 py-2.5 text-sm last:border-0"><span className="opacity-70">{k}</span><b>{v}</b></div>
          ))}
        </Card>
      </section>
    </div>
  );
}
