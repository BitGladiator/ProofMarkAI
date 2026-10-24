import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

export const ShieldLogoIcon: React.FC<IconProps> = ({ className, size = 26 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
  >
    <defs>
      <linearGradient id="shieldLeftGreen" x1="3.5" y1="2" x2="12" y2="23" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3d8b66" />
        <stop offset="100%" stopColor="#256446" />
      </linearGradient>
      <linearGradient id="shieldRightGreen" x1="12" y1="2" x2="20.5" y2="23" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e4d37" />
        <stop offset="100%" stopColor="#123324" />
      </linearGradient>
      <filter id="shieldShadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="1" stdDeviation="0.75" floodOpacity="0.2" floodColor="#0d2419" />
      </filter>
    </defs>
    <g filter="url(#shieldShadow)">
      {/* Left faceted half (lighter emerald green) */}
      <path
        d="M12 1.8L3.5 5V11.8C3.5 17.2 7.2 21.2 12 22.8V1.8Z"
        fill="url(#shieldLeftGreen)"
      />
      {/* Right faceted half (darker forest green) */}
      <path
        d="M12 1.8L20.5 5V11.8C20.5 17.2 16.8 21.2 12 22.8V1.8Z"
        fill="url(#shieldRightGreen)"
      />
      {/* Outer shield perimeter stroke */}
      <path
        d="M12 1.8L3.5 5V11.8C3.5 17.2 7.2 21.2 12 22.8C16.8 21.2 20.5 17.2 20.5 11.8V5L12 1.8Z"
        stroke="#123525"
        strokeWidth="0.6"
        fill="none"
      />
      {/* Bold rounded white checkmark */}
      <path
        d="M8.2 12.2L11 15.2L16.2 9.5"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ className, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ className, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" />
  </svg>
);

export const BookOpenIcon: React.FC<IconProps> = ({ className, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2 3H8C10.2091 3 12 4.79086 12 7V21C12 19.3431 10.6569 18 9 18H2V3Z" />
    <path d="M22 3H16C13.7909 3 12 4.79086 12 7V21C12 19.3431 13.3431 18 15 18H22V3Z" />
  </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({ className, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3V21M3 7H21M6 7L3 14C3 15.6569 4.34315 17 6 17C7.65685 17 9 15.6569 9 14L6 7ZM18 7L15 14C15 15.6569 16.3431 17 18 17C19.6569 17 21 15.6569 21 14L18 7Z" />
  </svg>
);

export const UserCheckIcon: React.FC<IconProps> = ({ className, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ className, size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
