"use client";

import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export default function AnarchyAnimatedLogo({ size = "md" }: LogoProps) {
  const dimensions =
    size === "sm"
      ? "w-12 h-12 rounded-2xl p-1.5"
      : size === "lg"
      ? "w-28 h-28 rounded-[30px] p-3"
      : "w-16 h-16 rounded-2xl p-2";

  // توقيتات اللوب المستمر (رسم -> ثبات -> تلاشي -> إعادة رسم)
  const loopTransition = {
    duration: 4.5,
    repeat: Infinity,
    repeatDelay: 0.4,
    ease: "easeInOut" as const,
  };

  return (
    <motion.div
      whileHover={{ scale: 1.07 }}
      className={`${dimensions} bg-gradient-to-b from-[#160a0c] to-[#050304] border border-red-500/40 shadow-[0_0_35px_rgba(220,38,38,0.4)] flex items-center justify-center relative overflow-hidden shrink-0`}
    >
      <div className="absolute inset-0 bg-radial from-red-600/20 via-transparent to-transparent pointer-events-none" />

      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <filter id="crimsonGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="anarchyRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4545" />
            <stop offset="55%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* 1. نقطة البداية المتوهجة */}
        <motion.circle
          cx="60"
          cy="14"
          r="3.5"
          fill="#ff4d4d"
          filter="url(#crimsonGlow)"
          animate={{
            scale: [0, 1.5, 1, 1, 0],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            ...loopTransition,
            times: [0, 0.1, 0.2, 0.85, 1],
          }}
        />

        {/* 2. الضلع الأيسر لحرف A */}
        <motion.path
          d="M 60 14 L 28 104"
          stroke="url(#anarchyRed)"
          strokeWidth="6.5"
          strokeLinecap="round"
          filter="url(#crimsonGlow)"
          animate={{
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            ...loopTransition,
            times: [0.06, 0.25, 0.85, 1],
          }}
        />

        {/* 3. الضلع الأيمن لحرف A */}
        <motion.path
          d="M 60 14 L 92 104"
          stroke="url(#anarchyRed)"
          strokeWidth="6.5"
          strokeLinecap="round"
          filter="url(#crimsonGlow)"
          animate={{
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            ...loopTransition,
            times: [0.12, 0.32, 0.85, 1],
          }}
        />

        {/* 4. الدايرة المحيطة */}
        <motion.path
          d="M 60 22 C 84 22, 100 40, 100 62 C 100 85, 82 101, 60 101 C 37 101, 20 84, 20 62 C 20 43, 33 27, 51 23"
          stroke="url(#anarchyRed)"
          strokeWidth="5.2"
          strokeLinecap="round"
          filter="url(#crimsonGlow)"
          animate={{
            pathLength: [0, 1, 1, 0],
            opacity: [0, 0.95, 0.95, 0],
          }}
          transition={{
            ...loopTransition,
            times: [0.22, 0.48, 0.85, 1],
          }}
        />

        {/* 5. الشرطة العرضية الحادة */}
        <motion.path
          d="M 12 72 L 109 55"
          stroke="#ff2a2a"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#crimsonGlow)"
          animate={{
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            ...loopTransition,
            times: [0.42, 0.58, 0.85, 1],
          }}
        />
      </svg>
    </motion.div>
  );
}