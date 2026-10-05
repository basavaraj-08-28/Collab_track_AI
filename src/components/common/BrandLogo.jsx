import React from 'react';

/**
 * Unique CollabTrack AI Brand Logo
 * Symbolism:
 * - 3 Interconnected Orbital Nodes: Team Collaboration & Peer Synergy
 * - Continuous Fluid Tracking Loop: Real-time Activity & Progress Tracking
 * - Central Neural Spark / Diamond Core: AI-Powered Intelligence & Analytics
 */
export const LogoIcon = ({ size = 36, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
    >
      <defs>
        {/* Background Gradients */}
        <linearGradient id="ct-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        <linearGradient id="ct-orbit-1" x1="20" y1="20" x2="80" y2="80">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        <linearGradient id="ct-orbit-2" x1="80" y1="20" x2="20" y2="80">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        <linearGradient id="ct-core" x1="35" y1="35" x2="65" y2="65">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E0E7FF" />
        </linearGradient>

        {/* Glow & Shadow Filters */}
        <filter id="ct-glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id="ct-shadow" x="-10%" y="-10%" width="120%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#4F46E5" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Rounded Squircle Container with drop shadow */}
      <rect
        x="6"
        y="6"
        width="88"
        height="88"
        rx="26"
        fill="url(#ct-bg)"
        filter="url(#ct-shadow)"
      />

      {/* Subtle Inner Glass Highlight */}
      <rect
        x="7"
        y="7"
        width="86"
        height="43"
        rx="25"
        fill="white"
        fillOpacity="0.12"
      />

      {/* Tracking Orbit Ring 1 - Elliptical Team Loop */}
      <ellipse
        cx="50"
        cy="50"
        rx="30"
        ry="17"
        transform="rotate(-28 50 50)"
        stroke="url(#ct-orbit-1)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="140 30"
        opacity="0.95"
      />

      {/* Tracking Orbit Ring 2 - Intersecting Synergy Loop */}
      <ellipse
        cx="50"
        cy="50"
        rx="30"
        ry="17"
        transform="rotate(32 50 50)"
        stroke="url(#ct-orbit-2)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="130 40"
        opacity="0.85"
      />

      {/* Outer Tracking Pulse Radar Arc */}
      <path
        d="M 24 38 A 33 33 0 0 1 76 38"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />
      <path
        d="M 32 72 A 33 33 0 0 0 68 72"
        stroke="#A5B4FC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.4"
      />

      {/* Collaboration Nodes (3 Team Members interconnected) */}
      {/* Node 1: Top Left */}
      <circle cx="28" cy="34" r="5" fill="#38BDF8" filter="url(#ct-glow)" />
      <circle cx="28" cy="34" r="2.5" fill="#FFFFFF" />

      {/* Node 2: Top Right */}
      <circle cx="72" cy="34" r="5" fill="#C084FC" filter="url(#ct-glow)" />
      <circle cx="72" cy="34" r="2.5" fill="#FFFFFF" />

      {/* Node 3: Bottom Center */}
      <circle cx="50" cy="72" r="5.5" fill="#F472B6" filter="url(#ct-glow)" />
      <circle cx="50" cy="72" r="2.8" fill="#FFFFFF" />

      {/* Interconnecting Neural Lines to Core */}
      <line x1="28" y1="34" x2="50" y2="48" stroke="#E0E7FF" strokeWidth="1.8" strokeDasharray="3 2" strokeOpacity="0.75" />
      <line x1="72" y1="34" x2="50" y2="48" stroke="#E0E7FF" strokeWidth="1.8" strokeDasharray="3 2" strokeOpacity="0.75" />
      <line x1="50" y1="72" x2="50" y2="48" stroke="#E0E7FF" strokeWidth="1.8" strokeDasharray="3 2" strokeOpacity="0.75" />

      {/* Central AI Core / Neural Spark */}
      <g filter="url(#ct-glow)">
        {/* Core Diamond */}
        <path
          d="M 50 38 L 54.5 48 L 60 50 L 54.5 52 L 50 62 L 45.5 52 L 40 50 L 45.5 48 Z"
          fill="url(#ct-core)"
        />
        {/* Core Nucleus Glow */}
        <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

export const BrandLogo = ({
  size = 'md',
  showSubtitle = true,
  theme = 'dark-text', // 'dark-text' | 'light-text'
  className = '',
  onClick
}) => {
  const sizeMap = {
    sm: { icon: 32, title: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 40, title: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 48, title: 'text-xl', sub: 'text-xs' },
    xl: { icon: 56, title: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isLightText = theme === 'light-text';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Custom Distinct Logo Mark */}
      <LogoIcon size={currentSize.icon} />

      {/* Logo Typography */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-black tracking-tight ${currentSize.title} ${
              isLightText
                ? 'text-white group-hover:text-indigo-200 transition-colors'
                : 'text-slate-900 group-hover:text-indigo-600 transition-colors'
            }`}
          >
            COLLAB TRACK
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-xs shadow-indigo-500/30">
            AI
          </span>
        </div>
        {showSubtitle && (
          <p
            className={`font-semibold uppercase tracking-wider mt-1 ${currentSize.sub} ${
              isLightText ? 'text-indigo-200/80' : 'text-slate-400'
            }`}
          >
            AI-Powered Collaboration Intelligence
          </p>
        )}
      </div>
    </div>
  );
};

export default BrandLogo;
