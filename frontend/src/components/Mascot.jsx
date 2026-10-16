/**
 * Finny - the FinBuddy wallet mascot. One consistent SVG character with 5 moods:
 * happy | neutral | worried | celebrating | sad
 */
const INK = '#1B1848';

const MOUTH = {
  happy: <path d="M84 134 Q100 152 116 134" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />,
  neutral: <path d="M91 141 H109" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />,
  worried: <path d="M87 146 Q94 138 100 144 T113 144" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />,
  sad: <path d="M86 148 Q100 132 114 148" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />,
  celebrating: (
    <>
      <path d="M82 131 Q100 162 118 131 Z" fill="#3A1230" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M91 148 Q100 140 109 148 Q100 156 91 148Z" fill="#FF7A6B" />
    </>
  ),
};

const ANIMATION = { happy: 'animate-bob', neutral: 'animate-bob', worried: 'animate-shake', celebrating: 'animate-jump', sad: '' };

export default function Mascot({ mood = 'neutral', size = 140, className = '', label }) {
  const up = mood === 'celebrating';
  const brows = mood === 'worried' ? ['M70 104 L89 111', 'M130 104 L111 111'] : mood === 'sad' ? ['M70 112 L89 104', 'M130 112 L111 104'] : null;
  return (
    <svg role="img" aria-label={label || `Finny the mascot looking ${mood}`} width={size} height={size} viewBox="0 0 200 200" className={`${ANIMATION[mood]} ${className}`} style={{ overflow: 'visible' }}>
      <ellipse cx="100" cy="190" rx="52" ry="7" fill={INK} opacity=".14" />
      {/* coin peeking out of the wallet */}
      <g transform={up ? 'translate(0 -6)' : ''}>
        <circle cx="100" cy="42" r="25" fill="#FFE066" stroke={INK} strokeWidth="4" />
        <circle cx="100" cy="42" r="17" fill="none" stroke="#E0A800" strokeWidth="3" strokeDasharray="3 4" />
        <text x="100" y="52" textAnchor="middle" fontSize="26" fontWeight="800" fill={INK} fontFamily="Bricolage Grotesque, sans-serif">₹</text>
      </g>
      {/* arms */}
      <ellipse cx={up ? 30 : 36} cy={up ? 92 : 136} rx="11" ry="14" fill="#FFC93C" stroke={INK} strokeWidth="4" transform={up ? 'rotate(-30 30 92)' : ''} />
      <ellipse cx={up ? 170 : 164} cy={up ? 92 : 136} rx="11" ry="14" fill="#FFC93C" stroke={INK} strokeWidth="4" transform={up ? 'rotate(30 170 92)' : ''} />
      {/* wallet: flap + body */}
      <rect x="40" y="62" width="120" height="56" rx="30" fill="#F5A623" stroke={INK} strokeWidth="4" />
      <rect x="40" y="82" width="120" height="92" rx="32" fill="#FFC93C" stroke={INK} strokeWidth="4" />
      <path d="M52 100 Q52 92 60 90" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".6" />
      <circle cx="148" cy="100" r="8" fill="#fff" stroke={INK} strokeWidth="3.5" />
      {/* feet */}
      <ellipse cx="76" cy="176" rx="15" ry="8" fill="#F5A623" stroke={INK} strokeWidth="4" />
      <ellipse cx="124" cy="176" rx="15" ry="8" fill="#F5A623" stroke={INK} strokeWidth="4" />
      {/* face */}
      <g style={{ transformOrigin: '100px 120px', animation: 'none' }}>
        <ellipse cx="78" cy="122" rx="6.5" ry={mood === 'happy' || up ? 5 : 8} fill={INK} />
        <ellipse cx="122" cy="122" rx="6.5" ry={mood === 'happy' || up ? 5 : 8} fill={INK} />
        {!(mood === 'happy' || up) && <><circle cx="80" cy="119" r="2.2" fill="#fff" /><circle cx="124" cy="119" r="2.2" fill="#fff" /></>}
      </g>
      {brows && brows.map((d) => <path key={d} d={d} stroke={INK} strokeWidth="4" strokeLinecap="round" />)}
      <circle cx="64" cy="138" r="7" fill="#FF8FA3" opacity=".65" />
      <circle cx="136" cy="138" r="7" fill="#FF8FA3" opacity=".65" />
      {MOUTH[mood]}
      {mood === 'worried' && <path d="M150 74 q-7 11 0 15 q7 -4 0 -15z" fill="#9AD0F5" stroke={INK} strokeWidth="2.5" />}
      {mood === 'sad' && <path d="M72 134 q-5 9 0 12 q5 -3 0 -12z" fill="#9AD0F5" stroke={INK} strokeWidth="2.5" />}
      {(mood === 'happy' || up) && (
        <>
          <path className="animate-twinkle" d="M172 52 C173 59 176 62 183 63 C176 64 173 67 172 74 C171 67 168 64 161 63 C168 62 171 59 172 52Z" fill="#7EE2B8" />
          <path className="animate-twinkle" d="M24 56 C25 61 27 63 32 64 C27 65 25 67 24 72 C23 67 21 65 16 64 C21 63 23 61 24 56Z" fill="#DDF247" />
        </>
      )}
      {up && ['#FF7A6B', '#5B54D6', '#7EE2B8', '#DDF247'].map((c, i) => (
        <rect key={c} className="animate-twinkle" x={[20, 176, 52, 150][i]} y={[20, 30, 6, 12][i]} width="8" height="8" rx="2" fill={c} transform={`rotate(${i * 25} ${[20, 176, 52, 150][i]} ${[20, 30, 6, 12][i]})`} />
      ))}
    </svg>
  );
}

export function FinnyBubble({ mood, children, size = 96, tone = 'bg-lilac' }) {
  return (
    <div className="flex items-center gap-3">
      <Mascot mood={mood} size={size} className="shrink-0" />
      <div className={`relative rounded-3xl ${tone} px-4 py-3 text-sm font-bold sm:text-base`}>
        <span className={`absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 ${tone}`} />
        <span className="relative">{children}</span>
      </div>
    </div>
  );
}
