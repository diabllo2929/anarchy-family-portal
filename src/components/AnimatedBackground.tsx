"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0b0f19]">
      {/* إضاءة علوية يمين - Indigo / Blue */}
      <motion.div
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[15%] -right-[10%] w-[650px] h-[650px] rounded-full bg-indigo-600/20 blur-[140px]"
      />

      {/* إضاءة سفلية شمال - Cyan / Teal */}
      <motion.div
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 50, -30, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[15%] -left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-500/15 blur-[140px]"
      />

      {/* إضاءة وسطى ناعمة - Violet */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.08, 0.14, 0.08],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[35%] left-[30%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[150px]"
      />

      {/* طبقة تدرج خفيفة لتنعيم الحواف */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b0f19]/40 to-[#0b0f19]/90" />
    </div>
  );
}