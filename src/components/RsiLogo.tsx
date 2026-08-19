import React from 'react';

interface RsiLogoProps {
  className?: string;
  variant?: 'full' | 'emblem-only' | 'card';
}

export const RsiLogo: React.FC<RsiLogoProps> = ({ 
  className = '', 
  variant = 'full' 
}) => {
  if (variant === 'emblem-only') {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`overflow-visible ${className}`}
      >
        {/* Emblem centered at (60, 60) with generous margin */}
        {/* Layer 1: Outer Dark Green Octagon */}
        <polygon
          points="42,8 78,8 112,42 112,78 78,112 42,112 8,78 8,42"
          fill="#05883d"
        />
        {/* Layer 2: Emerald Rotated Star */}
        <polygon
          points="60,10 110,60 60,110 10,60"
          fill="#16a34a"
          opacity="0.9"
        />
        {/* Layer 3: Lime Layer */}
        <polygon
          points="24,24 96,24 96,96 24,96"
          fill="#84cc16"
          opacity="0.85"
        />
        {/* Layer 4: Inner Rosette */}
        <polygon
          points="44,18 76,18 102,44 102,76 76,102 44,102 18,76 18,44"
          fill="#a3e635"
        />
        <polygon
          points="60,22 98,60 60,98 22,60"
          fill="#4ade80"
        />

        {/* Center Pure White Circle */}
        <circle cx="60" cy="60" r="30" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />

        {/* Crescent Red Logo (Bulan Sabit Merah) */}
        <path
          d="M68 36 C80 44 80 76 68 84 C52 78 50 42 68 36 Z"
          fill="#dc2626"
        />
      </svg>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center justify-center select-none ${className}`}>
      {/* Complete Official Graphic Vector SVG with generous safe padding */}
      <svg
        viewBox="0 0 540 200"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-full drop-shadow-sm overflow-visible"
        style={{ maxHeight: '140px' }}
      >
        {/* White background card with smooth corners and padding */}
        <rect x="0" y="0" width="540" height="200" rx="18" fill="#ffffff" />

        {/* Top Header: YAYASAN BADAN WAKAF SULTAN AGUNG */}
        <text
          x="270"
          y="28"
          textAnchor="middle"
          fill="#05883d"
          fontSize="17"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
          letterSpacing="0.03em"
        >
          YAYASAN BADAN WAKAF SULTAN AGUNG
        </text>

        {/* Left Emblem Group (centered around 75, 115) */}
        <g transform="translate(18, 42)">
          {/* Layer 1: Outer Dark Green Octagon */}
          <polygon
            points="42,8 78,8 112,42 112,78 78,112 42,112 8,78 8,42"
            fill="#05883d"
          />
          {/* Layer 2: Emerald Rotated Star */}
          <polygon
            points="60,10 110,60 60,110 10,60"
            fill="#16a34a"
            opacity="0.9"
          />
          {/* Layer 3: Lime Layer */}
          <polygon
            points="24,24 96,24 96,96 24,96"
            fill="#84cc16"
            opacity="0.85"
          />
          {/* Layer 4: Inner Rosette */}
          <polygon
            points="44,18 76,18 102,44 102,76 76,102 44,102 18,76 18,44"
            fill="#a3e635"
          />
          <polygon
            points="60,22 98,60 60,98 22,60"
            fill="#4ade80"
          />

          {/* Center Pure White Circle */}
          <circle cx="60" cy="60" r="30" fill="#ffffff" stroke="#f1f5f9" strokeWidth="1" />

          {/* Crescent Red Logo (Bulan Sabit Merah) */}
          <path
            d="M68 36 C80 44 80 76 68 84 C52 78 50 42 68 36 Z"
            fill="#dc2626"
          />
        </g>

        {/* Center & Right Typography Group */}
        <g transform="translate(150, 42)">
          {/* Large "RSI" */}
          <text
            x="0"
            y="66"
            fill="#009245"
            fontSize="72"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Impact, 'Arial Black', sans-serif"
            letterSpacing="-0.03em"
          >
            RSI
          </text>

          {/* "SULTAN" and "AGUNG" stacked vertically */}
          <text
            x="138"
            y="35"
            fill="#009245"
            fontSize="34"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
            letterSpacing="0.01em"
          >
            SULTAN
          </text>
          <text
            x="138"
            y="68"
            fill="#009245"
            fontSize="34"
            fontWeight="900"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, 'Arial Black', sans-serif"
            letterSpacing="0.01em"
          >
            AGUNG
          </text>

          {/* ISLAMIC TEACHING HOSPITAL */}
          <text
            x="2"
            y="94"
            fill="#334155"
            fontSize="18"
            fontWeight="800"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            letterSpacing="0.06em"
          >
            ISLAMIC TEACHING HOSPITAL
          </text>

          {/* Bottom Syariah Pill Badge */}
          <rect
            x="0"
            y="105"
            width="370"
            height="28"
            rx="14"
            fill="#009245"
          />
          <text
            x="185"
            y="124"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="14.5"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
            letterSpacing="0.02em"
          >
            Rumah Sakit Sesuai Prinsip Syariah
          </text>
        </g>
      </svg>
    </div>
  );
};
