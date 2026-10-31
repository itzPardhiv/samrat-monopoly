import React from 'react';
import { MapEdition } from '../game/boardData';

export const TokenIcon: React.FC<{
  tokenKey: string;
  color?: string;
  size?: number;
  className?: string;
}> = ({ tokenKey, color = '#F59E0B', size = 22, className = '' }) => {
  switch (tokenKey) {
    case 'train':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="13" rx="4" fill={color} stroke="#0B101E" strokeWidth="1.8" />
          <path d="M6 9H18V12H6V9Z" fill="#0B101E" />
          <circle cx="8" cy="15.5" r="1.3" fill="#FFFBEB" />
          <circle cx="16" cy="15.5" r="1.3" fill="#FFFBEB" />
          <path d="M5 20L7 18M19 20L17 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'peacock':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M12 3C7.5 3 4 6.5 4 11C4 14.5 6.5 17.5 10 18.5L9 21H15L14 18.5C17.5 17.5 20 14.5 20 11C20 6.5 16.5 3 12 3Z"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="10" r="3.2" fill="#0B101E" />
          <circle cx="12" cy="10" r="1.4" fill="#FDE68A" />
        </svg>
      );
    case 'crown':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M3 18L5 7L9.5 12L12 5L14.5 12L19 7L21 18H3Z"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="14.5" r="1.5" fill="#FFFBEB" />
        </svg>
      );
    case 'rocket':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M12 2C15.5 6 16.5 11 16.5 15.5H7.5C7.5 11 8.5 6 12 2Z"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.8"
          />
          <path d="M7.5 13L4 17.5H7.5M16.5 13L20 17.5H16.5" fill={color} stroke="#0B101E" strokeWidth="1.6" />
          <circle cx="12" cy="10" r="2" fill="#0B101E" />
          <path d="M10 18.5L12 22L14 18.5" fill="#F97316" />
        </svg>
      );
    case 'wheel':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" fill={color} stroke="#0B101E" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3" fill="#0B101E" />
          <path d="M12 3V21M3 12H21M5.6 5.6L18.4 18.4M18.4 5.6L5.6 18.4" stroke="#0B101E" strokeWidth="1.4" />
        </svg>
      );
    case 'horse':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M6 19L8 14C8 14 7 11 8.5 7.5C10 4 13.5 3 15 5C16.5 7 15.5 9 14.5 10L17 12L16 14L13.5 13L12 16L13.5 19H6Z"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12.5" cy="6.5" r="1.2" fill="#0B101E" />
        </svg>
      );
    case 'chariot':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <rect x="4" y="6" width="10" height="9" rx="2" fill={color} stroke="#0B101E" strokeWidth="1.8" />
          <path d="M14 10H19L21 14H14" fill={color} stroke="#0B101E" strokeWidth="1.6" />
          <circle cx="7" cy="18" r="3.2" fill={color} stroke="#0B101E" strokeWidth="1.8" />
          <circle cx="7" cy="18" r="1" fill="#FFFBEB" />
          <circle cx="17" cy="18" r="3.2" fill={color} stroke="#0B101E" strokeWidth="1.8" />
          <circle cx="17" cy="18" r="1" fill="#FFFBEB" />
        </svg>
      );
    case 'ship':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path d="M3 15L6 19H18L21 15H3Z" fill={color} stroke="#0B101E" strokeWidth="1.8" />
          <path d="M12 4V15M12 5L17 9H12M12 7L7 11H12" stroke="#0B101E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'lotus':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M12 4C14 8 17 12 17 15C17 17.5 14.5 19.5 12 19.5C9.5 19.5 7 17.5 7 15C7 12 10 8 12 4Z"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.6"
          />
          <path
            d="M12 11C15 13.5 19.5 14.5 20.5 17C21.5 19.5 19 20.5 16 20C13.5 19.5 12.5 17 12 16"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.4"
          />
          <path
            d="M12 11C9 13.5 4.5 14.5 3.5 17C2.5 19.5 5 20.5 8 20C10.5 19.5 11.5 17 12 16"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.4"
          />
        </svg>
      );
    case 'tiger':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="7.5" fill={color} stroke="#0B101E" strokeWidth="1.8" />
          <circle cx="6" cy="7" r="2.5" fill={color} stroke="#0B101E" strokeWidth="1.5" />
          <circle cx="18" cy="7" r="2.5" fill={color} stroke="#0B101E" strokeWidth="1.5" />
          <circle cx="9.5" cy="11.5" r="1.2" fill="#0B101E" />
          <circle cx="14.5" cy="11.5" r="1.2" fill="#0B101E" />
          <path d="M10 15C11 16 13 16 14 15" stroke="#0B101E" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 7V9M7 12H9M15 12H17" stroke="#0B101E" strokeWidth="1.2" />
        </svg>
      );
    case 'elephant':
    default:
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          <path
            d="M6 10C6 6.8 8.8 4.5 12.5 4.5C16.5 4.5 19 7 19 10.5V18.5H15.5V15H11.5V18.5H8V13.5C6.5 13.5 5 12.5 5 10.5V8.5H7"
            fill={color}
            stroke="#0B101E"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10.2" cy="8.8" r="1.2" fill="#0B101E" />
          <path d="M12 6.5H16V10H12V6.5Z" fill="#FEF3C7" opacity="0.85" />
        </svg>
      );
  }
};

export const AVAILABLE_PLAYER_TOKENS = [
  { key: 'elephant', label: 'Airavata (Elephant)', desc: 'Royal sovereign mount of Bharat kings' },
  { key: 'peacock', label: 'Mayura (Peacock)', desc: 'Graceful national herald of India' },
  { key: 'horse', label: 'Ashwa (Steed)', desc: 'Swift Rajputana war charger' },
  { key: 'chariot', label: 'Ratha (Chariot)', desc: 'Epic sun chariot of Konark' },
  { key: 'lotus', label: 'Padma (Lotus)', desc: 'Eternal architectural symbol of wisdom' },
  { key: 'crown', label: 'Mukut (Crown)', desc: 'Emperor coronation insignia' },
  { key: 'tiger', label: 'Vyaghra (Tiger)', desc: 'Fierce guardian of the Sundarbans' },
  { key: 'train', label: 'Vande Rail', desc: 'Modern rapid express across the sub-continent' },
  { key: 'rocket', label: 'Vikram Rocket', desc: 'Chandrayaan aerospace pioneer' },
  { key: 'ship', label: 'Samudra Ship', desc: 'Chola maritime mercantile galleon' },
] as const;

export const BoardCenterpieceMedallion: React.FC<{ edition: MapEdition }> = ({ edition }) => {
  if (edition === 'india') {
    return (
      <svg
        viewBox="0 0 260 260"
        className="w-full h-full max-w-[210px] max-h-[210px] opacity-25 pointer-events-none select-none"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="indiaGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#D97706" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0B101E" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="130" cy="130" r="122" fill="url(#indiaGlow)" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="130" cy="130" r="98" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
        <circle cx="130" cy="130" r="72" fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="2 3" />
        {/* 8-petal Royal Lotus Mandala */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 130 130)`}>
            <path
              d="M130 28 C142 52, 146 72, 130 92 C114 72, 118 52, 130 28 Z"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="1.3"
            />
          </g>
        ))}
        {/* Stylized Taj / Mandir Silhouette in Center */}
        <path
          d="M95 156 L165 156 L160 132 L148 132 C148 114, 138 102, 130 94 C122 102, 112 114, 112 132 L100 132 Z"
          fill="#F59E0B"
          fillOpacity="0.3"
          stroke="#FDE68A"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 260 260"
      className="w-full h-full max-w-[210px] max-h-[210px] opacity-25 pointer-events-none select-none"
      aria-hidden="true"
    >
      <circle cx="130" cy="130" r="118" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="5 4" />
      <circle cx="130" cy="130" r="92" fill="none" stroke="#F59E0B" strokeWidth="1.2" />
      <ellipse cx="130" cy="130" rx="92" ry="42" fill="none" stroke="#38BDF8" strokeWidth="1" />
      <ellipse cx="130" cy="130" rx="42" ry="92" fill="none" stroke="#38BDF8" strokeWidth="1" />
      <line x1="12" y1="130" x2="248" y2="130" stroke="#F59E0B" strokeWidth="1" />
      <line x1="130" y1="12" x2="130" y2="248" stroke="#F59E0B" strokeWidth="1" />
      <polygon points="130,30 138,122 230,130 138,138 130,230 122,138 30,130 122,122" fill="#F59E0B" fillOpacity="0.25" stroke="#FDE68A" strokeWidth="1.2" />
    </svg>
  );
};
