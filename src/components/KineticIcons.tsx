"use client";

import { motion } from "framer-motion";

export function KineticMoon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      whileHover={{ rotate: [-10, 14, -4, 0], scale: 1.15 }}
      transition={{ duration: 0.65 }}
    >
      <defs>
        <linearGradient id="moonGrad" x1="4" y1="4" x2="28" y2="28">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <motion.path
        d="M26.5 17.8A11.5 11.5 0 1 1 14.2 5.5a9 9 0 0 0 12.3 12.3z"
        fill="url(#moonGrad)"
        fillOpacity="0.22"
        stroke="url(#moonGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d="M22 6L22.8 8.2L25 9L22.8 9.8L22 12L21.2 9.8L19 9L21.2 8.2L22 6Z"
        fill="#a7f3d0"
        animate={{ scale: [0.8, 1.35, 0.8], opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

export function KineticUni({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      whileHover={{ y: -3, scale: 1.15 }}
      transition={{ type: "spring", stiffness: 320 }}
    >
      <defs>
        <linearGradient id="uniGrad" x1="2" y1="8" x2="30" y2="24">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <path
        d="M16 6L3 12.5L16 19L29 12.5L16 6Z"
        fill="url(#uniGrad)"
        fillOpacity="0.25"
        stroke="url(#uniGrad)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M8 15.5V22C8 22 11.5 25 16 25C20.5 25 24 22 24 22V15.5"
        stroke="#38bdf8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <motion.line
        x1="28"
        y1="13"
        x2="28"
        y2="21"
        stroke="#bae6fd"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: 2.6 }}
      />
    </motion.svg>
  );
}

export function KineticWork({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.15 }}
      transition={{ duration: 0.5 }}
    >
      <rect
        x="4"
        y="10"
        width="24"
        height="16"
        rx="4"
        fill="rgba(251, 191, 36, 0.2)"
        stroke="#fbbf24"
        strokeWidth="2.2"
      />
      <path
        d="M11 10V7.5C11 6.11929 12.1193 5 13.5 5H18.5C19.8807 5 21 6.11929 21 7.5V10"
        stroke="#fde68a"
        strokeWidth="2.2"
      />
      <motion.rect
        x="14"
        y="15"
        width="4"
        height="4"
        rx="1"
        fill="#fef3c7"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.svg>
  );
}

export function KineticCourses({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      whileHover={{ scale: 1.15 }}
    >
      <path
        d="M4 7H12C14.2091 7 16 8.79086 16 11V25C16 23.3431 14.6569 22 13 22H4V7Z"
        fill="rgba(192, 132, 252, 0.2)"
        stroke="#c084fc"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M28 7H20C17.7909 7 16 8.79086 16 11V25C16 23.3431 17.3431 22 19 22H28V7Z"
        fill="rgba(232, 121, 249, 0.16)"
        stroke="#e879f9"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <motion.path
        d="M20 12H24M20 16H23"
        stroke="#f5d0fe"
        strokeWidth="2"
        strokeLinecap="round"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
      />
    </motion.svg>
  );
}

export function KineticFitness({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      animate={{ y: [0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
      whileHover={{ rotate: [-12, 12, 0], scale: 1.18 }}
    >
      <line x1="9" y1="16" x2="23" y2="16" stroke="#fda4af" strokeWidth="2.8" strokeLinecap="round" />
      <rect x="5" y="10" width="4" height="12" rx="2" fill="#fb7185" />
      <rect x="23" y="10" width="4" height="12" rx="2" fill="#fb7185" />
      <rect x="2" y="12.5" width="2.5" height="7" rx="1.2" fill="#fecdd3" />
      <rect x="27.5" y="12.5" width="2.5" height="7" rx="1.2" fill="#fecdd3" />
    </motion.svg>
  );
}

export function KineticGaming({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
      transition={{ duration: 0.45 }}
    >
      <rect
        x="3"
        y="8"
        width="26"
        height="16"
        rx="8"
        fill="rgba(244, 114, 182, 0.18)"
        stroke="#f472b6"
        strokeWidth="2.2"
      />
      <path d="M9 16H13M11 14V18" stroke="#fbcfe8" strokeWidth="2.2" strokeLinecap="round" />
      <motion.circle
        cx="20.5"
        cy="14"
        r="1.5"
        fill="#f472b6"
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
      />
      <motion.circle
        cx="23"
        cy="17.5"
        r="1.5"
        fill="#38bdf8"
        animate={{ scale: [1.4, 1, 1.4], opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
      />
    </motion.svg>
  );
}