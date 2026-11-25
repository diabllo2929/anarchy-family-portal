"use client";

import { motion } from "framer-motion";

interface Props {
  score: number;
  size?: number;
}

export default function CircularScoreRing({ score, size = 160 }: Props) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const activeColor =
    score >= 75 ? "#34d399" : score >= 45 ? "#faf7f0" : "#fbbf24";

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Ambient Radial Halo */}
      <div
        className="absolute inset-4 rounded-full blur-2xl opacity-30 transition-colors duration-700"
        style={{ backgroundColor: activeColor }}
      />

      {/* Outer Decorative Dashed Orbit */}
      <motion.svg
        width={size}
        height={size}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="absolute inset-0 opacity-25"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 3}
          fill="transparent"
          stroke="#fdfbf7"
          strokeWidth="1"
          strokeDasharray="3 7"
        />
      </motion.svg>

      {/* Main Progress SVG */}
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(253, 251, 247, 0.07)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      {/* Center Creamy Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <motion.span
          key={score}
          initial={{ scale: 0.85, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-black text-white tracking-tight"
        >
          {score}%
        </motion.span>
        <span className="text-[11px] font-bold text-[#e2d8c5]/80 mt-0.5">
          مؤشر الإنجاز
        </span>
      </div>
    </div>
  );
}