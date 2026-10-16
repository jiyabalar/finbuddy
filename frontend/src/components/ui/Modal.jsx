import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={`animate-pop_in max-h-[92vh] w-full overflow-y-auto rounded-t-4xl bg-card p-6 shadow-soft sm:rounded-4xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-ink/10 p-2 hover:bg-ink/20"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
