import { useState } from 'react';
import { ChatPanel } from '../components/Chatbot';
import Mascot from '../components/Mascot';
import Card from '../components/ui/Card';

const MOODS = [['happy', 'Happy', 'Under budget'], ['neutral', 'Neutral', 'Normal spending'], ['worried', 'Worried', 'Near a limit'], ['celebrating', 'Celebrating', 'Goal reached'], ['sad', 'Sad', 'Over budget']];

export default function FinnyPage() {
  const [mood, setMood] = useState('happy');
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-5">
        <div><h1 className="text-3xl font-extrabold sm:text-4xl">Meet Finny</h1><p className="text-ink/65">Your budgeting buddy. Finny answers using your real numbers.</p></div>
        <Card tone="lilac" className="grid place-items-center py-10"><Mascot mood={mood} size={220} /></Card>
        <Card>
          <h3 className="mb-3 text-lg font-extrabold">Finny’s moods</h3>
          <div className="grid grid-cols-5 gap-2">{MOODS.map(([m, l, d]) => (
            <button key={m} onClick={() => setMood(m)} aria-label={`Preview ${l}`} className={`rounded-2xl p-2 text-center text-[11px] font-bold ${mood === m ? 'bg-lime text-[#1B1848]' : 'bg-ink/5'}`}><Mascot mood={m} size={44} label="" className="mx-auto" />{l}<span className="hidden font-normal opacity-70 sm:block">{d}</span></button>
          ))}</div>
        </Card>
      </div>
      <ChatPanel onMood={setMood} className="h-[min(680px,75vh)] rounded-4xl shadow-soft" />
    </div>
  );
}
