import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../../contexts/DataContext';

interface GymOSLogoProps {
  className?: string;
  size?: number; // Size of the icon/symbol
  showText?: boolean;
  showSubtitle?: boolean;
  textClassName?: string;
  subtitleClassName?: string;
  animate?: boolean;
}

export default function GymOSLogo({
  className = "",
  size = 40,
  showText = false,
  showSubtitle = false,
  textClassName = "",
  subtitleClassName = "",
  animate = true,
}: GymOSLogoProps) {
  let settings: any = null;
  try {
    const data = useData();
    settings = data.settings;
  } catch (error) {
    // Graceful fallback if rendered outside DataProvider context
  }

  const gymLogo = settings?.gym_logo;
  const gymName = settings?.gym_name || "GYM OS";

  const words = gymName.trim().split(/\s+/);
  const firstWord = words[0] || "GYM";
  const restOfName = words.slice(1).join(" ") || "OS";

  const iconVariants = {
    initial: { opacity: 0, scale: 0.9, rotate: -5 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Dynamic uploaded Logo or High-Precision GymOS Symbol SVG */}
      {gymLogo ? (
        <motion.img
          src={gymLogo}
          alt={`${gymName} Logo`}
          className="shrink-0 object-cover rounded-xl border border-white/5"
          style={{ width: size, height: size }}
          initial={animate ? "initial" : undefined}
          animate={animate ? "animate" : undefined}
          variants={iconVariants}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <motion.svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          initial={animate ? "initial" : undefined}
          animate={animate ? "animate" : undefined}
          variants={iconVariants}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="shrink-0 text-white"
        >
          {/* Robot Antenna */}
          <line x1="50" y1="24" x2="50" y2="15" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="50" cy="11" r="3.5" fill="currentColor" />

          {/* Robot Helmet/Head */}
          <rect x="33" y="22" width="34" height="28" rx="14" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none" />

          {/* Visor Area (Dark) */}
          <rect x="38" y="29" width="24" height="12" rx="6" fill="#0E0E11" stroke="currentColor" strokeWidth="2.5" />

          {/* Glowing Green/Teal Eyes */}
          <rect x="42.5" y="33" width="5" height="4" rx="2" fill="#10B981" />
          <rect x="52.5" y="33" width="5" height="4" rx="2" fill="#10B981" />

          {/* Robot Arms/Body holding the barbell */}
          <path
            d="M 42 66 C 36 66, 32 58, 32 52"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 58 66 C 64 66, 68 58, 68 52"
            stroke="currentColor"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Barbell Bar */}
          <line x1="16" y1="52" x2="84" y2="52" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

          {/* Left Side Plates */}
          <rect x="27" y="36" width="4.5" height="32" rx="2" fill="currentColor" />
          <rect x="21" y="42" width="4.5" height="20" rx="1.5" fill="currentColor" />
          <rect x="15" y="46" width="3" height="12" rx="1" fill="currentColor" />

          {/* Right Side Plates */}
          <rect x="68.5" y="36" width="4.5" height="32" rx="2" fill="currentColor" />
          <rect x="74.5" y="42" width="4.5" height="20" rx="1.5" fill="currentColor" />
          <rect x="82" y="46" width="3" height="12" rx="1" fill="currentColor" />
        </motion.svg>
      )}

      {/* Optional Branding Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`flex items-center font-display font-black tracking-wider text-white ${textClassName}`}>
            <span className="uppercase">{firstWord}</span>
            <span className="uppercase text-[#10B981] ml-1.5">{restOfName}</span>
          </div>
          {showSubtitle && (
            <span className={`text-[8px] font-mono tracking-[0.25em] text-zinc-400 font-semibold uppercase ${subtitleClassName}`}>
              AI-Powered Gym Management
            </span>
          )}
        </div>
      )}
    </div>
  );
}
