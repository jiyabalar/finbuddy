import { forwardRef, useId } from 'react';

function Wrap({ label, error, hint, id, children }) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-bold">{label}</label>}
      {children}
      {hint && !error && <p className="text-xs text-ink/60">{hint}</p>}
      {error && <p role="alert" className="text-xs font-bold text-coral">{error}</p>}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, className = '', ...props }, ref) {
  const id = useId();
  return (
    <Wrap label={label} error={error} hint={hint} id={id}>
      <input id={id} ref={ref} className={`field ${error ? '!border-coral' : ''} ${className}`} {...props} />
    </Wrap>
  );
});

export const Select = forwardRef(function Select({ label, error, options, placeholder, className = '', ...props }, ref) {
  const id = useId();
  return (
    <Wrap label={label} error={error} id={id}>
      <select id={id} ref={ref} className={`field ${error ? '!border-coral' : ''} ${className}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
      </select>
    </Wrap>
  );
});

export function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-ink/5 px-4 py-3">
      <span><span className="block text-sm font-bold">{label}</span>{hint && <span className="text-xs text-ink/60">{hint}</span>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-ink/20 transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
