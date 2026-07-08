import React from 'react';

interface AIRobotLiftingIconProps {
  size?: number;
  className?: string;
}

export default function AIRobotLiftingIcon({
  size = 24,
  className = "",
}: AIRobotLiftingIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dumbbell / Barbell Shaft */}
      <path
        d="M 3 5.5 L 21 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Left Weight Plates */}
      <rect x="5.5" y="2" width="2" height="7" rx="0.5" fill="currentColor" />
      <rect x="3" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" />

      {/* Right Weight Plates */}
      <rect x="16.5" y="2" width="2" height="7" rx="0.5" fill="currentColor" />
      <rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" />

      {/* Robot Arms (holding/pressing the barbell) */}
      <path
        d="M 6.5 14.5 Q 4 10, 8 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 17.5 14.5 Q 20 10, 16 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Robot Ears / Side Connectors */}
      <rect x="5" y="13.5" width="1" height="3" rx="0.5" fill="currentColor" />
      <rect x="18" y="13.5" width="1" height="3" rx="0.5" fill="currentColor" />

      {/* Robot Head Body */}
      <rect
        x="6"
        y="11"
        width="12"
        height="9"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="#09090B"
      />

      {/* Robot Eyes (Glowing Blue/Teal) */}
      <circle cx="9.5" cy="14.5" r="1.2" fill="#38BDF8" className="animate-pulse" />
      <circle cx="14.5" cy="14.5" r="1.2" fill="#38BDF8" className="animate-pulse" />

      {/* Mouth Panel */}
      <rect
        x="9"
        y="17"
        width="6"
        height="1"
        rx="0.5"
        fill="currentColor"
        opacity="0.5"
      />

      {/* Top Antenna */}
      <line
        x1="12"
        y1="11"
        x2="12"
        y2="8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="7.5" r="1" fill="#A78BFA" />
    </svg>
  );
}
