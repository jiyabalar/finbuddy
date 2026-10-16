import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  lime: 'bg-lime text-[#1B1848] hover:brightness-95',
  ink: 'bg-ink text-paper hover:opacity-90',
  soft: 'bg-lilac text-ink hover:brightness-95',
  ghost: 'bg-transparent text-ink hover:bg-ink/5 border-2 border-ink/15',
  danger: 'bg-coral text-white hover:brightness-95',
};

export default function Button({ variant = 'primary', loading = false, icon: Icon, className = '', children, ...props }) {
  return (
    <button className={`btn ${VARIANTS[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function LinkButton({ to, variant = 'primary', icon: Icon, className = '', children }) {
  return (
    <Link to={to} className={`btn ${VARIANTS[variant]} ${className}`}>
      {children}
      {Icon && <Icon size={16} />}
    </Link>
  );
}
