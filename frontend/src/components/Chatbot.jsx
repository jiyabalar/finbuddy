import { useEffect, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import Mascot from './Mascot';
import { DISCLAIMER } from '../lib/constants';

const SUGGESTIONS = ['How much did I spend this month?', 'Where did I spend the most?', 'How much can I spend on food this week?', 'Can I afford ₹1,000 shopping this week?', 'How much have I saved?'];

export function ChatPanel({ className = '', onMood }) {
  const [messages, setMessages] = useState([{ role: 'bot', text: "Hi! I'm Finny 👋 Ask me anything about your spending, budgets or savings goals." }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [mood, setMood] = useState('happy');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView?.({ behavior: 'smooth' }); }, [messages, busy]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    const history = messages.slice(1);
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const { data } = await api.post('/chat', { message, history });
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
      setMood(data.mood); onMood?.(data.mood);
    } catch (e) {
      setMessages((m) => [...m, { role: 'bot', text: errorMessage(e, "Hmm, I couldn't think of an answer. Try again?"), error: true }]);
      setMood('worried');
    } finally { setBusy(false); }
  };

  return (
    <div className={`flex flex-col overflow-hidden bg-card ${className}`}>
      <div className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-lime"><Mascot mood={busy ? 'neutral' : mood} size={40} label="" /></div>
        <div><p className="font-display text-lg font-extrabold leading-none">Finny</p><p className="text-xs text-white/80">{busy ? 'Crunching your numbers…' : 'Your budgeting buddy'}</p></div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={`max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'rounded-br-md bg-brand text-white' : m.error ? 'bg-coral/20' : 'rounded-bl-md bg-lilac'}`}>{m.text}</p>
          </div>
        ))}
        {busy && <p className="w-fit rounded-3xl bg-lilac px-4 py-2.5 text-sm" aria-label="Finny is typing">• • •</p>}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border-2 border-brand/30 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand/10 dark:text-brand-soft">{s}</button>)}
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-ink/10 p-3">
        <input className="field" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Finny…" aria-label="Message Finny" maxLength={500} />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime text-[#1B1848] disabled:opacity-50"><Send size={18} /></button>
      </form>
      <p className="px-4 pb-3 text-[11px] leading-snug text-ink/50">{DISCLAIMER}</p>
    </div>
  );
}

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <ChatPanel className="fixed inset-x-3 bottom-24 z-40 h-[min(560px,70vh)] animate-pop_in rounded-4xl shadow-pop ring-2 ring-ink sm:inset-x-auto sm:right-6 sm:w-[380px]" />}
      <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close Finny chat' : 'Chat with Finny'}
        className="fixed bottom-5 right-4 z-40 grid h-16 w-16 place-items-center rounded-full bg-lime shadow-pop ring-2 ring-ink transition hover:scale-105 sm:right-6">
        {open ? <X /> : <Mascot mood="happy" size={52} label="" />}
      </button>
    </>
  );
}
