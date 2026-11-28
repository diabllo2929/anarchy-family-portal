"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert, Flame, Radio } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logoReady, setLogoReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoSvgRef = useRef<SVGSVGElement | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session) {
        router.replace("/");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted && user) {
        router.replace("/");
      }
    };
    checkExistingSession();
    return () => {
      mounted = false;
    };
  }, [supabase, router]);

  // المحاكاة الفيزيائية للدم، البرك المتراكمة، وجزيئات الرماد والجمر
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    interface BloodStream {
      rx: number;
      ry: number;
      currentY: number;
      speed: number;
      thickness: number;
      wobbleSeed: number;
      delayFrames: number;
      reachedBottom: boolean;
      puddleSpread: number;
      puddleDepth: number;
    }

    interface FallingDrop {
      x: number;
      y: number;
      vy: number;
      radius: number;
      streamIdx: number;
      trail: { x: number; y: number; r: number }[];
    }

    interface SplatterParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      life: number;
    }

    interface EmberParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      isAsh: boolean;
      phase: number;
    }

    const streams: BloodStream[] = [
      { rx: 24 / 120, ry: 103 / 120, currentY: 0, speed: 1.9, thickness: 6.2, wobbleSeed: 1.2, delayFrames: 12, reachedBottom: false, puddleSpread: 0, puddleDepth: 0 },
      { rx: 38 / 120, ry: 69 / 120, currentY: 0, speed: 1.5, thickness: 4.8, wobbleSeed: 2.8, delayFrames: 28, reachedBottom: false, puddleSpread: 0, puddleDepth: 0 },
      { rx: 60 / 120, ry: 69 / 120, currentY: 0, speed: 2.15, thickness: 6.8, wobbleSeed: 4.1, delayFrames: 18, reachedBottom: false, puddleSpread: 0, puddleDepth: 0 },
      { rx: 82 / 120, ry: 69 / 120, currentY: 0, speed: 1.55, thickness: 5.0, wobbleSeed: 5.4, delayFrames: 34, reachedBottom: false, puddleSpread: 0, puddleDepth: 0 },
      { rx: 96 / 120, ry: 103 / 120, currentY: 0, speed: 2.3, thickness: 6.5, wobbleSeed: 6.9, delayFrames: 14, reachedBottom: false, puddleSpread: 0, puddleDepth: 0 },
    ];

    const embers: EmberParticle[] = Array.from({ length: 34 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: -(0.35 + Math.random() * 0.85),
      size: 1.2 + Math.random() * 2.4,
      alpha: 0.25 + Math.random() * 0.65,
      isAsh: i % 3 === 0,
      phase: Math.random() * Math.PI * 2,
    }));

    const drops: FallingDrop[] = [];
    const splatters: SplatterParticle[] = [];
    let bloodFrame = 0;
    let globalFrame = 0;

    const render = () => {
      globalFrame++;
      ctx.clearRect(0, 0, width, height);

      // 0. رسم جزيئات الرماد والجمر في الخلفية
      embers.forEach((em) => {
        em.x += em.vx + Math.sin(globalFrame * 0.015 + em.phase) * 0.25;
        em.y += em.vy;

        if (em.y < -15) {
          em.y = height + 15;
          em.x = Math.random() * width;
        }
        if (em.x < -15) em.x = width + 15;
        if (em.x > width + 15) em.x = -15;

        const flicker = 0.65 + 0.35 * Math.sin(globalFrame * 0.08 + em.phase);
        ctx.save();
        if (em.isAsh) {
          ctx.fillStyle = `rgba(180, 165, 165, ${em.alpha * 0.45 * flicker})`;
        } else {
          ctx.fillStyle = `rgba(239, 68, 68, ${em.alpha * flicker})`;
          ctx.shadowColor = "rgba(220, 38, 38, 0.85)";
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (!logoReady) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      bloodFrame++;
      const rect = logoSvgRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // 1. خيوط الدم السائلة من أطراف اللوجو
      streams.forEach((s, idx) => {
        if (bloodFrame < s.delayFrames) return;

        const startX = rect.left + rect.width * s.rx;
        const startY = rect.top + rect.height * s.ry;

        if (s.currentY === 0) s.currentY = startY;

        const floorY = height - s.puddleDepth * 0.4;
        const viscosityFactor = 0.72 + 0.48 * Math.sin(bloodFrame * 0.04 + s.wobbleSeed);

        if (s.currentY < floorY) {
          s.currentY += s.speed * viscosityFactor;
        } else {
          s.currentY = floorY;
          s.reachedBottom = true;
          s.puddleSpread = Math.min(135, s.puddleSpread + 0.24);
          s.puddleDepth = Math.min(20, s.puddleDepth + 0.025);
        }

        if (bloodFrame % (90 + idx * 25) === 0 && s.currentY > startY + 28) {
          drops.push({
            x: startX,
            y: Math.min(s.currentY, floorY - 12),
            vy: 1.5,
            radius: s.thickness * 0.85,
            streamIdx: idx,
            trail: [],
          });
        }

        const grad = ctx.createLinearGradient(startX, startY, startX, s.currentY);
        grad.addColorStop(0, "#3b0406");
        grad.addColorStop(0.45, "#78080c");
        grad.addColorStop(0.85, "#a30b11");
        grad.addColorStop(1, "#c9141b");

        ctx.save();
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(130, 8, 12, 0.55)";
        ctx.shadowBlur = 8;

        const steps = 30;
        const totalLen = Math.max(1, s.currentY - startY);
        const leftPoints: { x: number; y: number }[] = [];
        const rightPoints: { x: number; y: number }[] = [];

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const y = startY + t * totalLen;
          const sway = Math.sin(t * 7 + s.wobbleSeed) * 2.4 * t;
          const bulbTop = Math.exp(-t * 9) * (s.thickness * 0.95);
          const bulbTip = s.reachedBottom
            ? Math.exp(-(1 - t) * 7) * (s.thickness * 1.1)
            : Math.exp(-(1 - t) * 13) * (s.thickness * 0.8);
          const wave = Math.sin(t * 16 - bloodFrame * 0.05 + s.wobbleSeed) * 0.7;
          const halfW = Math.max(1.3, s.thickness * 0.38 + bulbTop + bulbTip + wave);

          leftPoints.push({ x: startX + sway - halfW, y });
          rightPoints.push({ x: startX + sway + halfW, y });
        }

        ctx.beginPath();
        ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
        for (let i = 1; i < leftPoints.length; i++) {
          ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
        }
        const tipX = (leftPoints[steps].x + rightPoints[steps].x) / 2;
        const tipY = leftPoints[steps].y;
        const tipR = (rightPoints[steps].x - leftPoints[steps].x) / 2;
        ctx.arc(tipX, tipY, tipR, Math.PI, 0, true);

        for (let i = rightPoints.length - 1; i >= 0; i--) {
          ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 175, 175, 0.24)";
        ctx.lineWidth = 1;
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          const y = startY + t * totalLen;
          const sway = Math.sin(t * 7 + s.wobbleSeed) * 2.4 * t;
          if (i === 1) ctx.moveTo(startX + sway - 0.8, y);
          else ctx.lineTo(startX + sway - 0.8, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      // 2. تراكم برك الدم الفيزيائية في أسفل الشاشة
      const activePuddles = streams.filter((s) => s.puddleSpread > 0.5);
      if (activePuddles.length > 0) {
        ctx.save();
        const getSurfaceHeightAt = (x: number) => {
          let totalH = 0;
          activePuddles.forEach((s) => {
            const centerX =
              rect.left + rect.width * s.rx + Math.sin(7 + s.wobbleSeed) * 2.4;
            const dist = Math.abs(x - centerX);
            if (dist < s.puddleSpread) {
              const norm = dist / s.puddleSpread;
              const profile = Math.pow(Math.cos((norm * Math.PI) / 2), 1.65);
              const edgeIrregularity =
                1 + 0.14 * Math.sin(x * 0.05 + s.wobbleSeed) * norm;
              totalH += s.puddleDepth * profile * edgeIrregularity;
            }
          });
          return Math.min(26, totalH);
        };

        const maxPoolH = 26;
        const poolGrad = ctx.createLinearGradient(0, height - maxPoolH, 0, height);
        poolGrad.addColorStop(0, "#9e0b11");
        poolGrad.addColorStop(0.35, "#610408");
        poolGrad.addColorStop(1, "#1f0102");

        ctx.fillStyle = poolGrad;
        ctx.shadowColor = "rgba(120, 5, 10, 0.7)";
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 4) {
          const h = getSurfaceHeightAt(x);
          const microWave = h > 1 ? Math.sin(x * 0.04 + bloodFrame * 0.05) * 0.45 : 0;
          ctx.lineTo(x, height - h + microWave);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 155, 155, 0.28)";
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        let penDown = false;
        for (let x = 0; x <= width; x += 4) {
          const h = getSurfaceHeightAt(x);
          if (h > 1.8) {
            const microWave = Math.sin(x * 0.04 + bloodFrame * 0.05) * 0.45;
            const y = height - h + microWave + 1.2;
            if (!penDown) {
              ctx.moveTo(x, y);
              penDown = true;
            } else {
              ctx.lineTo(x, y);
            }
          } else {
            penDown = false;
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // 3. تحديث القطرات المتساقطة وإحداث طرطشة واقعية عند الارتطام
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += 0.17;
        d.y += d.vy;
        d.trail.push({ x: d.x, y: d.y, r: d.radius });
        if (d.trail.length > 8) d.trail.shift();

        ctx.save();
        d.trail.forEach((pt, idx) => {
          const ratio = (idx + 1) / d.trail.length;
          ctx.fillStyle = `rgba(145, 10, 15, ${ratio * 0.88})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.r * (0.4 + ratio * 0.6), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        const targetStream = streams[d.streamIdx];
        const impactY = height - (targetStream?.puddleDepth || 0) * 0.6;

        if (d.y >= impactY) {
          if (targetStream) {
            targetStream.puddleSpread = Math.min(145, targetStream.puddleSpread + 2.8);
            targetStream.puddleDepth = Math.min(22, targetStream.puddleDepth + 0.45);
          }
          for (let k = 0; k < 4; k++) {
            const angle = -Math.PI * (0.15 + Math.random() * 0.7);
            const spd = 1.2 + Math.random() * 2.2;
            splatters.push({
              x: d.x + (Math.random() - 0.5) * 6,
              y: impactY - 1,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              radius: 1.2 + Math.random() * 1.4,
              life: 1,
            });
          }
          drops.splice(i, 1);
        }
      }

      // 4. رسم نقاط الطرطشة الصغيرة
      for (let i = splatters.length - 1; i >= 0; i--) {
        const sp = splatters[i];
        sp.vy += 0.18;
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= 0.035;

        if (sp.life <= 0 || sp.y > height) {
          splatters.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = `rgba(175, 14, 20, ${sp.life})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [logoReady]);

  const handleDiscordLogin = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          scopes: "identify email guilds guilds.members.read",
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ أثناء الاتصال بالديسكورد");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030203] text-[#f7f3eb] relative overflow-hidden flex items-center justify-center px-4 select-none">
      {/* خلفية الشبكة التكتيكية */}
      <div className="fixed inset-0 anarchy-grid-bg pointer-events-none z-0 opacity-50" />

      {/* توهج مركزي خلف اللوجو */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.15, 0.28, 0.16] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[620px] bg-red-800/25 rounded-full blur-[170px] pointer-events-none z-0"
      />

      {/* شريط الحالة الحي في أعلى الشاشة (Live Status Ticker) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-30"
      >
        <div className="px-4 py-1.5 rounded-full bg-[#0b0506]/85 backdrop-blur-xl border border-red-600/35 shadow-[0_0_25px_rgba(220,38,38,0.25)] flex items-center gap-2.5 text-[10px] sm:text-[11px] font-black tracking-[0.2em] text-zinc-300 uppercase whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>GATEWAY ONLINE</span>
          <span className="text-red-500">•</span>
          <span className="text-red-400">KAYAN CFW</span>
          <span className="text-red-500">•</span>
          <span className="hidden sm:inline text-zinc-400">ANARCHY SYNDICATE</span>
        </div>
      </motion.div>

      {/* Canvas المحاكاة الفيزيائية للدم والرماد والجمر */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* الحاوية المركزية */}
      <div className="w-full max-w-md relative z-20 flex flex-col items-center justify-center pt-6">
        {/* 1. لوجو ANARCHY الكامل بأضلاعه الثلاثة */}
        <motion.div
          initial={{ scale: 0.25, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          onAnimationComplete={() => setLogoReady(true)}
          className="flex flex-col items-center mb-7"
        >
          <svg
            ref={logoSvgRef}
            viewBox="0 0 120 120"
            className="w-32 h-32 sm:w-40 sm:h-40 overflow-visible drop-shadow-[0_0_28px_rgba(220,38,38,0.85)]"
          >
            <defs>
              <linearGradient
                id="anarchySlash"
                gradientUnits="userSpaceOnUse"
                x1="60"
                y1="10"
                x2="60"
                y2="108"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="42%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>
            </defs>

            <motion.path
              d="M60 12 L24 104"
              stroke="url(#anarchySlash)"
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            />
            <motion.path
              d="M60 12 L96 104"
              stroke="url(#anarchySlash)"
              strokeWidth="7.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.18, ease: "easeOut" }}
            />
            <motion.path
              d="M14 69 L106 69"
              stroke="url(#anarchySlash)"
              strokeWidth="7"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            />
          </svg>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.55 }}
            className="text-center mt-3"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/40 text-[10px] font-black tracking-[0.28em] text-red-400 uppercase mb-2">
              <Flame className="w-3 h-3 text-red-500 animate-pulse" />
              <span>BLOOD & LOYALTY</span>
            </div>
            <motion.h1
              initial={{ letterSpacing: "0.4em", opacity: 0 }}
              animate={{ letterSpacing: "0.16em", opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.75, ease: "easeOut" }}
              className="text-4xl sm:text-5xl font-black text-white uppercase drop-shadow-[0_4px_24px_rgba(185,28,28,0.8)]"
            >
              ANARCHY
            </motion.h1>
          </motion.div>
        </motion.div>

        {/* 2. كارت تسجيل الدخول الزجاجي */}
        <motion.div
          dir="rtl"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full relative z-30 rounded-[32px] p-7 sm:p-8 bg-[#090405]/88 backdrop-blur-2xl border border-red-700/40 shadow-[0_28px_75px_rgba(0,0,0,0.96),0_0_45px_rgba(153,27,27,0.22)] text-center"
        >
          <p className="text-xs sm:text-sm text-zinc-300 font-bold leading-relaxed mb-6">
            بوابة الدخول الرسمية لعيلة{" "}
            <span className="text-red-500 font-black">ANARCHY</span> — سجّل دخولك عبر ديسكورد للتحقق التلقائي من رتبتك أو لتقديم طلب انضمام
          </p>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDiscordLogin}
            disabled={loading}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(88,101,242,0.45)] border border-indigo-300/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
                <span className="text-sm sm:text-base tracking-wide">
                  تسجيل الدخول عبر Discord
                </span>
              </>
            )}
          </motion.button>

          <div className="mt-5 pt-4 border-t border-red-900/35 flex items-center justify-between text-[10px] font-bold text-zinc-500">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-red-500" />
              <span>ANARCHY SECURE GATE</span>
            </span>
            <span className="text-red-500">DISCORD ROLE VERIFICATION</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}