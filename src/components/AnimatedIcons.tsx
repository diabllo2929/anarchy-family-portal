"use client";

import { motion } from "framer-motion";

export function AnimatedMoonIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ rotate: [-8, 12, -4, 0], scale: 1.15 }}
      transition={{ duration: 0.6 }}
    >
      <motion.path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(52, 211, 153, 0.15)"
      />
      <motion.circle
        cx="17"
        cy="6"
        r="1.2"
        fill="#a7f3d0"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      />
    </motion.svg>
  );
}

export function AnimatedUniIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ y: -3, scale: 1.15 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <path
        d="M22 10L12 5L2 10L12 15L22 10Z"
        stroke="#38bdf8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(56, 189, 248, 0.18)"
      />
      <motion.path
        d="M6 12.5V17.5C6 17.5 8.5 20 12 20C15.5 20 18 17.5 18 17.5V12.5"
        stroke="#7dd3fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

export function AnimatedWorkIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
      transition={{ duration: 0.5 }}
    >
      <rect
        x="2"
        y="7"
        width="20"
        height="14"
        rx="3"
        stroke="#fbbf24"
        strokeWidth="2"
        fill="rgba(251, 191, 36, 0.15)"
      />
      <path
        d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"
        stroke="#fde68a"
        strokeWidth="2"
      />
    </motion.svg>
  );
}

export function AnimatedCoursesIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ scale: 1.15 }}
    >
      <path
        d="M2 4H8C9.06087 4 10.0783 4.42143 10.8284 5.17157C11.5786 5.92172 12 6.93913 12 8V20C12 19.2044 11.6839 18.4413 11.1213 17.8787C10.5587 17.3161 9.79565 17 9 17H2V4Z"
        stroke="#c084fc"
        strokeWidth="2"
        fill="rgba(192, 132, 252, 0.16)"
      />
      <path
        d="M22 4H16C14.9391 4 13.9217 4.42143 13.1716 5.17157C12.4214 5.92172 12 6.93913 12 8V20C12 19.2044 12.3161 18.4413 12.8787 17.8787C13.4413 17.3161 14.2044 17 15 17H22V4Z"
        stroke="#e879f9"
        strokeWidth="2"
        fill="rgba(232, 121, 249, 0.12)"
      />
    </motion.svg>
  );
}

export function AnimatedFitnessIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ y: [-2, -6, 0], rotate: [-6, 6, 0] }}
      transition={{ duration: 0.45 }}
    >
      <path
        d="M6.5 6.5L17.5 17.5M4 9L9 4M15 20L20 15M2.5 11.5L11.5 2.5M12.5 21.5L21.5 12.5"
        stroke="#fb7185"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

export function AnimatedGamingIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      whileHover={{ rotate: [0, -12, 12, 0], scale: 1.15 }}
      transition={{ duration: 0.5 }}
    >
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="6"
        stroke="#f472b6"
        strokeWidth="2"
        fill="rgba(244, 114, 182, 0.15)"
      />
      <path d="M6 12H10M8 10V14" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" />
      <motion.circle
        cx="15.5"
        cy="10.5"
        r="1.1"
        fill="#f472b6"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
      <motion.circle
        cx="17.5"
        cy="13"
        r="1.1"
        fill="#38bdf8"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />
    </motion.svg>
  );
}