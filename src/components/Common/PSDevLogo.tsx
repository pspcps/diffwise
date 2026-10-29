interface PSDevLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function PSDevLogo({
  size = 'md',
  showText = true,
  className = '',
  onClick,
}: PSDevLogoProps) {
  const iconDimensions = {
    sm: { box: 22, stroke: 2.2 },
    md: { box: 28, stroke: 2.4 },
    lg: { box: 38, stroke: 2.6 },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Vector Logo Badge */}
      <div
        className="relative flex items-center justify-center shrink-0 rounded-xl transition-all duration-300 group-hover:scale-105"
        style={{
          width: iconDimensions.box,
          height: iconDimensions.box,
          background: 'linear-gradient(145deg, #181d3d 0%, #0c0f24 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 2px 10px rgba(56, 189, 248, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
      >
        <svg
          viewBox="0 0 48 48"
          width="100%"
          height="100%"
          fill="none"
          className="p-0.5"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="psCompGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>

          {/* Code bracket left: '<' */}
          <path
            d="M13 18L7.5 24L13 30"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Code bracket right: '>' */}
          <path
            d="M35 18L40.5 24L35 30"
            stroke="#c084fc"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 'P' monogram glyph */}
          <path
            d="M19 16V32M19 16H23.5C25.433 16 27 17.567 27 19.5C27 21.433 25.433 23 23.5 23H19"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 'S' monogram electric stroke */}
          <path
            d="M29 25C28 23.8 26.2 23.6 24.8 24.5C23.2 25.6 23.8 27.6 25.4 28.4C27.5 29.4 27.8 30.8 26.8 31.8C25.6 32.8 23.4 32.6 21.8 31.5"
            stroke="url(#psCompGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Accent dot */}
          <circle cx="28.5" cy="16" r="1.8" fill="#38bdf8" />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-baseline leading-none font-sans font-bold tracking-tight">
          <span
            className="text-transparent bg-clip-text font-black text-sm sm:text-base"
            style={{
              backgroundImage: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            }}
          >
            PS
          </span>
          <span className="text-white text-xs sm:text-sm font-semibold tracking-normal ml-0.5">
            DevTool
          </span>
        </div>
      )}
    </div>
  );
}
