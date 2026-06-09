/* SorteioFácil — logo (símbolo de ticket + wordmark) */
interface LogoProps {
  size?: "sm" | "md" | "lg";
  /** Mostra só o símbolo, sem o nome */
  markOnly?: boolean;
}

const FONT_SIZE: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 18,
  md: 24,
  lg: 40,
};

const MARK_SIZE: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 26,
  md: 34,
  lg: 54,
};

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="lg-gold" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCE38A" />
          <stop offset="0.5" stopColor="#F5C518" />
          <stop offset="1" stopColor="#C8960B" />
        </linearGradient>
      </defs>
      {/* Ticket arredondado com recortes laterais (máscara) */}
      <mask id="lg-ticket">
        <rect x="6" y="10" width="36" height="28" rx="8" fill="#fff" />
        <circle cx="6" cy="24" r="4.5" fill="#000" />
        <circle cx="42" cy="24" r="4.5" fill="#000" />
      </mask>
      <g mask="url(#lg-ticket)">
        <rect x="6" y="10" width="36" height="28" rx="8" fill="url(#lg-gold)" />
        <rect x="6" y="10" width="36" height="28" rx="8" fill="#000" opacity="0.04" />
      </g>
      {/* Estrela central */}
      <path
        d="M24 17.2l1.9 3.86 4.26.62-3.08 3 .73 4.24L24 26.92l-3.81 2 .73-4.24-3.08-3 4.26-.62L24 17.2z"
        fill="#1a1500"
      />
      {/* Linha pontilhada do ticket */}
      <line x1="24" y1="12.5" x2="24" y2="15.5" stroke="#1a1500" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
      <line x1="24" y1="32.5" x2="24" y2="35.5" stroke="#1a1500" strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

export function Logo({ size = "md", markOnly = false }: LogoProps) {
  const mark = MARK_SIZE[size];
  const font = FONT_SIZE[size];

  if (markOnly) {
    return (
      <span className="logo-lockup" aria-label="SorteioFácil">
        <LogoMark size={mark} />
      </span>
    );
  }

  return (
    <span className="logo-lockup" aria-label="SorteioFácil">
      <LogoMark size={mark} />
      <span className="logo" style={{ fontSize: font }}>
        Sortei<span className="o">o</span>Fácil
      </span>
    </span>
  );
}
