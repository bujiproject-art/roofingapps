interface Props {
  size?: number;
  showWordmark?: boolean;
  variant?: 'default' | 'admin' | 'expert';
  className?: string;
}

export default function RevoLogo({ size = 40, showWordmark = true, variant = 'default', className = '' }: Props) {
  const label = variant === 'admin' ? 'Admin' : variant === 'expert' ? 'Expert' : 'Roofing AI';
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Revo Roofing AI">
        <defs>
          <linearGradient id="revoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5B366" />
            <stop offset="55%" stopColor="#D4A24C" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="revoRoof" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0A0F1F" />
            <stop offset="100%" stopColor="#050812" />
          </linearGradient>
        </defs>
        <path d="M24 2 L44 11 V27 C44 37 34 44 24 46 C14 44 4 37 4 27 V11 Z" fill="url(#revoGrad)" />
        <path d="M24 6 L40 13 V27 C40 35 32.5 40.5 24 42.3 C15.5 40.5 8 35 8 27 V13 Z" fill="url(#revoRoof)" />
        <path d="M13 28 L24 18 L35 28 L35 32 L24 22 L13 32 Z" fill="#D4A24C" opacity="0.95" />
        <circle cx="24" cy="33" r="2.4" fill="#E5B366" />
      </svg>
      {showWordmark && (
        <div className="leading-tight">
          <div className="font-display font-bold text-base tracking-tight text-[#E5E9F2]">Revo</div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-[#D4A24C] font-semibold">{label}</div>
        </div>
      )}
    </div>
  );
}
