/** Playful decorative shapes used across the UI (inspired by the reference sites). All are aria-hidden. */
export function Sparkle({ size = 28, color = '#7EE2B8', className = '' }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 40 40" className={`animate-twinkle ${className}`}>
      <path d="M20 0 C22 13 27 18 40 20 C27 22 22 27 20 40 C18 27 13 22 0 20 C13 18 18 13 20 0Z" fill={color} />
    </svg>
  );
}

export function Flower({ size = 60, color = '#DDF247', className = '' }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" className={className}>
      <path fill={color} d="M50 4c8 0 11 12 18 15s19-3 24 5-6 16-5 24 11 14 6 22-17 3-23 8-2 18-12 21-14-8-22-8-14 11-22 8-9-16-12-21-18-3-23-8-1-14 6-22S8 38 4 31 9 15 16 18s16-6 22-12C41 2 45 4 50 4z" />
    </svg>
  );
}

export function Squiggle({ className = '', color = '#5B54D6' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 24" className={className} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round">
      <path d="M4 12c14-16 22 16 36 0s22 16 36 0 22 16 36 0 22 16 36 0 22 16 36 0" />
    </svg>
  );
}

export function Cloud({ className = '', color = '#E4D5F8' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 60" className={className}>
      <path fill={color} d="M22 56a20 20 0 0 1-2-40 26 26 0 0 1 50-6 22 22 0 0 1 34 18 18 18 0 0 1-6 28z" />
    </svg>
  );
}

/** Scalloped edge: place at the top of a coloured section to give it a cloud-like border. */
export function Scallop({ color = '#5B54D6', flip = false, className = '' }) {
  return (
    <svg aria-hidden="true" className={`block w-full ${flip ? 'rotate-180' : ''} ${className}`} height="28" preserveAspectRatio="none" viewBox="0 0 720 28">
      <defs>
        <pattern id={`sc-${color.slice(1)}`} width="60" height="28" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="30" fill={color} />
        </pattern>
      </defs>
      <rect width="720" height="28" fill={`url(#sc-${color.slice(1)})`} />
    </svg>
  );
}

export function Marquee({ items, className = '' }) {
  const row = [...items, ...items];
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`} aria-hidden="true">
      <div className="inline-flex animate-marquee gap-6 pr-6">
        {row.concat(row).map((t, i) => (
          <span key={i} className="inline-flex items-center gap-6 font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
            {t}<span className="inline-block h-3 w-3 rounded-full bg-current" />
          </span>
        ))}
      </div>
    </div>
  );
}
