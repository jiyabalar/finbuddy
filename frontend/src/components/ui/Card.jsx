const TONES = {
  white: 'bg-card text-ink',
  lilac: 'bg-lilac text-ink',
  lime: 'bg-lime text-[#1B1848]',
  brand: 'bg-brand text-white',
  mint: 'bg-mint text-[#1B1848]',
  ink: 'bg-ink text-paper',
  sun: 'bg-sun text-[#1B1848]',
};

export default function Card({ tone = 'white', className = '', children, ...props }) {
  return (
    <div className={`rounded-4xl p-5 sm:p-6 ${tone === 'white' ? 'shadow-soft' : ''} ${TONES[tone]} ${className}`} {...props}>
      {children}
    </div>
  );
}
