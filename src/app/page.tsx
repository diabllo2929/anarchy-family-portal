"use client";

import { useEffect, useState, useCallback, MouseEvent, useMemo } from "react";
import {
  createClient,
  Member,
  MemberWarn,
  FamilySetting,
  WeeklyTask,
  TaskSubmission,
  WeaponLog,
  GalleryPhoto,
  Application,
} from "../lib/supabase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Trophy,
  CheckSquare,
  Image as ImageIcon,
  UserPlus,
  Settings,
  LogOut,
  Crown,
  Trash2,
  CheckCircle2,
  XCircle,
  Crosshair,
  ArrowUpRight,
  ArrowDownLeft,
  Flame,
  Shield,
  Tv,
  BookOpen,
  Scale,
  AlertTriangle,
  Upload,
  Plus,
  Minus,
  Loader2,
  UserCheck,
  Scissors,
  ChevronLeft,
  ChevronDown,
  Menu,
  ImagePlus,
  Sparkles,
  FileText,
  Pencil,
  Check,
  X,
  MessageSquareWarning,
  Copy,
  ExternalLink,
  Megaphone,
  IdCard,
  Vault,
  Video,
  Search,
  Play,
  Package,
  Lock,
} from "lucide-react";
import AnarchyAnimatedLogo from "../components/AnarchyAnimatedLogo";

/* =========================================================================
   إعدادات الزرار العايم (بيانات سيرفر العيلة وحساب الدعم)
   ========================================================================= */
const FAMILY_DISCORD_INVITE = "https://discord.gg/WdwJRJFJF7";
const SUPPORT_DISCORD_TAG = "ysaid";
const SUPPORT_DISCORD_USER_ID = "1190354045387428000";

type TabType =
  | "home"
  | "roster"
  | "gallery"
  | "streamers"
  | "about"
  | "rules"
  | "apply"
  | "leaderboard"
  | "tasks"
  | "vault"
  | "weapons"
  | "admin";

type AdminSubTab =
  | "members"
  | "apps"
  | "armory"
  | "vault"
  | "tasks"
  | "announce"
  | "content";

interface VaultItem {
  id: string;
  item_name: string;
  category: "weapon" | "resource" | "ammo_armor" | "other";
  quantity: number;
  notes?: string | null;
  image_url?: string | null;
  updated_by?: string | null;
  updated_at?: string;
}

/* قائمة التشانلز المتاحة لإرسال الـ Announcement */
const ANNOUNCEMENT_CHANNELS = [
  {
    id: "gang_ann",
    label: "Gang Announcement",
    badge: "Gang Ann",
  },
  {
    id: "server_ann",
    label: "Announcement كل السيرفر",
    badge: "Server Ann",
  },
  {
    id: "family_chat",
    label: "شات العيلة",
    badge: "شات العيلة",
  },
  {
    id: "admin_chat",
    label: "شات الأدمن",
    badge: "شات الأدمن",
  },
  {
    id: "task_system",
    label: "التاسك سيستم",
    badge: "التاسك سيستم",
  },
];

/* القائمة الرسمية لرولات العيلة (يدعم تعدد الرولات لنفس العضو) */
const AVAILABLE_ROLES: { label: string; order: number; isAdminRole?: boolean }[] = [
  { label: "Boss", order: 1, isAdminRole: true },
  { label: "Co-Boss", order: 2, isAdminRole: true },
  { label: "Dev", order: 3, isAdminRole: true },
  { label: "Leader", order: 4, isAdminRole: true },
  { label: "Manager", order: 5, isAdminRole: true },
  { label: "Gang", order: 6 },
  { label: "Streamer", order: 7 },
  { label: "زائر", order: 99 },
];

/* إعدادات مؤشر نشاط وحالة العيلة (Syndicate Heat / Alert Level) */
type AlertModeType = "farm" | "alert" | "war";

const ALERT_MODES: Record<
  AlertModeType,
  {
    label: string;
    en: string;
    badgeBg: string;
    borderColor: string;
    glowClass: string;
    dotColor: string;
    defaultMsg: string;
  }
> = {
  farm: {
    label: "وضع التجميع والهدوء",
    en: "FARM & BUSINESS",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/50",
    borderColor: "border-emerald-500/40",
    glowClass: "shadow-[0_0_30px_rgba(16,185,129,0.2)]",
    dotColor: "bg-emerald-400",
    defaultMsg: "الوضع مستقر — التركيز على التجميع وتأمين الخزنة.",
  },
  alert: {
    label: "وضع التأهب القصوى",
    en: "HIGH ALERT",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/50",
    borderColor: "border-amber-500/45",
    glowClass: "shadow-[0_0_35px_rgba(245,158,11,0.28)]",
    dotColor: "bg-amber-400",
    defaultMsg: "جميع الأعضاء في حالة استعداد تام والتواجد في الراديو والديسكورد.",
  },
  war: {
    label: "وضع الحرب والاشتباك",
    en: "WAR MODE ACTIVE",
    badgeBg: "bg-red-600/30 text-red-200 border-red-500/70",
    borderColor: "border-red-500/70",
    glowClass: "shadow-[0_0_45px_rgba(239,68,68,0.5)]",
    dotColor: "bg-red-500",
    defaultMsg: "حالة حرب معلنة — التجهيز الكامل بالأسلحة والدروع والتجمع الفوري!",
  },
};

/* القوالب الجاهزة للإعلانات (Announcements) */
const ANNOUNCEMENT_TEMPLATES = [
  {
    name: "إعلان اجتماع مهم",
    title: "إعلان اجتماع مهم",
    mention: "@everyone",
    message:
      "يا شباب، في اجتماع مهم النهارده الساعة 10 مساءً. الاجتماع ده مهم جدًا، وهنناقش فيه أمور تخص العيلة ومستقبلها والفترة الجاية، فمطلوب من الكل الالتزام بالحضور.\nمحدش يتأخر عن الميعاد، ونتمنى من الجميع يكونوا موجودين.\nإن شاء الله اللي جاي أحسن، ونبدأ مرحلة جديدة أقوى من الأول.\n\nالكل يكون موجود في المعاد، مستنيينكم يا شباب!",
    location: "VC 1",
    time: "النهارده الساعة 10 مساءً",
  },
  {
    name: "تجمع فايت / حرب",
    title: "تجمع عاجل — حالة تأهب",
    mention: "@everyone",
    message:
      "يا رجالة مطلوب تواجد الجميع فوراً بكامل التجهيز (أسلحة + دروع + هيل) في الراديو والرومات الصوتية.\nالالتزام بالتعليمات وعدم التحرك الفردي نهائياً.",
    location: "راديو العيلة + VC 1",
    time: "الآن فوراً",
  },
  {
    name: "قالب فارغ",
    title: "",
    mention: "@everyone",
    message: "",
    location: "",
    time: "",
  },
];

/* استخراج صورة مصغرة تلقائياً من روابط YouTube إن وجدت */
function extractVideoThumbnail(url?: string | null): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (ytMatch?.[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return null;
}

/* شكل كلمة ANARCHY FAMILY المتحرك حرف بحرف مع نقط دم طبيعية عند الوقوف على الحرف */
function AnarchyHeroTitle() {
  const mainWord = "ANARCHY".split("");
  const subWord = "FAMILY".split("");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dropletsConfig = [
    { left: "18%", delay: 0.04, duration: 0.78, width: 3.5, height: 11 },
    { left: "46%", delay: 0.22, duration: 0.92, width: 4.5, height: 14 },
    { left: "72%", delay: 0.42, duration: 0.72, width: 3, height: 10 },
    { left: "86%", delay: 0.14, duration: 0.86, width: 3.5, height: 12 },
  ];

  return (
    <div
      dir="ltr"
      className="relative flex flex-col items-center justify-center select-none py-5 group mb-6"
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={`h-28 w-80 rounded-full blur-3xl transition-all duration-500 ${
            hoveredIndex !== null
              ? "bg-red-600/25 scale-115"
              : "bg-white/[0.08] group-hover:bg-white/[0.14]"
          }`}
        />
      </div>

      <motion.h1
        initial="hidden"
        animate="visible"
        onMouseLeave={() => setHoveredIndex(null)}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.1,
            },
          },
        }}
        className="relative z-10 flex items-center justify-center gap-1 sm:gap-2.5 text-5xl sm:text-7xl md:text-8xl font-black tracking-tight"
      >
        {mainWord.map((char, index) => {
          const isHovered = hoveredIndex === index;

          return (
            <motion.span
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              variants={{
                hidden: {
                  opacity: 0,
                  y: 36,
                  scale: 0.85,
                  filter: "blur(10px)",
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: {
                    type: "spring",
                    damping: 16,
                    stiffness: 180,
                  },
                },
              }}
              animate={
                isHovered
                  ? {
                      y: -9,
                      scale: 1.14,
                      rotate: index % 2 === 0 ? -2 : 2,
                      textShadow:
                        "0 0 24px rgba(220, 38, 38, 0.9), 0 0 10px rgba(255, 255, 255, 0.75)",
                      transition: { type: "spring", stiffness: 420, damping: 15 },
                    }
                  : {
                      y: 0,
                      scale: 1,
                      rotate: 0,
                      textShadow: "0 6px 24px rgba(255, 255, 255, 0.22)",
                      transition: { type: "spring", stiffness: 320, damping: 22 },
                    }
              }
              className={`relative inline-block cursor-pointer bg-clip-text text-transparent transition-all duration-200 ${
                isHovered
                  ? "bg-gradient-to-b from-white via-[#ffd6d6] to-red-500"
                  : "bg-gradient-to-b from-white via-zinc-100 to-zinc-500"
              }`}
            >
              {char}

              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isHovered ? 0 : [0, 0.85, 0],
                  textShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 22px rgba(255,255,255,0.9)",
                    "0 0 0px rgba(255,255,255,0)",
                  ],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  repeatDelay: 3.2,
                  delay: index * 0.14,
                  ease: "easeInOut",
                }}
                className="pointer-events-none absolute inset-0 text-white"
              >
                {char}
              </motion.span>

              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{
                  opacity: isHovered ? 0.55 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0 text-red-600 blur-[5px]"
              >
                {char}
              </motion.span>

              {isHovered && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 right-0 -bottom-1 h-16 overflow-visible"
                >
                  <motion.span
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: 0.9 }}
                    exit={{ scaleX: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-0 left-[12%] right-[12%] h-[2.5px] rounded-full bg-gradient-to-r from-transparent via-red-600 to-transparent"
                  />

                  {dropletsConfig.map((drop, dIdx) => (
                    <motion.span
                      key={dIdx}
                      style={{
                        left: drop.left,
                        width: `${drop.width}px`,
                        height: `${drop.height}px`,
                        borderRadius: "45% 45% 65% 65%",
                      }}
                      initial={{
                        y: -2,
                        opacity: 0,
                        scaleY: 0.4,
                        scaleX: 0.8,
                      }}
                      animate={{
                        y: [-2, 6, 44],
                        opacity: [0, 0.98, 0.92, 0],
                        scaleY: [0.4, 1.35, 0.85],
                        scaleX: [0.85, 0.72, 1.05],
                      }}
                      transition={{
                        duration: drop.duration,
                        repeat: Infinity,
                        repeatDelay: 0.18 + dIdx * 0.08,
                        delay: drop.delay,
                        ease: [0.35, 0.05, 0.85, 0.95],
                      }}
                      className="absolute top-0 bg-gradient-to-b from-[#991b1b] via-[#dc2626] to-[#7f1d1d] shadow-[0_2px_8px_rgba(185,28,28,0.85)]"
                    />
                  ))}
                </div>
              )}
            </motion.span>
          );
        })}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, duration: 0.6 }}
        className="relative z-10 mt-3 flex items-center gap-4"
      >
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.85, duration: 0.7, ease: "easeOut" }}
          className="h-[1px] w-12 sm:w-20 origin-right bg-gradient-to-l from-white/70 to-transparent"
        />

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base font-bold uppercase text-zinc-300">
          {subWord.map((char, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.8 + idx * 0.06,
                duration: 0.4,
              }}
              whileHover={{
                color: "#ffffff",
                scale: 1.25,
                textShadow: "0 0 12px rgba(255,255,255,0.9)",
              }}
              className="inline-block cursor-default tracking-[0.25em] transition-colors"
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.85, duration: 0.7, ease: "easeOut" }}
          className="h-[1px] w-12 sm:w-20 origin-left bg-gradient-to-r from-white/70 to-transparent"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.05em" }}
        animate={{ opacity: 0.75, letterSpacing: "0.18em" }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="mt-2.5 text-[11px] sm:text-xs font-medium text-zinc-400"
      >
        عائلة الأناركي • منظمة الظل
      </motion.p>
    </div>
  );
}

function SpotlightCard({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.008 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, rgba(245, 239, 230, 0.14), rgba(239, 68, 68, 0.16) 45%, transparent 75%)`,
        }}
      />
      {children}
    </motion.div>
  );
}

export default function AnarchyPortal() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [liveDiscordPerms, setLiveDiscordPerms] = useState<{ isDev: boolean; isGang: boolean }>({ isDev: false, isGang: false });

  const [members, setMembers] = useState<Member[]>([]);
  const [warns, setWarns] = useState<MemberWarn[]>([]);
  const [settingsMap, setSettingsMap] = useState<Record<string, FamilySetting>>({});
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [weaponLogs, setWeaponLogs] = useState<WeaponLog[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [onlineDiscordUsers, setOnlineDiscordUsers] = useState<
    { id: string; username: string; status: string; game: string | null }[]
  >([]);

  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>("members");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [dossierMember, setDossierMember] = useState<Member | null>(null);
  const [lockedToast, setLockedToast] = useState<string | null>(null);

  // حالة النافبار المنسدلة والموبايل
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // حالة الزرار الثابت أسفل اليمين
  const [floatingOpen, setFloatingOpen] = useState(false);
  const [copiedContact, setCopiedContact] = useState(false);

  // مؤشر حالة وتأهب العيلة
  const [alertMode, setAlertMode] = useState<AlertModeType>("farm");
  const [alertMessage, setAlertMessage] = useState(
    "الوضع مستقر — التركيز على التجميع وتأمين الخزنة."
  );
  const [savingAlert, setSavingAlert] = useState(false);

  // قسم إرسال Announcement للديسكورد (اختيار تشانل أو أكثر)
  const [annTitle, setAnnTitle] = useState(ANNOUNCEMENT_TEMPLATES[0].title);
  const [annMention, setAnnMention] = useState(ANNOUNCEMENT_TEMPLATES[0].mention);
  const [annMessage, setAnnMessage] = useState(ANNOUNCEMENT_TEMPLATES[0].message);
  const [annLocation, setAnnLocation] = useState(ANNOUNCEMENT_TEMPLATES[0].location);
  const [annTime, setAnnTime] = useState(ANNOUNCEMENT_TEMPLATES[0].time);
  const [annChannels, setAnnChannels] = useState<string[]>(["gang_ann"]);
  const [annDropdownOpen, setAnnDropdownOpen] = useState(false);
  const [sendingAnn, setSendingAnn] = useState(false);

  // صورة الخلفية الديناميكية
  const [siteBgUrl, setSiteBgUrl] = useState<string>("/bg-anarchy.jpg");
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  // التقديم
  const [applyCategory, setApplyCategory] = useState<"family" | "clippers">("family");
  const [appRealName, setAppRealName] = useState("");
  const [appIcName, setAppIcName] = useState("");
  const [appDiscord, setAppDiscord] = useState("");
  const [appHours, setAppHours] = useState("");
  const [appPrevGangs, setAppPrevGangs] = useState("");
  const [appWhy, setAppWhy] = useState("");
  const [appSubmitting, setAppSubmitting] = useState(false);

  // إضافة عضو
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberIcName, setNewMemberIcName] = useState("");
  const [newMemberRank, setNewMemberRank] = useState("Gang");

  // لوجات الخزنة (إضافة + دروب منيو شيك لاختيار العضو + تعديل)
  const [newLogType, setNewLogType] = useState<"withdraw" | "deposit">("withdraw");
  const [newLogMember, setNewLogMember] = useState("");
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [newLogWeapon, setNewLogWeapon] = useState("");
  const [newLogQty, setNewLogQty] = useState(1);
  const [newLogNotes, setNewLogNotes] = useState("");

  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogType, setEditLogType] = useState<"withdraw" | "deposit">("withdraw");
  const [editLogMember, setEditLogMember] = useState("");
  const [editLogWeapon, setEditLogWeapon] = useState("");
  const [editLogQty, setEditLogQty] = useState(1);
  const [editLogNotes, setEditLogNotes] = useState("");

  // قسم الخزنة الفعلي (موارد + أسلحة + رفع صور)
  const [vaultItemName, setVaultItemName] = useState("");
  const [vaultCategory, setVaultCategory] = useState<
    "weapon" | "resource" | "ammo_armor" | "other"
  >("weapon");
  const [vaultQty, setVaultQty] = useState(1);
  const [vaultNotes, setVaultNotes] = useState("");
  const [vaultPhotoFile, setVaultPhotoFile] = useState<File | null>(null);
  const [savingVaultItem, setSavingVaultItem] = useState(false);

  // رفع صورة أو لينك فيديو في معرض العيلة (مفتوح للعيلة ولرول Gang)
  const [mediaKind, setMediaKind] = useState<"image" | "video">("image");
  const [photoTitle, setPhotoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoThumbUrl, setVideoThumbUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // تعديل النبذة والقوانين
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [rulesTitle, setRulesTitle] = useState("");
  const [rulesContent, setRulesContent] = useState("");
  const [savingContent, setSavingContent] = useState(false);

  // التاسكات
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // تعديل عضو + Multi-Roles + Warn
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editIcName, setEditIcName] = useState("");
  const [editRolesList, setEditRolesList] = useState<string[]>(["Gang"]);
  const [editRole, setEditRole] = useState<"member" | "admin" | "super_admin">("member");
  const [editDiscordUser, setEditDiscordUser] = useState("");
  const [editKickUrl, setEditKickUrl] = useState("");
  const [editYoutubeUrl, setEditYoutubeUrl] = useState("");
  const [editTiktokUrl, setEditTiktokUrl] = useState("");
  const [editPoints, setEditPoints] = useState(0);

  const [warnMemberId, setWarnMemberId] = useState<string | null>(null);
  const [warnReason, setWarnReason] = useState("");

  const getMemberRoles = (m: Member | null): string[] => {
    if (!m) return ["زائر"];
    if (Array.isArray((m as any).roles_list) && (m as any).roles_list.length > 0) {
      return (m as any).roles_list;
    }
    return m.rank_name ? [m.rank_name] : ["زائر"];
  };

  const currentMemberRoles = getMemberRoles(currentMember);

  const isOwnerEmail = ["ysaid558855@gmail.com", "ysaid20006000@gmail.com"].includes(
    currentUserEmail.toLowerCase()
  );
  const isAdmin =
    currentMemberRoles.some((r) => ["Boss", "Co-Boss", "Dev", "Leader", "Manager"].includes(r));

  const isFamilyMember =
    isAdmin ||
    (currentMember !== null &&
      Number(currentMember.rank_order) < 90 &&
      !(currentMemberRoles.length === 1 && currentMemberRoles[0] === "زائر"));

  const canUploadGalleryMedia =
    isAdmin || isFamilyMember || currentMemberRoles.includes("Gang");

  const showLockedNotice = (tabLabel: string) => {
    setLockedToast(`قسم "${tabLabel}" مقفول 🔒 — متاح للإدارة والقيادة فقط`);
    setTimeout(() => setLockedToast(null), 3200);
  };

  const fetchDiscordPresence = useCallback(async () => {
    try {
      const res = await fetch("/api/discord-online");
      if (res.ok) {
        const json = await res.json();
        setOnlineDiscordUsers(json.onlineUsers || []);
      }
    } catch {}
  }, []);

  const sendDiscordEvent = async (payload: {
    category?: "log" | "warn";
    title: string;
    description?: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    targetDiscordId?: string | null;
    targetDiscordUsername?: string | null;
    targetIcName?: string | null;
    warnNumber?: number;
    warnReason?: string;
    expiresAt?: string;
  }) => {
    try {
      const res = await fetch("/api/discord-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          actor: currentMember?.ic_name || currentUserEmail,
        }),
      });
      return await res.json();
    } catch {
      return null;
    }
  };

  const fetchAllData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);
      setCurrentUserEmail(user.email || "");

      const nowIso = new Date().toISOString();

      const [
        { data: membersData },
        { data: warnsData },
        { data: settingsData },
        { data: tasksData },
        { data: subsData },
        { data: logsData },
        { data: photosData },
        { data: appsData },
        { data: vaultData },
      ] = await Promise.all([
        supabase.from("members").select("*").order("rank_order", { ascending: true }),
        supabase
          .from("member_warns")
          .select("*")
          .gt("expires_at", nowIso)
          .order("created_at", { ascending: true }),
        supabase.from("family_settings").select("*"),
        supabase
          .from("weekly_tasks")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("task_submissions").select("*"),
        supabase
          .from("weapon_logs")
          .select("*")
          .order("logged_at", { ascending: false })
          .limit(80),
        supabase.from("gallery_photos").select("*").order("created_at", { ascending: false }),
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("vault_items").select("*").order("updated_at", { ascending: false }),
      ]);

      const allMembers = membersData || [];
      setMembers(allMembers);
      const me =
        allMembers.find(
          (m) =>
            m.user_id === user.id ||
            m.email.toLowerCase() === (user.email || "").toLowerCase()
        ) || null;
      setCurrentMember(me);

      const dId =
        me?.discord_id ||
        user.user_metadata?.provider_id ||
        user.user_metadata?.sub ||
        "";
      const dName =
        me?.discord_username ||
        user.user_metadata?.user_name ||
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        "";

      if (dId || dName) {
        try {
          const permRes = await fetch("/api/check-discord-perms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ discordId: String(dId), username: String(dName) }),
          });
          if (permRes.ok) {
            const perms = await permRes.json();
            setLiveDiscordPerms({
              isDev: Boolean(perms.isDev),
              isGang: Boolean(perms.isGang),
            });
            setActiveTab((prev) => {
              if (["admin", "vault", "weapons"].includes(prev) && !perms.isDev) return "home";
              if (["tasks", "leaderboard"].includes(prev) && !perms.isDev && !perms.isGang) return "home";
              return prev;
            });
          }
        } catch {}
      } else {
        setLiveDiscordPerms({ isDev: false, isGang: false });
      }
      // auto-kick-unauthorized-tab
      const freshRoles = me
        ? Array.isArray((me as any).roles_list) && (me as any).roles_list.length > 0
          ? (me as any).roles_list
          : me.rank_name
          ? [me.rank_name]
          : ["زائر"]
        : ["زائر"];
      const stillAdmin = freshRoles.some((r: string) =>
        ["Boss", "Co-Boss", "Dev", "Leader", "Manager"].includes(r)
      );
      const stillFamily =
        stillAdmin ||
        freshRoles.some((r: string) => ["Gang", "Streamer"].includes(r));
      setActiveTab((prev) => {
        if (["admin", "vault", "weapons"].includes(prev) && !stillAdmin) return "home";
        if (["tasks", "leaderboard"].includes(prev) && !stillFamily) return "home";
        return prev;
      });
      if (me?.discord_username && !appDiscord) {
        setAppDiscord(me.discord_username);
      }

      setWarns(warnsData || []);

      const sMap: Record<string, FamilySetting> = {};
      (settingsData || []).forEach((s) => {
        sMap[s.key] = s;
      });
      setSettingsMap(sMap);
      setAboutTitle(sMap["about"]?.title || "من نحن — عيلة ANARCHY");
      setAboutContent(sMap["about"]?.content || "");
      setRulesTitle(sMap["rules"]?.title || "قوانين عيلة ANARCHY");
      setRulesContent(sMap["rules"]?.content || "");
      if (sMap["site_bg"]?.content) {
        setSiteBgUrl(sMap["site_bg"].content);
      }
      if (sMap["alert_level"]) {
        const savedMode = (sMap["alert_level"].title as AlertModeType) || "farm";
        const validMode = ["farm", "alert", "war"].includes(savedMode) ? savedMode : "farm";
        setAlertMode(validMode);
        setAlertMessage(
          sMap["alert_level"].content || ALERT_MODES[validMode].defaultMsg
        );
      }

      if (vaultData && vaultData.length > 0) {
        setVaultItems(vaultData as VaultItem[]);
      } else if (sMap["vault_inventory"]?.content) {
        try {
          const parsed = JSON.parse(sMap["vault_inventory"].content);
          if (Array.isArray(parsed)) setVaultItems(parsed);
        } catch {}
      }

      setTasks(tasksData || []);
      setSubmissions(subsData || []);
      setWeaponLogs(logsData || []);
      setPhotos(photosData || []);
      setApplications(appsData || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase, router, appDiscord]);

  useEffect(() => {
    fetchAllData();
    fetchDiscordPresence();
    const interval = setInterval(fetchDiscordPresence, 30000);
    return () => clearInterval(interval);
  }, [fetchAllData, fetchDiscordPresence]);

  const isMemberOnlineDiscord = (m: Member) => {
    if (!onlineDiscordUsers.length) return false;
    const uname = (m.discord_username || "").toLowerCase().trim();
    const ic = (m.ic_name || "").toLowerCase().trim();
    return onlineDiscordUsers.some(
      (u) =>
        (m.discord_id && u.id === m.discord_id) ||
        (uname && (u.username === uname || u.username.includes(uname))) ||
        (ic && u.username.includes(ic))
    );
  };

  const goToApply = (category: "family" | "clippers") => {
    setApplyCategory(category);
    setActiveTab("apply");
    setMoreMenuOpen(false);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopySupportDiscord = () => {
    navigator.clipboard.writeText(SUPPORT_DISCORD_TAG);
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 2500);
  };

  const handleApplyAnnouncementTemplate = (tpl: (typeof ANNOUNCEMENT_TEMPLATES)[0]) => {
    setAnnTitle(tpl.title);
    setAnnMention(tpl.mention);
    setAnnMessage(tpl.message);
    setAnnLocation(tpl.location);
    setAnnTime(tpl.time);
  };

  const toggleAnnChannel = (channelId: string) => {
    setAnnChannels((prev) => {
      if (prev.includes(channelId)) {
        return prev.length > 1 ? prev.filter((id) => id !== channelId) : prev;
      }
      return [...prev, channelId];
    });
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) return;
    if (annChannels.length === 0) {
      alert("اختر تشانل واحدة على الأقل للإرسال");
      return;
    }
    setSendingAnn(true);
    try {
      const res = await fetch("/api/discord-announce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle.trim(),
          mention: annMention,
          message: annMessage.trim(),
          location: annLocation.trim(),
          time: annTime.trim(),
          channels: annChannels,
          actor: currentMember?.ic_name || currentUserEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("فشل الإرسال: " + (data.error || "خطأ غير معروف"));
      } else {
        const sentNames = (data.succeeded || [])
          .map((s: any) => s.label)
          .join("\n• ");
        const failedNames = (data.failed || [])
          .map((f: any) => `${f.label} (${f.error})`)
          .join("\n• ");
        alert(
          `تم إرسال الإعلان بنجاح إلى:\n• ${sentNames}` +
            (failedNames ? `\n\nفشل في:\n• ${failedNames}` : "")
        );
      }
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setSendingAnn(false);
    }
  };

  const handleUpdateAlertLevel = async (
    newMode: AlertModeType,
    customMsg?: string
  ) => {
    setSavingAlert(true);
    const finalMsg =
      customMsg !== undefined ? customMsg : ALERT_MODES[newMode].defaultMsg;

    setAlertMode(newMode);
    setAlertMessage(finalMsg);

    await supabase.from("family_settings").upsert({
      key: "alert_level",
      title: newMode,
      content: finalMsg,
      updated_at: new Date().toISOString(),
    });

    const colorMap: Record<AlertModeType, number> = {
      farm: 0x10b981,
      alert: 0xf59e0b,
      war: 0xdc2626,
    };

    await sendDiscordEvent({
      title: `🚨 تحديث حالة التأهب لعيلة ANARCHY: ${ALERT_MODES[newMode].label}`,
      description: finalMsg,
      color: colorMap[newMode],
    });

    setSavingAlert(false);
  };

  const handleUploadBackgroundFromDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bgFile) {
      alert("اختر صورة الخلفية من جهازك أولاً");
      return;
    }
    setUploadingBg(true);
    try {
      const ext = bgFile.name.split(".").pop() || "jpg";
      const fileName = `site-bg-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("gallery")
        .upload(fileName, bgFile, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("gallery").getPublicUrl(fileName);
      const newUrl = pub.publicUrl;

      await supabase.from("family_settings").upsert({
        key: "site_bg",
        title: "خلفية الموقع",
        content: newUrl,
        updated_at: new Date().toISOString(),
      });

      setSiteBgUrl(newUrl);
      setBgFile(null);

      await sendDiscordEvent({
        title: "🖼️ تم تغيير خلفية الموقع الرسمية",
        description: "تم تحديث خلفية البوابة والصفحة الرئيسية بصورة جديدة.",
        color: 0xa855f7,
      });

      alert("تم تحديث خلفية الموقع والهوم بنجاح! 🎉");
    } catch (err: any) {
      alert("خطأ في رفع الخلفية: " + err.message);
    } finally {
      setUploadingBg(false);
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    setAppSubmitting(true);

    const tagPrefix =
      applyCategory === "clippers"
        ? "[تقديم قسم الكليبرز 🎬] "
        : "[تقديم دخول العيلة 🛡️] ";

    const { data, error } = await supabase
      .from("applications")
      .insert({
        applicant_user_id: currentUserId,
        email: currentUserEmail,
        real_name_age: appRealName,
        ic_name: appIcName,
        discord_username: appDiscord,
        fivem_hours: appHours,
        previous_gangs: appPrevGangs || null,
        why_anarchy: tagPrefix + appWhy,
      })
      .select()
      .single();

    if (error) {
      setAppSubmitting(false);
      alert("حدث خطأ أثناء إرسال الطلب: " + error.message);
      return;
    }

    try {
      await fetch("/api/discord-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: applyCategory,
          realNameAge: appRealName,
          icName: appIcName,
          discordUsername: appDiscord,
          fivemHours: appHours,
          previousGangs: appPrevGangs,
          whyAnarchy: appWhy,
          email: currentUserEmail,
        }),
      });
    } catch (discordErr) {
      console.error("Discord apply webhook error:", discordErr);
    }

    setAppSubmitting(false);
    if (data) {
      setApplications([data, ...applications]);
    }

    setAppRealName("");
    setAppIcName("");
    setAppHours("");
    setAppPrevGangs("");
    setAppWhy("");
    alert("تم إرسال طلبك بنجاح! سيظهر الآن في صفحة الأدمن وتم إرساله إلى الديسكورد.");
  };

  const handleAddDirectMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !newMemberIcName.trim()) return;
    const preset = AVAILABLE_ROLES.find((r) => r.label === newMemberRank);

    const { error } = await supabase.from("members").upsert(
      {
        email: newMemberEmail.trim().toLowerCase(),
        ic_name: newMemberIcName.trim(),
        rank_name: newMemberRank,
        rank_order: preset ? preset.order : 6,
        roles_list: [newMemberRank],
        role: preset?.isAdminRole ? "admin" : "member",
      },
      { onConflict: "email" }
    );

    if (!error) {
      await sendDiscordEvent({
        title: "🎖️ ضم عضو جديد للعيلة مباشرة",
        color: 0x10b981,
        fields: [
          { name: "العضو", value: newMemberIcName.trim(), inline: true },
          { name: "الرتبة", value: newMemberRank, inline: true },
          { name: "الإيميل", value: newMemberEmail.trim().toLowerCase(), inline: true },
        ],
      });

      setNewMemberEmail("");
      setNewMemberIcName("");
      fetchAllData();
      alert("تم ضم العضو للعيلة بنجاح!");
    }
  };

  const handleQuickPoints = async (member: Member, delta: number) => {
    const newPts = Number(member.points || 0) + delta;
    const { error } = await supabase
      .from("members")
      .update({ points: newPts })
      .eq("id", member.id);

    if (!error) {
      setMembers(
        members.map((m) => (m.id === member.id ? { ...m, points: newPts } : m))
      );
      if (dossierMember?.id === member.id) {
        setDossierMember({ ...dossierMember, points: newPts });
      }

      await sendDiscordEvent({
        title: delta > 0 ? "⬆️ إضافة نقاط لعضو" : "⬇️ خصم نقاط من عضو",
        color: delta > 0 ? 0x10b981 : 0xf59e0b,
        fields: [
          { name: "العضو", value: member.ic_name, inline: true },
          { name: "التغيير", value: `${delta > 0 ? `+${delta}` : delta} PTS`, inline: true },
          { name: "الرصيد الجديد", value: `${newPts} PTS`, inline: true },
        ],
      });
    }
  };

  const handleIssueWarn = async (member: Member) => {
    if (!warnReason.trim()) {
      alert("اكتب سبب الـ Warn أولاً");
      return;
    }

    const activeMemberWarns = warns.filter((w) => w.member_id === member.id);
    const nextWarnNumber = activeMemberWarns.length + 1;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: warnData, error: warnErr } = await supabase
      .from("member_warns")
      .insert({
        member_id: member.id,
        reason: warnReason.trim(),
        warn_number: nextWarnNumber,
        issued_by: currentMember?.ic_name || currentUserEmail,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (warnErr) {
      alert("خطأ في تسجيل الـ Warn: " + warnErr.message);
      return;
    }

    const deductedPoints = Number(member.points || 0) - 3;
    await supabase
      .from("members")
      .update({ points: deductedPoints })
      .eq("id", member.id);

    if (warnData) {
      setWarns([...warns, warnData]);
    }
    setMembers(
      members.map((m) => (m.id === member.id ? { ...m, points: deductedPoints } : m))
    );

    const discordResult = await sendDiscordEvent({
      category: "warn",
      title: `Warn #${nextWarnNumber} - ${member.ic_name}`,
      targetDiscordId: member.discord_id,
      targetDiscordUsername: member.discord_username,
      targetIcName: member.ic_name,
      warnNumber: nextWarnNumber,
      warnReason: warnReason.trim(),
      expiresAt,
    });

    setWarnMemberId(null);
    setWarnReason("");
    alert(
      `تم تسجيل Warn #${nextWarnNumber} على ${member.ic_name}!\n` +
        `• رسالة الديسكورد: ${
          discordResult?.webhookOk ? "وصلت ✓" : discordResult?.webhookError || "فشلت"
        }\n` +
        `• رول الـ Warn: ${
          discordResult?.roleApplied
            ? "تم إضافته ✓"
            : discordResult?.roleError || discordResult?.lookupDebug || "لم يُضف"
        }`
    );
  };

  const handleRemoveWarn = async (warnId: string) => {
    const targetWarn = warns.find((w) => w.id === warnId);
    const targetMember = members.find((m) => m.id === targetWarn?.member_id);

    await supabase.from("member_warns").delete().eq("id", warnId);
    setWarns(warns.filter((w) => w.id !== warnId));

    if (targetWarn) {
      await sendDiscordEvent({
        title: "🧹 إزالة تحذير (Warn Removed)",
        color: 0x3b82f6,
        fields: [
          { name: "العضو", value: targetMember?.ic_name || "عضو", inline: true },
          { name: "رقم التحذير", value: `Warn #${targetWarn.warn_number}`, inline: true },
          { name: "السبب السابق", value: targetWarn.reason, inline: false },
        ],
      });
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (
      member.id === currentMember?.id ||
      member.email.toLowerCase() === currentUserEmail.toLowerCase()
    ) {
      alert("لا يمكنك حذف حسابك الشخصي من البوابة.");
      return;
    }

    const confirmed = confirm(
      `هل أنت متأكد من حذف وطرد "${member.ic_name}" (${member.email}) نهائياً من الموقع؟\nسيتم مسح بياناته وتاسكاته وتحذيراته بالكامل.`
    );
    if (!confirmed) return;

    await Promise.all([
      supabase.from("member_warns").delete().eq("member_id", member.id),
      supabase.from("task_submissions").delete().eq("member_id", member.id),
    ]);

    const { error } = await supabase.from("members").delete().eq("id", member.id);
    if (error) {
      alert("حدث خطأ أثناء حذف العضو: " + error.message);
      return;
    }

    setMembers(members.filter((m) => m.id !== member.id));
    setWarns(warns.filter((w) => w.member_id !== member.id));
    setSubmissions(submissions.filter((s) => s.member_id !== member.id));
    if (editingMemberId === member.id) setEditingMemberId(null);
    if (warnMemberId === member.id) setWarnMemberId(null);
    if (dossierMember?.id === member.id) setDossierMember(null);

    await sendDiscordEvent({
      title: "🗑️ طرد / حذف عضو من البوابة",
      color: 0xef4444,
      fields: [
        { name: "العضو المحذوف", value: member.ic_name, inline: true },
        { name: "الرتبة السابقة", value: member.rank_name || "عضو", inline: true },
        { name: "الإيميل", value: member.email, inline: true },
      ],
    });

    alert(`تم حذف "${member.ic_name}" من البوابة بنجاح.`);
  };

  const handleAddWeaponLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogMember.trim() || !newLogWeapon.trim()) return;

    const { data, error } = await supabase
      .from("weapon_logs")
      .insert({
        member_name: newLogMember.trim(),
        action_type: newLogType,
        weapon_name: newLogWeapon.trim(),
        quantity: Number(newLogQty) || 1,
        serial_or_notes: newLogNotes.trim() || null,
        logged_by: currentMember?.ic_name || currentUserEmail,
      })
      .select()
      .single();

    if (error) {
      alert("حدث خطأ أثناء التسجيل: " + error.message);
      return;
    }
    if (data) {
      setWeaponLogs([data, ...weaponLogs]);

      await sendDiscordEvent({
        title:
          newLogType === "withdraw"
            ? "📤 سحب من الخزنة / المخزن"
            : "📥 تسليم للخزنة / المخزن",
        color: newLogType === "withdraw" ? 0xdc2626 : 0x10b981,
        fields: [
          { name: "العضو", value: newLogMember.trim(), inline: true },
          { name: "الصنف والكمية", value: `${newLogQty}x ${newLogWeapon.trim()}`, inline: true },
          { name: "ملاحظات", value: newLogNotes.trim() || "لا يوجد", inline: false },
        ],
      });

      setNewLogMember("");
      setMemberSearchQuery("");
      setNewLogWeapon("");
      setNewLogQty(1);
      setNewLogNotes("");
      alert("تم تسجيل الحركة في Logs الخزنة والسلاح والديسكورد!");
    }
  };

  const startEditingLog = (log: WeaponLog) => {
    setEditingLogId(log.id);
    setEditLogType(log.action_type);
    setEditLogMember(log.member_name);
    setEditLogWeapon(log.weapon_name);
    setEditLogQty(Number(log.quantity) || 1);
    setEditLogNotes(log.serial_or_notes || "");
  };

  const handleSaveLogEdit = async (logId: string) => {
    if (!editLogMember.trim() || !editLogWeapon.trim()) return;

    const updates = {
      action_type: editLogType,
      member_name: editLogMember.trim(),
      weapon_name: editLogWeapon.trim(),
      quantity: Number(editLogQty) || 1,
      serial_or_notes: editLogNotes.trim() || null,
    };

    const { error } = await supabase.from("weapon_logs").update(updates).eq("id", logId);
    if (error) {
      alert("خطأ في تعديل اللوج: " + error.message);
      return;
    }

    setWeaponLogs(
      weaponLogs.map((l) => (l.id === logId ? ({ ...l, ...updates } as WeaponLog) : l))
    );
    setEditingLogId(null);

    await sendDiscordEvent({
      title: "✏️ تعديل سجل في الخزنة / المخزن",
      color: 0x3b82f6,
      fields: [
        { name: "العضو", value: updates.member_name, inline: true },
        {
          name: "النوع",
          value: updates.action_type === "withdraw" ? "سحب" : "تسليم",
          inline: true,
        },
        {
          name: "الصنف والكمية",
          value: `${updates.quantity}x ${updates.weapon_name}`,
          inline: true,
        },
      ],
    });
  };

  const handleDeleteWeaponLog = async (log: WeaponLog) => {
    if (!confirm(`هل أنت متأكد من حذف سجل (${log.quantity}x ${log.weapon_name})؟`)) return;

    const { error } = await supabase.from("weapon_logs").delete().eq("id", log.id);
    if (error) {
      alert("خطأ في حذف اللوج: " + error.message);
      return;
    }

    setWeaponLogs(weaponLogs.filter((l) => l.id !== log.id));

    await sendDiscordEvent({
      title: "🗑️ حذف سجل من الخزنة / المخزن",
      color: 0xef4444,
      fields: [
        { name: "العضو", value: log.member_name, inline: true },
        {
          name: "الصنف المحذوف",
          value: `${log.quantity}x ${log.weapon_name}`,
          inline: true,
        },
      ],
    });
  };

  const persistVaultFallback = async (nextItems: VaultItem[]) => {
    await supabase.from("family_settings").upsert({
      key: "vault_inventory",
      title: "مخزون الخزنة",
      content: JSON.stringify(nextItems),
      updated_at: new Date().toISOString(),
    });
  };

  const handleAddVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultItemName.trim()) return;
    setSavingVaultItem(true);

    try {
      let uploadedImageUrl: string | null = null;
      if (vaultPhotoFile) {
        const ext = vaultPhotoFile.name.split(".").pop() || "png";
        const fileName = `vault-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gallery")
          .upload(fileName, vaultPhotoFile, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("gallery").getPublicUrl(fileName);
        uploadedImageUrl = pub.publicUrl;
      }

      const payload = {
        item_name: vaultItemName.trim(),
        category: vaultCategory,
        quantity: Number(vaultQty) || 1,
        notes: vaultNotes.trim() || null,
        image_url: uploadedImageUrl,
        updated_by: currentMember?.ic_name || currentUserEmail,
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: dbErr } = await supabase
        .from("vault_items")
        .insert(payload)
        .select()
        .single();

      const itemObj: VaultItem = inserted
        ? (inserted as VaultItem)
        : ({ id: `vault-${Date.now()}`, ...payload } as VaultItem);

      const nextList = [itemObj, ...vaultItems];
      setVaultItems(nextList);

      if (dbErr) {
        await persistVaultFallback(nextList);
      }

      await sendDiscordEvent({
        title: "🗄️ تحديث مخزون الخزنة (ANARCHY VAULT)",
        color: 0xf59e0b,
        fields: [
          { name: "الصنف / السلاح", value: payload.item_name, inline: true },
          {
            name: "النوع",
            value:
              payload.category === "weapon"
                ? "سلاح"
                : payload.category === "resource"
                ? "مورد"
                : payload.category === "ammo_armor"
                ? "ذخيرة / دروع"
                : "أخرى",
            inline: true,
          },
          { name: "الكمية", value: `${payload.quantity}`, inline: true },
          ...(payload.notes
            ? [{ name: "ملاحظات", value: payload.notes, inline: false }]
            : []),
        ],
      });

      setVaultItemName("");
      setVaultQty(1);
      setVaultNotes("");
      setVaultPhotoFile(null);
      alert("تم إضافة الصنف/السلاح وصورته إلى الخزنة بنجاح!");
    } catch (err: any) {
      alert("خطأ أثناء حفظ عنصر الخزنة: " + err.message);
    } finally {
      setSavingVaultItem(false);
    }
  };

  const handleAdjustVaultQty = async (item: VaultItem, delta: number) => {
    const nextQty = Math.max(0, Number(item.quantity || 0) + delta);
    const updatedList = vaultItems.map((v) =>
      v.id === item.id
        ? {
            ...v,
            quantity: nextQty,
            updated_by: currentMember?.ic_name || currentUserEmail,
            updated_at: new Date().toISOString(),
          }
        : v
    );
    setVaultItems(updatedList);

    const { error } = await supabase
      .from("vault_items")
      .update({
        quantity: nextQty,
        updated_by: currentMember?.ic_name || currentUserEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);

    if (error) {
      await persistVaultFallback(updatedList);
    }
  };

  const handleDeleteVaultItem = async (item: VaultItem) => {
    if (!confirm(`حذف "${item.item_name}" من الخزنة؟`)) return;
    const updatedList = vaultItems.filter((v) => v.id !== item.id);
    setVaultItems(updatedList);

    const { error } = await supabase.from("vault_items").delete().eq("id", item.id);
    if (error) {
      await persistVaultFallback(updatedList);
    }
  };

  const handleUploadPhotoFromDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUploadGalleryMedia) {
      alert("النشر في معرض العيلة متاح لأعضاء العيلة أو من يملك رول Gang");
      return;
    }

    if (mediaKind === "image" && !photoFile) {
      alert("اختر صورة من جهازك أولاً");
      return;
    }

    if (mediaKind === "video" && !videoUrl.trim()) {
      alert("ضع رابط الفيديو أولاً");
      return;
    }

    setUploadingPhoto(true);
    try {
      let finalImageUrl = "";

      if (photoFile) {
        const fileExt = photoFile.name.split(".").pop() || "png";
        const fileName = `anarchy-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("gallery")
          .upload(fileName, photoFile, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      if (mediaKind === "video") {
        const autoThumb =
          videoThumbUrl.trim() ||
          finalImageUrl ||
          extractVideoThumbnail(videoUrl.trim()) ||
          "/bg-anarchy.jpg";
        finalImageUrl = `${autoThumb}#video=${encodeURIComponent(videoUrl.trim())}`;
      }

      const { data: insertedPhoto, error: dbError } = await supabase
        .from("gallery_photos")
        .insert({
          title:
            photoTitle.trim() ||
            (mediaKind === "video" ? "فيديو من عيلة ANARCHY" : "لقطة من عيلة ANARCHY"),
          image_url: finalImageUrl,
          uploaded_by: currentMember?.ic_name || currentUserEmail,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      if (insertedPhoto) {
        setPhotos([insertedPhoto, ...photos]);

        await sendDiscordEvent({
          title:
            mediaKind === "video"
              ? "🎬 تم نشر فيديو جديد في معرض العيلة"
              : "📸 تم رفع صورة جديدة لألبوم العيلة",
          description:
            mediaKind === "video"
              ? `${photoTitle.trim() || "فيديو"} — ${videoUrl.trim()}`
              : photoTitle.trim() || "لقطة جديدة في ألبوم العيلة",
          color: mediaKind === "video" ? 0xef4444 : 0x8b5cf6,
        });

        setPhotoTitle("");
        setVideoUrl("");
        setVideoThumbUrl("");
        setPhotoFile(null);
        alert(
          mediaKind === "video"
            ? "تم نشر الفيديو بصورته والرابط المباشر في معرض العيلة! 🎬"
            : "تم رفع الصورة ونشرها في قسم صور العيلة بنجاح!"
        );
      }
    } catch (err: any) {
      alert("فشل النشر: " + err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    const target = photos.find((p) => p.id === id);
    setPhotos(photos.filter((p) => p.id !== id));
    await supabase.from("gallery_photos").delete().eq("id", id);

    await sendDiscordEvent({
      title: "🗑️ حذف عنصر من معرض العيلة",
      description: target?.title || "تم حذف عنصر من المعرض",
      color: 0xef4444,
    });
  };

  const handleSaveFamilyContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContent(true);
    await Promise.all([
      supabase.from("family_settings").upsert({
        key: "about",
        title: aboutTitle,
        content: aboutContent,
        updated_at: new Date().toISOString(),
      }),
      supabase.from("family_settings").upsert({
        key: "rules",
        title: rulesTitle,
        content: rulesContent,
        updated_at: new Date().toISOString(),
      }),
    ]);
    setSavingContent(false);

    await sendDiscordEvent({
      title: "📜 تحديث نبذة وقوانين العيلة",
      description: "تم تعديل محتوى صفحة (عن العيلة) أو (القوانين) من لوحة الإدارة.",
      color: 0xf59e0b,
    });

    fetchAllData();
    alert("تم حفظ النبذة والقوانين بنجاح!");
  };

  const handleAddWeeklyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const { data, error } = await supabase
      .from("weekly_tasks")
      .insert({
        title: newTaskTitle.trim(),
        points_reward: 0,
        is_active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setTasks([data, ...tasks]);

      await sendDiscordEvent({
        title: "📋 إضافة تاسك أسبوعي جديد",
        description: newTaskTitle.trim(),
        color: 0x06b6d4,
      });

      setNewTaskTitle("");
    }
  };

  const handleDeleteWeeklyTask = async (task: WeeklyTask) => {
    if (!confirm(`هل أنت متأكد من حذف التاسك "${task.title}" بالكامل؟`)) return;

    await supabase.from("task_submissions").delete().eq("task_id", task.id);
    const { error } = await supabase.from("weekly_tasks").delete().eq("id", task.id);

    if (error) {
      alert("حدث خطأ أثناء حذف التاسك: " + error.message);
      return;
    }

    setSubmissions(submissions.filter((s) => s.task_id !== task.id));
    setTasks(tasks.filter((t) => t.id !== task.id));

    await sendDiscordEvent({
      title: "🗑️ حذف تاسك أسبوعي",
      description: task.title,
      color: 0xef4444,
    });
  };

  const handleToggleTaskSubmission = async (task: WeeklyTask, member: Member) => {
    const existing = submissions.find(
      (s) => s.task_id === task.id && s.member_id === member.id
    );

    if (existing) {
      await supabase.from("task_submissions").delete().eq("id", existing.id);
      setSubmissions(submissions.filter((s) => s.id !== existing.id));
      const newCount = Math.max(0, (member.tasks_completed_count || 1) - 1);
      await supabase
        .from("members")
        .update({ tasks_completed_count: newCount })
        .eq("id", member.id);
      setMembers(
        members.map((m) =>
          m.id === member.id ? { ...m, tasks_completed_count: newCount } : m
        )
      );

      await sendDiscordEvent({
        title: "↩️ إزالة عضو من تسليم تاسك",
        color: 0xf59e0b,
        fields: [
          { name: "العضو", value: member.ic_name, inline: true },
          { name: "التاسك", value: task.title, inline: true },
        ],
      });
    } else {
      const { data: subData, error } = await supabase
        .from("task_submissions")
        .insert({
          task_id: task.id,
          member_id: member.id,
          verified_by: currentMember?.ic_name || currentUserEmail,
        })
        .select()
        .single();

      if (!error && subData) {
        setSubmissions([...submissions, subData]);
        const newCount = (member.tasks_completed_count || 0) + 1;
        await supabase
          .from("members")
          .update({ tasks_completed_count: newCount })
          .eq("id", member.id);
        setMembers(
          members.map((m) =>
            m.id === member.id ? { ...m, tasks_completed_count: newCount } : m
          )
        );

        await sendDiscordEvent({
          title: "✅ تأكيد تسليم تاسك أسبوعي",
          color: 0x10b981,
          fields: [
            { name: "العضو", value: member.ic_name, inline: true },
            { name: "التاسك", value: task.title, inline: true },
          ],
        });
      }
    }
  };

  const handleApplicationDecision = async (
    app: Application,
    decision: "accepted" | "rejected"
  ) => {
    await supabase
      .from("applications")
      .update({
        status: decision,
        reviewed_by: currentMember?.ic_name || currentUserEmail,
      })
      .eq("id", app.id);

    setApplications(
      applications.map((a) => (a.id === app.id ? { ...a, status: decision } : a))
    );

    if (decision === "accepted") {
      const isClipperApp = app.why_anarchy.includes("الكليبرز");
      const assignedRoles = isClipperApp ? ["Gang", "Streamer"] : ["Gang"];
      await supabase.from("members").upsert(
        {
          email: app.email.toLowerCase(),
          ic_name: app.ic_name,
          discord_username: app.discord_username,
          rank_name: "Gang",
          rank_order: 6,
          roles_list: assignedRoles,
          role: "member",
        },
        { onConflict: "email" }
      );
      fetchAllData();
    }

    await sendDiscordEvent({
      title: decision === "accepted" ? "✅ قبول متقدم جديد" : "❌ رفض طلب انضمام",
      color: decision === "accepted" ? 0x10b981 : 0xef4444,
      fields: [
        { name: "المتقدم", value: app.ic_name, inline: true },
        { name: "الديسكورد", value: app.discord_username, inline: true },
        { name: "القسم", value: app.why_anarchy.slice(0, 80), inline: false },
      ],
    });
  };

  const startEditingMember = (m: Member) => {
    setEditingMemberId(m.id);
    setEditIcName(m.ic_name);
    setEditRolesList(getMemberRoles(m));
    setEditRole(m.role);
    setEditDiscordUser(m.discord_username || "");
    setEditKickUrl(m.kick_or_twitch_url || "");
    setEditYoutubeUrl(m.youtube_url || "");
    setEditTiktokUrl(m.tiktok_url || "");
    setEditPoints(Number(m.points));
  };

  const toggleMemberRoleChip = (roleLabel: string) => {
    setEditRolesList((prev) => {
      if (roleLabel === "زائر") return ["زائر"];
      const withoutVisitor = prev.filter((r) => r !== "زائر");
      if (withoutVisitor.includes(roleLabel)) {
        const next = withoutVisitor.filter((r) => r !== roleLabel);
        return next.length > 0 ? next : ["زائر"];
      }
      return [...withoutVisitor, roleLabel];
    });
  };

  const saveMemberEdits = async (memberId: string) => {
    const finalRoles = editRolesList.length > 0 ? editRolesList : ["زائر"];
    const matchedConfigs = AVAILABLE_ROLES.filter((r) => finalRoles.includes(r.label));
    const highestConfig =
      matchedConfigs.sort((a, b) => a.order - b.order)[0] ||
      AVAILABLE_ROLES[AVAILABLE_ROLES.length - 1];

    const hasAdminRole = matchedConfigs.some((r) => r.isAdminRole);
    const computedSiteRole: "super_admin" | "admin" | "member" =
      finalRoles.includes("Dev") || finalRoles.includes("Boss")
        ? "super_admin"
        : hasAdminRole
        ? "admin"
        : editRole === "super_admin" || editRole === "admin"
        ? editRole
        : "member";

    const updates = {
      rank_name: highestConfig.label,
      rank_order: highestConfig.order,
      roles_list: finalRoles,
      role:
        finalRoles.includes("Dev") || finalRoles.includes("Boss")
          ? "super_admin"
          : hasAdminRole
          ? "admin"
          : "member",
    };

    const { error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", editingMemberId);

    if (error) {
      alert("خطأ في حفظ التعديلات: " + error.message);
      return;
    }

    const targetMemberObj = members.find((item) => item.id === editingMemberId);
    if (targetMemberObj?.discord_id) {
      await fetch("/api/sync-discord-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "push",
          discordId: targetMemberObj.discord_id,
          rolesList: finalRoles,
        }),
      });
    }
    setMembers(
      members
        .map((m) => (m.id === memberId ? ({ ...m, ...updates } as Member) : m))
        .sort((a, b) => a.rank_order - b.rank_order)
    );

    await sendDiscordEvent({
      title: "✏️ تحديث رولات وبيانات عضو",
      color: 0x3b82f6,
      fields: [
        { name: "العضو", value: editIcName, inline: true },
        { name: "الرولات الحالية", value: finalRoles.join(" + "), inline: true },
        { name: "النقاط", value: `${editPoints} PTS`, inline: true },
      ],
    });

    setEditingMemberId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const familyMembersOnly = useMemo(
    () =>
      members
        .filter((m) => {
          const rList = getMemberRoles(m);
          return m.rank_order < 90 && !(rList.length === 1 && rList[0] === "زائر");
        })
        .sort((a, b) => a.rank_order - b.rank_order),
    [members]
  );

  const filteredDropdownMembers = useMemo(() => {
    const q = memberSearchQuery.trim().toLowerCase();
    if (!q) return familyMembersOnly;
    return familyMembersOnly.filter(
      (m) =>
        m.ic_name.toLowerCase().includes(q) ||
        (m.discord_username || "").toLowerCase().includes(q) ||
        getMemberRoles(m).some((r) => r.toLowerCase().includes(q))
    );
  }, [familyMembersOnly, memberSearchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050304] flex flex-col items-center justify-center gap-5">
        <AnarchyAnimatedLogo size="lg" />
        <p className="text-xs font-black tracking-[0.28em] text-[#f5efe6] uppercase">
          ANARCHY SYNDICATE...
        </p>
      </div>
    );
  }

  const streamersList = members.filter((m) => getMemberRoles(m).includes("Streamer"));

  const sortedLeaderboard = [...familyMembersOnly].sort(
    (a, b) => Number(b.points) - Number(a.points)
  );

  const onlineCount = familyMembersOnly.filter(isMemberOnlineDiscord).length;
  const pendingAppsCount = applications.filter((a) => a.status === "pending").length;

  const navItems: {
    id: TabType;
    label: string;
    icon: any;
    familyOnly?: boolean;
    adminOnly?: boolean;
  }[] = [
    { id: "home", label: "الرئيسية", icon: Home },
    { id: "roster", label: "الأعضاء", icon: Users },
    { id: "gallery", label: "المعرض", icon: ImageIcon },
    { id: "streamers", label: "الاستريمرز", icon: Tv },
    { id: "about", label: "عن العيلة", icon: BookOpen },
    { id: "rules", label: "القوانين", icon: Scale },
    { id: "apply", label: "التقديم", icon: UserPlus },
    { id: "leaderboard", label: "الليدربورد", icon: Trophy, familyOnly: true },
    { id: "tasks", label: "التاسك", icon: CheckSquare, familyOnly: true },
    { id: "vault", label: "الخزنة", icon: Vault, adminOnly: true },
    { id: "weapons", label: "لوج السلاح", icon: Crosshair, adminOnly: true },
  ];

  const visibleNavItems = navItems
    .filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.familyOnly && !isFamilyMember) return false;
      return true;
    })
    .map((item) => ({
      ...item,
      isLocked: Boolean(item.adminOnly && !isAdmin),
    }));

  const selectedLogMemberObj = familyMembersOnly.find(
    (m) => m.ic_name.toLowerCase() === newLogMember.trim().toLowerCase()
  );

  return (
    <div dir="rtl" className="min-h-screen text-[#f5efe6] relative overflow-x-clip">
      {/* 1. الخلفية السينمائية */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,#3b070a_0%,#120406_45%,#050203_100%)]" />
      <img
        src={siteBgUrl}
        alt=""
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        className="fixed inset-0 w-full h-full object-cover object-center z-0 pointer-events-none opacity-90"
      />
      <div
        className={`fixed inset-0 z-0 pointer-events-none transition-all duration-700 ${
          alertMode === "war"
            ? "bg-gradient-to-b from-red-950/60 via-black/50 to-black/90"
            : activeTab === "home"
            ? "bg-gradient-to-b from-black/45 via-black/35 to-black/88"
            : "bg-[#070304]/80 backdrop-blur-[8px]"
        }`}
      />

      {/* تنبيه عند الضغط على تاب مقفول للأدمن */}
      <AnimatePresence>
        {lockedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#180508]/95 border border-red-500/60 text-xs font-black text-amber-200 shadow-[0_15px_40px_rgba(0,0,0,0.9)] flex items-center gap-2.5 backdrop-blur-xl"
          >
            <Lock className="w-4 h-4 text-red-400 shrink-0" />
            <span>{lockedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. الهيدر العلوي الجبار */}
      <header className="sticky top-3 z-40 max-w-[1460px] mx-auto px-3 sm:px-6 overflow-visible">
        <div className="relative rounded-full bg-gradient-to-b from-[#1e070b]/95 via-[#0e0406]/95 to-[#070203]/98 backdrop-blur-2xl border border-[#f5efe6]/20 shadow-[0_20px_55px_rgba(0,0,0,0.9),0_0_30px_rgba(220,38,38,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] px-3.5 sm:px-5 py-2 flex items-center justify-between gap-2 overflow-visible">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

          <button
            onClick={() => {
              setActiveTab("home");
              setMoreMenuOpen(false);
            }}
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group pl-1"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-red-600/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <AnarchyAnimatedLogo size="sm" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base tracking-[0.12em] text-white group-hover:text-red-400 transition-colors leading-none">
                  ANARCHY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              </div>
              <span className="text-[8px] font-black tracking-[0.26em] text-[#e6dccb]/70 uppercase block mt-0.5">
                KAYAN • SYNDICATE
              </span>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-0.5 bg-black/70 border border-white/12 rounded-full p-1 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] no-scrollbar overflow-visible">
            {visibleNavItems
              .filter((item) => item.id !== "about" && item.id !== "rules")
              .map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id && !item.isLocked;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.isLocked) {
                        showLockedNotice(item.label);
                        return;
                      }
                      setActiveTab(item.id);
                      setMoreMenuOpen(false);
                    }}
                    title={
                      item.isLocked
                        ? `${item.label} (مقفول — للإدارة فقط)`
                        : item.label
                    }
                    className={`relative px-2.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      item.isLocked
                        ? "text-zinc-400/80 hover:text-amber-300 hover:bg-red-950/30 border border-transparent hover:border-amber-500/30"
                        : active
                        ? "text-[#120809]"
                        : "text-[#f5efe6]/80 hover:text-white hover:bg-gradient-to-b hover:from-white/10 hover:to-red-950/25"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="topNavPill"
                        transition={{ type: "spring", stiffness: 440, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-b from-[#fffdf9] via-[#f5efe6] to-[#dfd0b8] shadow-[0_4px_20px_rgba(245,239,230,0.4)] border border-white"
                      />
                    )}
                    <Icon
                      className={`relative z-10 w-3.5 h-3.5 shrink-0 transition-colors ${
                        item.isLocked
                          ? "text-zinc-500"
                          : active
                          ? "text-red-600"
                          : "text-red-400"
                      }`}
                    />
                    <span className="relative z-10">{item.label}</span>
                    {item.isLocked && (
                      <Lock className="relative z-10 w-3 h-3 text-amber-400/90 shrink-0" />
                    )}
                  </button>
                );
              })}

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                className={`relative px-2.5 py-2 rounded-full text-[11px] font-black flex items-center gap-1 whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === "about" || activeTab === "rules"
                    ? "bg-gradient-to-b from-[#fffdf9] to-[#dfd0b8] text-[#120809] shadow-[0_4px_20px_rgba(245,239,230,0.4)]"
                    : "text-[#f5efe6]/80 hover:text-white hover:bg-white/[0.07]"
                }`}
              >
                <BookOpen
                  className={`w-3.5 h-3.5 shrink-0 ${
                    activeTab === "about" || activeTab === "rules"
                      ? "text-red-600"
                      : "text-red-400"
                  }`}
                />
                <span>عن العيلة</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    moreMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 mt-2.5 w-48 rounded-2xl bg-[#110507]/98 backdrop-blur-2xl border border-[#f5efe6]/20 shadow-[0_20px_50px_rgba(0,0,0,0.92)] p-1.5 space-y-1 z-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("about");
                        setMoreMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 cursor-pointer transition-all ${
                        activeTab === "about"
                          ? "bg-[#f5efe6] text-[#120809]"
                          : "text-[#f5efe6]/85 hover:bg-white/10"
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-red-500" />
                      <span>نبذة عن العيلة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("rules");
                        setMoreMenuOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2.5 cursor-pointer transition-all ${
                        activeTab === "rules"
                          ? "bg-[#f5efe6] text-[#120809]"
                          : "text-[#f5efe6]/85 hover:bg-white/10"
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5 text-red-500" />
                      <span>قوانين العيلة</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setMoreMenuOpen(false);
                }}
                className={`px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all shrink-0 ${
                  activeTab === "admin"
                    ? "btn-cream-ivory ring-2 ring-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)]"
                    : "btn-cream-crimson animate-sheen shadow-[0_6px_22px_rgba(220,38,38,0.45)]"
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">لوحة القيادة</span>
                <span className="sm:hidden">الأدمن</span>
                {pendingAppsCount > 0 && (
                  <span className="bg-black text-amber-300 border border-amber-400/40 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {pendingAppsCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => currentMember && setDossierMember(currentMember)}
              title="عرض بطاقة هويتك (Syndicate ID)"
              className="hidden xl:flex items-center gap-2 bg-black/75 hover:bg-black/95 border border-[#f5efe6]/18 hover:border-red-400/60 pl-3 pr-1.5 py-1 rounded-full cursor-pointer transition-all shrink-0"
            >
              {currentMember?.avatar_url ? (
                <img
                  src={currentMember.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover border border-red-500/70"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-red-950 border border-red-500/50 flex items-center justify-center text-[11px] font-black text-red-400">
                  {(currentMember?.ic_name || currentUserEmail).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-right leading-tight">
                <span className="text-[11px] font-black text-white block max-w-[85px] truncate">
                  {currentMember?.ic_name || currentUserEmail.split("@")[0]}
                </span>
                <span className="text-[9px] font-black text-red-400 block max-w-[95px] truncate">
                  {currentMemberRoles.join(" • ")}
                </span>
              </div>
            </button>

            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-black/65 border border-white/12 hover:border-red-500/50 text-zinc-300 hover:text-red-400 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-[#f5efe6] text-[#120809] font-black cursor-pointer shrink-0"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden mt-2.5 rounded-3xl bg-[#110507]/98 backdrop-blur-2xl border border-[#f5efe6]/20 shadow-[0_25px_60px_rgba(0,0,0,0.92)] p-4 space-y-3"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id && !item.isLocked;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.isLocked) {
                          setMobileNavOpen(false);
                          showLockedNotice(item.label);
                          return;
                        }
                        setActiveTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className={`px-3.5 py-3 rounded-2xl text-xs font-black flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        item.isLocked
                          ? "bg-black/45 border border-white/10 text-zinc-500"
                          : active
                          ? "btn-cream-ivory"
                          : "bg-black/60 border border-white/12 text-[#f5efe6]/85 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            item.isLocked
                              ? "text-zinc-500"
                              : active
                              ? "text-red-600"
                              : "text-red-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.isLocked && (
                        <Lock className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-black text-white">
                    {currentMember?.ic_name || currentUserEmail.split("@")[0]}
                  </span>
                  <span className="text-[10px] font-black text-red-400 bg-red-500/15 px-2 py-0.5 rounded-md">
                    {currentMemberRoles.join(" • ")}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-black text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =================================================================== */}
      {/* زرار الديسكورد والدعم الثابت أسفل اليمين                            */}
      {/* =================================================================== */}
      <div
        onMouseEnter={() => setFloatingOpen(true)}
        onMouseLeave={() => setFloatingOpen(false)}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-start gap-2.5"
      >
        <AnimatePresence>
          {floatingOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="w-72 anarchy-glass rounded-[26px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-[#f5efe6]/25 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black text-white">ANARCHY QUICK HUB</span>
                </div>
                <span className="text-[10px] font-bold text-red-400">بوابة التواصل</span>
              </div>

              <a
                href={FAMILY_DISCORD_INVITE}
                target="_blank"
                rel="noreferrer"
                className="w-full btn-cream-ivory py-3 px-3.5 rounded-2xl text-xs font-black flex items-center justify-between gap-2 transition-transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#5865F2] text-white flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="block text-[#120809] font-black">
                      سيرفر ديسكورد العيلة
                    </span>
                    <span className="block text-[10px] text-[#120809]/70 font-bold">
                      اضغط للدخول إلى السيرفر الرسمي
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#120809] shrink-0" />
              </a>

              <div className="p-3 rounded-2xl bg-black/70 border border-white/15 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                  <MessageSquareWarning className="w-4 h-4 text-red-400 shrink-0" />
                  <span>واجهتك مشكلة؟ تواصل معي</span>
                </div>
                <p className="text-[11px] text-[#e6dccb]/85 leading-relaxed">
                  حسابي على ديسكورد:{" "}
                  <strong dir="ltr" className="text-white font-black">
                    @{SUPPORT_DISCORD_TAG}
                  </strong>
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopySupportDiscord}
                    className="flex-1 btn-cream-crimson py-2 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedContact ? "تم نسخ اليوزر ✓" : "انسخ اليوزر"}</span>
                  </button>

                  {SUPPORT_DISCORD_USER_ID && (
                    <a
                      href={`https://discord.com/users/${SUPPORT_DISCORD_USER_ID}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-cream-ghost py-2 px-3 rounded-xl text-[11px] font-black"
                    >
                      فتح الشات
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setFloatingOpen((prev) => !prev)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          animate={{
            boxShadow: [
              "0 10px 28px rgba(220, 38, 38, 0.30)",
              "0 12px 38px rgba(239, 68, 68, 0.65)",
              "0 10px 28px rgba(220, 38, 38, 0.30)",
            ],
          }}
          transition={{
            boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="group relative overflow-hidden flex items-center gap-2.5 pl-4 pr-2.5 py-2 rounded-full bg-gradient-to-l from-[#1c070a]/95 to-[#0b0405]/95 border border-[#f5efe6]/35 hover:border-red-400 cursor-pointer backdrop-blur-xl transition-colors"
        >
          <motion.span
            aria-hidden="true"
            animate={{ x: ["-140%", "240%"] }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              repeatDelay: 1.8,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
          />

          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500" />

          <AnarchyAnimatedLogo size="sm" />
          <div className="text-right relative z-10">
            <span className="block text-[11px] font-black text-[#fbf7f0] leading-tight">
              ديسكورد & الدعم
            </span>
            <span className="block text-[9px] font-bold text-red-400">ANARCHY HUB</span>
          </div>
        </motion.button>
      </div>

      {/* 3. محتوى الصفحات */}
      <main className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
          >
            {/* ============================================================= */}
            {/* 0. صفحة HOME                                                   */}
            {/* ============================================================= */}
            {activeTab === "home" && (
              <section className="min-h-[calc(100vh-7.5rem)] flex flex-col items-center justify-center text-center px-4 py-6">
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 max-w-2xl w-full rounded-2xl bg-black/75 backdrop-blur-xl border px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 ${ALERT_MODES[alertMode].borderColor} ${ALERT_MODES[alertMode].glowClass}`}
                >
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="relative flex h-3 w-3">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${ALERT_MODES[alertMode].dotColor}`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-3 w-3 ${ALERT_MODES[alertMode].dotColor}`}
                      />
                    </span>
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border ${ALERT_MODES[alertMode].badgeBg}`}
                    >
                      {ALERT_MODES[alertMode].label}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-[#f5efe6] text-center sm:text-right flex-1">
                    {alertMessage}
                  </p>

                  <span
                    dir="ltr"
                    className="text-[9px] font-black tracking-[0.2em] text-zinc-400 uppercase shrink-0"
                  >
                    {ALERT_MODES[alertMode].en}
                  </span>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.65 }}
                  className="mb-3"
                >
                  <AnarchyAnimatedLogo size="lg" />
                </motion.div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-[#f5efe6]/25 text-[11px] font-black tracking-[0.26em] text-[#f5efe6] uppercase mb-4">
                  <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>KAYAN CFW • OFFICIAL SYNDICATE</span>
                </div>

                {/* شكل ANARCHY FAMILY المتحرك حرف بحرف مع نقط الدم عند الوقوف على الحرف */}
                <AnarchyHeroTitle />

                <p className="max-w-2xl text-sm sm:text-lg text-[#f5efe6] font-bold leading-relaxed mt-2 mb-9 drop-shadow-[0_4px_18px_rgba(0,0,0,0.95)] relative z-30">
                  القوة، الولاء، والسيطرة الكاملة في المدينة. انضم إلى صفوف عيلة{" "}
                  <span className="text-white font-black">ANARCHY</span> أو انضم لفريق{" "}
                  <span className="text-red-400 font-black">الكليبرز وصنّاع المحتوى</span> لتوثيق أقوى لحظاتنا.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full max-w-2xl relative z-30">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => goToApply("family")}
                    className="w-full sm:w-1/2 btn-cream-ivory animate-sheen py-5 px-7 rounded-[26px] flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 text-right">
                      <div className="w-12 h-12 rounded-2xl bg-[#120809] text-[#fbf7f0] flex items-center justify-center shrink-0 shadow-lg">
                        <Shield className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <span className="block text-base sm:text-lg font-black text-[#120809]">
                          قدّم على دخول العيلة
                        </span>
                        <span className="block text-[11px] font-bold text-[#120809]/75">
                          انضم لصفوف مقاتلي ANARCHY
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-[#120809] group-hover:-translate-x-1 transition-transform shrink-0" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => goToApply("clippers")}
                    className="w-full sm:w-1/2 btn-cream-crimson animate-sheen py-5 px-7 rounded-[26px] flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 text-right">
                      <div className="w-12 h-12 rounded-2xl bg-[#fbf7f0] text-[#120809] flex items-center justify-center shrink-0 shadow-lg">
                        <Scissors className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <span className="block text-base sm:text-lg font-black text-[#fbf7f0]">
                          قدّم على قسم الكليبرز
                        </span>
                        <span className="block text-[11px] font-bold text-[#fbf7f0]/85">
                          مونتاج، لقطات، وصناعة محتوى
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-[#fbf7f0] group-hover:-translate-x-1 transition-transform shrink-0" />
                  </motion.button>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 px-6 py-4 rounded-3xl anarchy-glass max-w-xl w-full relative z-30">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-white block">
                      {familyMembersOnly.length}
                    </span>
                    <span className="text-[11px] font-bold text-[#e6dccb]/80">أعضاء العيلة</span>
                  </div>
                  <div className="border-x border-white/15">
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 block">
                      {onlineCount}
                    </span>
                    <span className="text-[11px] font-bold text-[#e6dccb]/80">أونلاين الآن</span>
                  </div>
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-red-400 block">
                      {photos.length}
                    </span>
                    <span className="text-[11px] font-bold text-[#e6dccb]/80">لقطة موثقة</span>
                  </div>
                </div>
              </section>
            )}

            {/* ============================================================= */}
            {/* 1. أعضاء العيلة + زر بطاقة الهوية (Syndicate ID)              */}
            {/* ============================================================= */}
            {activeTab === "roster" && (
              <div className="space-y-6">
                <div className="anarchy-glass rounded-[34px] p-7 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div>
                    <span className="text-[11px] font-black text-red-400 tracking-[0.25em] uppercase">
                      HIERARCHY & ROSTER
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
                      قيادات وأعضاء عيلة <span className="text-red-500">ANARCHY</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#e6dccb]/80 mt-1">
                      مرتبين حسب الرتبة الرسمية، مع عرض كافة رولات كل عضو وبطاقة هويته العسكرية/الإجرامية
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-3 rounded-2xl bg-black/55 border border-white/15 text-center">
                      <span className="text-lg font-black text-emerald-400 block">
                        {onlineCount}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-300">Online Discord</span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-black/55 border border-white/15 text-center">
                      <span className="text-lg font-black text-[#f5efe6] block">
                        {familyMembersOnly.length}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-300">إجمالي الأعضاء</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {familyMembersOnly.map((member) => {
                    const memberRoles = getMemberRoles(member);
                    const isBoss =
                      member.rank_order === 1 || memberRoles.includes("Boss");
                    const isOnline = isMemberOnlineDiscord(member);
                    const activeWarns = warns.filter((w) => w.member_id === member.id);

                    return (
                      <SpotlightCard
                        key={member.id}
                        className={`rounded-[30px] p-6 ${
                          isBoss ? "boss-glass" : "anarchy-glass"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3.5">
                            <div className="relative shrink-0">
                              {member.avatar_url ? (
                                <img
                                  src={member.avatar_url}
                                  alt={member.ic_name}
                                  className={`w-14 h-14 rounded-2xl object-cover border-2 ${
                                    isBoss ? "border-amber-400" : "border-[#f5efe6]/40"
                                  }`}
                                />
                              ) : (
                                <div
                                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${
                                    isBoss
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/50"
                                      : "bg-red-950/70 border border-red-500/35 text-red-400"
                                  }`}
                                >
                                  {member.ic_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span
                                className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-[#090506] ${
                                  isOnline
                                    ? "bg-emerald-500 shadow-[0_0_10px_#10b981]"
                                    : "bg-zinc-600"
                                }`}
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-black text-base text-white">
                                  {member.ic_name}
                                </h3>
                                {isBoss && <Crown className="w-4 h-4 text-amber-400" />}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {memberRoles.map((roleBadge) => (
                                  <span
                                    key={roleBadge}
                                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg ${
                                      roleBadge === "Boss"
                                        ? "bg-amber-400 text-black"
                                        : roleBadge === "Streamer"
                                        ? "bg-[#53FC18]/20 text-[#53FC18] border border-[#53FC18]/40"
                                        : "bg-[#f5efe6] text-[#120809]"
                                    }`}
                                  >
                                    {roleBadge}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setDossierMember(member)}
                            title="عرض بطاقة الهوية (Syndicate ID)"
                            className="btn-cream-ghost px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 text-[#f5efe6] hover:border-red-400/60 cursor-pointer shrink-0"
                          >
                            <IdCard className="w-3.5 h-3.5 text-red-400" />
                            <span>ID Card</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs py-3 px-4 rounded-2xl bg-black/55 border border-white/10">
                          <span className="text-[#e6dccb]/85">
                            النقاط:{" "}
                            <strong className="text-[#f5efe6] font-black">
                              {member.points} PTS
                            </strong>
                          </span>
                          {activeWarns.length > 0 ? (
                            <span className="text-[11px] font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{activeWarns.length} Warn</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400">
                              {isOnline ? "● Online Discord" : member.discord_username || "Anarchy Member"}
                            </span>
                          )}
                        </div>
                      </SpotlightCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 2. معرض العيلة (صور + لينكات فيديوهات مع صورة ورابط مباشر)   */}
            {/* ============================================================= */}
            {activeTab === "gallery" && (
              <div className="space-y-6">
                <div className="anarchy-glass rounded-[32px] p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      معرض صور وفيديوهات <span className="text-red-500">ANARCHY</span>
                    </h2>
                    <p className="text-xs text-[#e6dccb]/80 mt-1">
                      مفتوح لأعضاء العيلة وحاملي رول <strong className="text-white">Gang</strong> لرفع الصور أو مشاركة روابط الفيديوهات بصورة ورابط مباشر
                    </p>
                  </div>
                  <span className="text-[11px] font-black px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/35 text-red-300 shrink-0">
                    {photos.length} عنصر منشور
                  </span>
                </div>

                {canUploadGalleryMedia && (
                  <form
                    onSubmit={handleUploadPhotoFromDevice}
                    className="anarchy-glass rounded-[30px] p-6 sm:p-7 space-y-4 border border-[#f5efe6]/15"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-black text-white">
                        إضافة منشور جديد في المعرض
                      </h3>
                      <div className="grid grid-cols-2 gap-1.5 bg-black/65 p-1 rounded-xl border border-white/15">
                        <button
                          type="button"
                          onClick={() => setMediaKind("image")}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                            mediaKind === "image"
                              ? "btn-cream-ivory"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-red-600" />
                          <span>رفع صورة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaKind("video")}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                            mediaKind === "video"
                              ? "btn-cream-crimson"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>لينك فيديو</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                          عنوان أو وصف المنشور
                        </label>
                        <input
                          type="text"
                          value={photoTitle}
                          onChange={(e) => setPhotoTitle(e.target.value)}
                          placeholder={
                            mediaKind === "video"
                              ? "مثال: كليب فايت العيلة في المدينة..."
                              : "اكتب تعليق أو وصف للصورة..."
                          }
                          className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                        />
                      </div>

                      {mediaKind === "video" ? (
                        <div>
                          <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                            رابط الفيديو المباشر (YouTube / TikTok / Kick / Streamable)
                          </label>
                          <input
                            type="url"
                            required
                            dir="ltr"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none text-left"
                          />
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-[#f5efe6]/30 hover:border-[#f5efe6] rounded-2xl px-4 py-3 text-center cursor-pointer bg-black/45 flex items-center justify-center gap-2 transition-all">
                          <Upload className="w-4 h-4 text-[#f5efe6] shrink-0" />
                          <span className="text-xs font-black text-white truncate">
                            {photoFile ? `تم اختيار: ${photoFile.name}` : "اختر صورة من جهازك"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>

                    {mediaKind === "video" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                            رابط صورة غلاف الفيديو (اختياري — يُستخرج تلقائياً لليوتيوب)
                          </label>
                          <input
                            type="url"
                            dir="ltr"
                            value={videoThumbUrl}
                            onChange={(e) => setVideoThumbUrl(e.target.value)}
                            placeholder="https://example.com/cover.jpg"
                            className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none text-left"
                          />
                        </div>
                        <label className="border-2 border-dashed border-white/20 hover:border-red-400 rounded-2xl px-4 py-3 text-center cursor-pointer bg-black/45 flex items-center justify-center gap-2 transition-all">
                          <ImagePlus className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="text-xs font-bold text-zinc-200 truncate">
                            {photoFile
                              ? `غلاف مرفوع: ${photoFile.name}`
                              : "أو ارفع صورة غلاف من جهازك للفيديو"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                          />
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={uploadingPhoto}
                      className="w-full sm:w-auto btn-cream-ivory px-7 py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري النشر...</span>
                        </>
                      ) : (
                        <span>
                          {mediaKind === "video"
                            ? "نشر الفيديو بصورته والرابط المباشر"
                            : "رفع ونشر الصورة في المعرض"}
                        </span>
                      )}
                    </button>
                  </form>
                )}

                {photos.length === 0 ? (
                  <div className="anarchy-glass rounded-3xl p-14 text-center text-zinc-300 text-sm">
                    لم يتم نشر صور أو فيديوهات بعد.. ابدأ بإضافة أول منشور للعيلة.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {photos.map((photo) => {
                      const videoHashIndex = photo.image_url.indexOf("#video=");
                      const isVideoItem = videoHashIndex !== -1;
                      const displayThumb = isVideoItem
                        ? photo.image_url.slice(0, videoHashIndex)
                        : photo.image_url;
                      const directVideoLink = isVideoItem
                        ? decodeURIComponent(photo.image_url.slice(videoHashIndex + 7))
                        : null;

                      const canDeleteItem =
                        isAdmin ||
                        photo.uploaded_by === (currentMember?.ic_name || currentUserEmail);

                      return (
                        <SpotlightCard
                          key={photo.id}
                          className="anarchy-glass rounded-3xl flex flex-col justify-between group"
                        >
                          <div>
                            <div
                              onClick={() => {
                                if (directVideoLink) {
                                  window.open(directVideoLink, "_blank", "noopener,noreferrer");
                                } else {
                                  setSelectedPhoto(photo);
                                }
                              }}
                              className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                            >
                              <img
                                src={displayThumb || "/bg-anarchy.jpg"}
                                alt={photo.title || "Anarchy"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {isVideoItem && (
                                <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                                  <span className="w-14 h-14 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.8)] group-hover:scale-110 transition-transform">
                                    <Play className="w-6 h-6 fill-current ml-0.5" />
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="p-4 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-sm text-white line-clamp-1">
                                  {photo.title || "Anarchy Moment"}
                                </span>
                                <span
                                  className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                                    isVideoItem
                                      ? "bg-red-500/20 text-red-300 border border-red-500/35"
                                      : "bg-[#f5efe6]/15 text-[#f5efe6]"
                                  }`}
                                >
                                  {isVideoItem ? "VIDEO" : "PHOTO"}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-400">
                                بواسطة: {photo.uploaded_by}
                              </div>
                            </div>
                          </div>

                          <div className="px-4 pb-4 flex items-center justify-between gap-2">
                            {directVideoLink ? (
                              <a
                                href={directVideoLink}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 btn-cream-crimson py-2 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>فتح رابط الفيديو المباشر</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto(photo)}
                                className="flex-1 btn-cream-ghost py-2 px-3 rounded-xl text-[11px] font-black cursor-pointer"
                              >
                                عرض الصورة كاملة
                              </button>
                            )}

                            {canDeleteItem && (
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo.id)}
                                title="حذف المنشور"
                                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </SpotlightCard>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* 3. الاستريمرز                                                  */}
            {/* ============================================================= */}
            {activeTab === "streamers" && (
              <div className="space-y-8">
                <div className="relative rounded-[36px] bg-gradient-to-l from-[#25070c]/95 via-[#120407]/95 to-[#080304]/95 border border-[#f5efe6]/20 p-7 sm:p-9 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
                  <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-red-600/20 blur-3xl" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-red-600/25 to-amber-500/20 border border-red-400/40 text-[10px] font-black tracking-[0.25em] text-[#f5efe6] uppercase mb-2.5">
                        <span className="w-2 h-2 rounded-full bg-[#53FC18] animate-ping" />
                        <span>ANARCHY BROADCAST ELITE</span>
                      </div>
                      <h2 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3">
                        <Tv className="w-8 h-8 text-red-500" />
                        <span>
                          ستريمرز وصنّاع محتوى <span className="text-red-500">ANARCHY</span>
                        </span>
                      </h2>
                      <p className="text-xs sm:text-sm text-[#e6dccb]/85 mt-1.5">
                        نخبة صنّاع المحتوى الحاصلين على رول <strong className="text-white">Streamer</strong> — ادخل مباشرة على البث أو القنوات الرسمية
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="px-5 py-3.5 rounded-2xl bg-black/70 border border-[#f5efe6]/15 text-center backdrop-blur-md">
                        <span className="text-2xl font-black text-white block">
                          {streamersList.length}
                        </span>
                        <span className="text-[10px] font-bold text-[#e6dccb]/75">Streamer Roster</span>
                      </div>
                    </div>
                  </div>
                </div>

                {streamersList.length === 0 ? (
                  <div className="anarchy-glass rounded-3xl p-16 text-center text-zinc-300 text-sm">
                    لا يوجد أعضاء برول Streamer حالياً.. يمكن للأدمن إعطاء رول Streamer لأي عضو من لوحة القيادة.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {streamersList.map((st) => {
                      const isOnline = isMemberOnlineDiscord(st);
                      const hasAnyChannel =
                        st.kick_or_twitch_url || st.youtube_url || st.tiktok_url;
                      const primaryChannel =
                        st.kick_or_twitch_url || st.youtube_url || st.tiktok_url;

                      return (
                        <motion.div
                          key={st.id}
                          whileHover={{ y: -8 }}
                          transition={{ type: "spring", stiffness: 280, damping: 22 }}
                          className="group relative rounded-[36px] bg-gradient-to-b from-[#1a060a]/95 via-[#0d0305]/98 to-black border border-[#f5efe6]/20 hover:border-red-400/60 overflow-hidden flex flex-col justify-between shadow-[0_28px_70px_rgba(0,0,0,0.92)]"
                        >
                          <div className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/80 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                          <div>
                            <div className="relative h-72 w-full bg-[#090405] overflow-hidden">
                              {st.avatar_url ? (
                                <>
                                  <img
                                    src={st.avatar_url}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-40"
                                  />
                                  <img
                                    src={st.avatar_url}
                                    alt={st.ic_name}
                                    className="relative z-10 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                  />
                                </>
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-950 via-[#190509] to-black flex items-center justify-center">
                                  <span className="text-7xl font-black text-red-500/80 select-none">
                                    {st.ic_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}

                              <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#0b0406] via-[#0b0406]/30 to-black/30" />

                              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-md border flex items-center gap-1.5 ${
                                    isOnline
                                      ? "bg-[#53FC18]/20 text-[#53FC18] border-[#53FC18]/60 shadow-[0_0_18px_rgba(83,252,24,0.45)]"
                                      : "bg-black/70 text-zinc-200 border-white/20"
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isOnline
                                        ? "bg-[#53FC18] animate-ping"
                                        : "bg-red-500"
                                    }`}
                                  />
                                  <span>{isOnline ? "LIVE / ONLINE" : "STREAMER"}</span>
                                </span>
                              </div>

                              <div className="absolute top-4 left-4 z-30 flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDossierMember(st)}
                                  className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/75 hover:bg-[#f5efe6] text-[#f5efe6] hover:text-[#120809] border border-white/20 transition-colors cursor-pointer"
                                >
                                  ID Card
                                </button>
                                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-[#fffcf7] to-[#dfd3c0] text-[#120809] shadow-lg">
                                  {st.rank_name}
                                </span>
                              </div>

                              <div className="absolute bottom-4 right-5 left-5 z-30">
                                <div className="flex items-end justify-between gap-2">
                                  <div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide drop-shadow-[0_4px_14px_rgba(0,0,0,0.95)]">
                                      {st.ic_name}
                                    </h3>
                                    {st.discord_username && (
                                      <p
                                        dir="ltr"
                                        className="text-xs font-bold text-[#e6dccb]/80 text-right mt-0.5"
                                      >
                                        @{st.discord_username}
                                      </p>
                                    )}
                                  </div>
                                  {primaryChannel && (
                                    <a
                                      href={primaryChannel}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="دخول القناة مباشرة"
                                      className="w-11 h-11 rounded-2xl bg-[#f5efe6] hover:bg-red-600 text-[#120809] hover:text-white flex items-center justify-center shadow-xl transition-colors shrink-0"
                                    >
                                      <ArrowUpRight className="w-5 h-5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="p-5 pt-4 space-y-2.5 bg-gradient-to-b from-[#0b0406] to-black/95">
                              <span className="block text-[10px] font-black tracking-[0.22em] text-[#e6dccb]/55 uppercase">
                                OFFICIAL STREAMING HUBS
                              </span>

                              {!hasAnyChannel && (
                                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 text-center text-xs text-zinc-400">
                                  لم يتم ربط روابط القنوات لهذا الاستريمر بعد
                                </div>
                              )}

                              {st.kick_or_twitch_url && (
                                <a
                                  href={st.kick_or_twitch_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/btn w-full p-3.5 rounded-2xl bg-gradient-to-l from-[#53FC18]/20 via-[#53FC18]/10 to-black/80 hover:from-[#53FC18]/35 hover:to-[#53FC18]/15 border border-[#53FC18]/45 hover:border-[#53FC18] transition-all flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-[#53FC18] text-black flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(83,252,24,0.45)] group-hover/btn:scale-105 transition-transform">
                                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                        <path d="M3 3h6v6h3V6h3V3h6v6h-3v3h-3v3h3v3h3v6h-6v-3h-3v-3H9v6H3V3z" />
                                      </svg>
                                    </div>
                                    <div className="text-right">
                                      <span className="block text-sm font-black text-white group-hover/btn:text-[#53FC18] transition-colors">
                                        KICK LIVE
                                      </span>
                                      <span className="block text-[10px] font-bold text-[#53FC18]/85">
                                        مشاهدة البث المباشر
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="w-4 h-4 text-[#53FC18]" />
                                </a>
                              )}

                              {st.youtube_url && (
                                <a
                                  href={st.youtube_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/btn w-full p-3.5 rounded-2xl bg-gradient-to-l from-[#FF0000]/22 via-[#FF0000]/10 to-black/80 hover:from-[#FF0000]/35 hover:to-[#FF0000]/15 border border-[#FF0000]/45 hover:border-[#FF0000] transition-all flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-[#FF0000] text-white flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,0,0,0.45)] group-hover/btn:scale-105 transition-transform">
                                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                      </svg>
                                    </div>
                                    <div className="text-right">
                                      <span className="block text-sm font-black text-white group-hover/btn:text-[#FF4D4D] transition-colors">
                                        YOUTUBE
                                      </span>
                                      <span className="block text-[10px] font-bold text-[#FF6B6B]">
                                        المقاطع والفيديوهات الحصرية
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="w-4 h-4 text-[#FF4D4D]" />
                                </a>
                              )}

                              {st.tiktok_url && (
                                <a
                                  href={st.tiktok_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group/btn w-full p-3.5 rounded-2xl bg-gradient-to-l from-[#00F2FE]/18 via-[#FE2C55]/12 to-black/80 hover:from-[#00F2FE]/30 hover:via-[#FE2C55]/25 border border-cyan-400/45 hover:border-[#00F2FE] transition-all flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-black border border-cyan-400/60 text-white flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(0,242,254,0.35)] group-hover/btn:scale-105 transition-transform">
                                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                      </svg>
                                    </div>
                                    <div className="text-right">
                                      <span className="block text-sm font-black text-white group-hover/btn:text-cyan-300 transition-colors">
                                        TIKTOK CLIPS
                                      </span>
                                      <span className="block text-[10px] font-bold text-cyan-300/85">
                                        أقوى الكليبات واللقطات السريعة
                                      </span>
                                    </div>
                                  </div>
                                  <ArrowUpRight className="w-4 h-4 text-cyan-300" />
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* 4. نبذة عن العيلة                                             */}
            {/* ============================================================= */}
            {activeTab === "about" && (
              <div className="anarchy-glass rounded-[34px] p-8 sm:p-10 space-y-6">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                  <AnarchyAnimatedLogo size="md" />
                  <div>
                    <span className="text-[11px] font-black text-red-400 tracking-widest uppercase">
                      ANARCHY SYNDICATE HISTORY
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                      {settingsMap["about"]?.title || "من نحن — عيلة ANARCHY"}
                    </h2>
                  </div>
                </div>

                <div className="text-sm sm:text-base text-[#f5efe6]/95 leading-loose whitespace-pre-line font-medium">
                  {settingsMap["about"]?.content ||
                    "عيلة الأناركي حالياً، الأولد سكول سابقاً، ومنظمة الظل؛ من أقدم العائلات المترسمة ومن أقوى عائلات المدينة."}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 5. قوانين العيلة                                              */}
            {/* ============================================================= */}
            {activeTab === "rules" && (
              <div className="anarchy-glass rounded-[34px] p-8 sm:p-10 space-y-6">
                <div className="flex items-center gap-3.5 border-b border-white/10 pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-red-400 tracking-widest uppercase">
                      CODE OF CONDUCT
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                      {settingsMap["rules"]?.title || "قوانين عيلة ANARCHY"}
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {(settingsMap["rules"]?.content || "")
                    .split("\n")
                    .filter((line: string) => line.trim())
                    .map((ruleLine: string, i: number) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-black/60 border border-white/15 text-sm text-[#f5efe6] font-bold leading-relaxed"
                      >
                        {ruleLine}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 6. التقديم للعيلة / الكليبرز                                   */}
            {/* ============================================================= */}
            {activeTab === "apply" && (
              <div className="max-w-2xl mx-auto anarchy-glass rounded-[34px] p-8 sm:p-10">
                <div className="flex flex-col items-center text-center mb-6">
                  <AnarchyAnimatedLogo size="md" />
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
                    بوابة التقديم الرسمية
                  </h2>
                  <p className="text-xs text-[#e6dccb]/80 mt-1">
                    اختر القسم اللي بتقدم عليه واملى بياناتك بدقة
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 rounded-2xl bg-black/65 border border-white/15">
                  <button
                    type="button"
                    onClick={() => setApplyCategory("family")}
                    className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      applyCategory === "family"
                        ? "btn-cream-ivory"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-red-600" />
                    <span>تقديم دخول العيلة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyCategory("clippers")}
                    className={`py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      applyCategory === "clippers"
                        ? "btn-cream-crimson"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Scissors className="w-4 h-4" />
                    <span>تقديم قسم الكليبرز</span>
                  </button>
                </div>

                {applications
                  .filter((a) => a.email.toLowerCase() === currentUserEmail.toLowerCase())
                  .map((myApp) => (
                    <div
                      key={myApp.id}
                      className="mb-6 p-4 rounded-2xl bg-black/65 border border-white/15 flex items-center justify-between text-xs"
                    >
                      <span>
                        حالة طلبك باسم <strong>{myApp.ic_name}</strong>:
                      </span>
                      <span
                        className={`font-black px-3 py-1 rounded-lg ${
                          myApp.status === "accepted"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : myApp.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {myApp.status === "accepted"
                          ? "تم قبولك 🎉"
                          : myApp.status === "rejected"
                          ? "مرفوض"
                          : "قيد المراجعة ⏳"}
                      </span>
                    </div>
                  ))}

                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                        اسمك الحقيقي والسن
                      </label>
                      <input
                        type="text"
                        required
                        value={appRealName}
                        onChange={(e) => setAppRealName(e.target.value)}
                        placeholder="مثال: أحمد - 20 سنة"
                        className="w-full bg-black/65 border border-white/15 focus:border-[#f5efe6] rounded-2xl px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                        {applyCategory === "clippers"
                          ? "اسمك / لقبك كـ Clipper"
                          : "اسم شخصيتك داخل اللعبة (IC Name)"}
                      </label>
                      <input
                        type="text"
                        required
                        value={appIcName}
                        onChange={(e) => setAppIcName(e.target.value)}
                        placeholder="مثال: Ghost Anarchy"
                        className="w-full bg-black/65 border border-white/15 focus:border-[#f5efe6] rounded-2xl px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                        يوزر الديسكورد (Discord Username)
                      </label>
                      <input
                        type="text"
                        required
                        value={appDiscord}
                        onChange={(e) => setAppDiscord(e.target.value)}
                        placeholder="username"
                        dir="ltr"
                        className="w-full bg-black/65 border border-white/15 focus:border-[#f5efe6] rounded-2xl px-4 py-3 text-sm text-white outline-none text-left"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                        {applyCategory === "clippers"
                          ? "برامج المونتاج اللي بتشتغل عليها"
                          : "عدد ساعاتك في FiveM"}
                      </label>
                      <input
                        type="text"
                        required
                        value={appHours}
                        onChange={(e) => setAppHours(e.target.value)}
                        placeholder={
                          applyCategory === "clippers"
                            ? "مثال: CapCut / Premiere / After Effects"
                            : "مثال: 850 ساعة"
                        }
                        className="w-full bg-black/65 border border-white/15 focus:border-[#f5efe6] rounded-2xl px-4 py-3 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                      {applyCategory === "clippers"
                        ? "لينك لأعمالك السابقة أو حسابك (TikTok / YouTube)"
                        : "العائلات السابقة وسبب الخروج منها"}
                    </label>
                    <input
                      type="text"
                      value={appPrevGangs}
                      onChange={(e) => setAppPrevGangs(e.target.value)}
                      placeholder={
                        applyCategory === "clippers"
                          ? "ضع رابط قناتك أو أمثلة لأعمالك..."
                          : "اذكر العائلات السابقة إن وجدت..."
                      }
                      className="w-full bg-black/65 border border-white/15 focus:border-[#f5efe6] rounded-2xl px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                      {applyCategory === "clippers"
                        ? "إيه اللي تقدر تقدمه لقسم الكليبرز في Anarchy؟"
                        : "ليه اخترت عيلة Anarchy وإيه اللي تقدر تقدمه للعيلة؟"}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={appWhy}
                      onChange={(e) => setAppWhy(e.target.value)}
                      placeholder="اكتب إجابتك هنا..."
                      className="w-full bg-black/65 border border-white/15 focus:border-[#f5efe6] rounded-2xl px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={appSubmitting}
                    className={`w-full py-4 rounded-2xl text-sm font-black cursor-pointer animate-sheen ${
                      applyCategory === "clippers"
                        ? "btn-cream-crimson"
                        : "btn-cream-ivory"
                    }`}
                  >
                    {appSubmitting
                      ? "جاري الإرسال..."
                      : applyCategory === "clippers"
                      ? "إرسال طلب الانضمام لقسم الكليبرز"
                      : "إرسال طلب الانضمام للعيلة"}
                  </button>
                </form>
              </div>
            )}

            {/* ============================================================= */}
            {/* 7. الليدربورد                                                 */}
            {/* ============================================================= */}
            {activeTab === "leaderboard" && isFamilyMember && (
              <div className="anarchy-glass rounded-[34px] p-7 sm:p-9">
                <div className="mb-7">
                  <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-amber-400" />
                    <span>الليدربورد وترتيب النقاط</span>
                  </h2>
                  <p className="text-xs text-[#e6dccb]/80 mt-1.5">
                    الترتيب مبني على النقاط المكتسبة — اضغط على أي عضو لفتح بطاقة هويته
                  </p>
                </div>

                <div className="space-y-3.5">
                  {sortedLeaderboard.map((member, index) => {
                    const rank = index + 1;
                    return (
                      <div
                        key={member.id}
                        className={`p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 border ${
                          rank === 1
                            ? "bg-gradient-to-l from-amber-500/25 via-red-950/30 to-black/75 border-amber-400/50"
                            : rank === 2
                            ? "bg-zinc-900/80 border-zinc-400/35"
                            : rank === 3
                            ? "bg-orange-950/40 border-orange-500/35"
                            : "bg-black/55 border-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-11 h-11 rounded-2xl font-black flex items-center justify-center text-sm shrink-0 ${
                              rank === 1
                                ? "btn-cream-ivory text-black"
                                : rank === 2
                                ? "bg-zinc-300 text-black"
                                : rank === 3
                                ? "bg-amber-700 text-white"
                                : "bg-zinc-900 text-zinc-300 border border-white/10"
                            }`}
                          >
                            #{rank}
                          </div>

                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.ic_name}
                              className="w-11 h-11 rounded-xl object-cover border border-white/20"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-red-950/70 flex items-center justify-center font-black text-red-400">
                              {member.ic_name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setDossierMember(member)}
                                className="font-black text-base text-white hover:text-red-400 transition-colors cursor-pointer"
                              >
                                {member.ic_name}
                              </button>
                              <span className="text-[10px] font-black bg-[#f5efe6] text-[#120809] px-2.5 py-0.5 rounded-lg">
                                {member.rank_name}
                              </span>
                            </div>
                            <div className="text-xs text-zinc-400 mt-1">
                              تاسكات منجزة:{" "}
                              <strong className="text-zinc-200">
                                {member.tasks_completed_count || 0}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => setDossierMember(member)}
                            className="hidden sm:flex btn-cream-ghost px-3 py-2 rounded-xl text-xs font-black items-center gap-1.5 cursor-pointer"
                          >
                            <IdCard className="w-3.5 h-3.5 text-red-400" />
                            <span>الهوية</span>
                          </button>
                          <div className="text-left">
                            <span className="text-2xl sm:text-3xl font-black text-[#f5efe6]">
                              {member.points}
                            </span>
                            <span className="block text-[10px] font-black tracking-widest text-red-400">
                              POINTS
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 8. المهمات والتاسك                                             */}
            {/* ============================================================= */}
            {activeTab === "tasks" && isFamilyMember && (
              <div className="space-y-6">
                <div className="anarchy-glass rounded-[32px] p-7">
                  <h2 className="text-2xl font-black text-white">المهمات والتاسك الأسبوعي</h2>
                  <p className="text-xs text-[#e6dccb]/80 mt-1">
                    قائمة الأعضاء الذين قاموا بتسليم تاسك الأسبوع بنجاح
                  </p>
                </div>

                {tasks.length === 0 ? (
                  <div className="anarchy-glass rounded-3xl p-14 text-center text-zinc-300 text-sm">
                    لا توجد تاسكات أسبوعية مضافة حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tasks.map((task) => {
                      const taskSubs = submissions.filter((s) => s.task_id === task.id);
                      const completedMemberIds = new Set(taskSubs.map((s) => s.member_id));

                      return (
                        <div key={task.id} className="anarchy-glass rounded-[30px] p-6 space-y-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-black bg-[#f5efe6] text-[#120809] px-3 py-1 rounded-lg">
                                {task.week_label || "Weekly Task"}
                              </span>
                              <h3 className="text-lg font-black text-white mt-2.5">{task.title}</h3>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-white/10">
                            <p className="text-xs font-bold text-[#e6dccb]/85 mb-3">
                              الأعضاء المسلمون ({completedMemberIds.size} /{" "}
                              {familyMembersOnly.length}):
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {familyMembersOnly.map((m) => {
                                const done = completedMemberIds.has(m.id);
                                return (
                                  <div
                                    key={m.id}
                                    className={`p-2.5 rounded-2xl flex items-center justify-between border ${
                                      done
                                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                                        : "bg-black/55 border-white/10 text-zinc-400"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {m.avatar_url ? (
                                        <img
                                          src={m.avatar_url}
                                          alt={m.ic_name}
                                          className="w-8 h-8 rounded-xl object-cover shrink-0"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center font-black text-xs shrink-0">
                                          {m.ic_name.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <span className="text-xs font-extrabold truncate">
                                        {m.ic_name}
                                      </span>
                                    </div>
                                    {done ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-zinc-600 shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* 8B. قسم الخزنة (تبع الأدمن فقط — مقفول للجانج ومخفي للزائر)   */}
            {/* ============================================================= */}
            {activeTab === "vault" && isAdmin && (
              <div className="space-y-6">
                <div className="anarchy-glass rounded-[34px] p-7 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-black text-red-400 tracking-[0.25em] uppercase">
                      ANARCHY ARMORY & RESOURCES • ADMIN ONLY
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black text-white mt-1 flex items-center gap-3">
                      <Vault className="w-7 h-7 text-amber-400" />
                      <span>خزنة العيلة والموارد والأسلحة</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#e6dccb]/80 mt-1">
                      سجل الموارد الموجودة، أنواع وكميات الأسلحة، وصور المخزون الفعلية (خاص بالإدارة)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-center">
                      <span className="text-lg font-black text-red-400 block">
                        {vaultItems
                          .filter((i) => i.category === "weapon")
                          .reduce((acc, i) => acc + Number(i.quantity || 0), 0)}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-300">إجمالي الأسلحة</span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-center">
                      <span className="text-lg font-black text-emerald-400 block">
                        {vaultItems.length}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-300">أصناف مسجلة</span>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={handleAddVaultItem}
                  className="anarchy-glass rounded-[30px] p-6 sm:p-7 space-y-4 border border-[#f5efe6]/15"
                >
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-400" />
                    <span>تسجيل سلاح أو مورد جديد في الخزنة</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1">
                        نوع السلاح أو اسم المورد
                      </label>
                      <input
                        type="text"
                        required
                        value={vaultItemName}
                        onChange={(e) => setVaultItemName(e.target.value)}
                        placeholder="مثال: AK-47 / Micro SMG / معادن / بلاستيك"
                        className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1">
                        التصنيف
                      </label>
                      <select
                        value={vaultCategory}
                        onChange={(e) => setVaultCategory(e.target.value as any)}
                        className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      >
                        <option value="weapon">سلاح (Weapon)</option>
                        <option value="resource">مورد (Resource)</option>
                        <option value="ammo_armor">ذخيرة / دروع</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1">
                        العدد / الكمية
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={vaultQty}
                        onChange={(e) => setVaultQty(Number(e.target.value))}
                        className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#e6dccb] mb-1">
                        تفاصيل إضافية / حالة المخزون
                      </label>
                      <input
                        type="text"
                        value={vaultNotes}
                        onChange={(e) => setVaultNotes(e.target.value)}
                        placeholder="مثال: داخل الخزنة الرئيسية — جاهز للتوزيع"
                        className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      />
                    </div>

                    <label className="border-2 border-dashed border-[#f5efe6]/25 hover:border-red-400 rounded-2xl px-4 py-3 text-center cursor-pointer bg-black/45 flex items-center justify-center gap-2 transition-all">
                      <ImagePlus className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-xs font-bold text-white truncate">
                        {vaultPhotoFile
                          ? `صورة الخزنة: ${vaultPhotoFile.name}`
                          : "ارفع صورة للسلاح أو المورد في الخزنة"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setVaultPhotoFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingVaultItem}
                    className="btn-cream-ivory px-7 py-3 rounded-xl text-xs font-black cursor-pointer"
                  >
                    {savingVaultItem ? "جاري الحفظ..." : "+ إضافة للخزنة"}
                  </button>
                </form>

                {vaultItems.length === 0 ? (
                  <div className="anarchy-glass rounded-3xl p-14 text-center text-zinc-300 text-sm">
                    لا توجد أسلحة أو موارد مسجلة في الخزنة حالياً.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vaultItems.map((item) => (
                      <SpotlightCard
                        key={item.id}
                        className="anarchy-glass rounded-[30px] overflow-hidden border border-white/15 flex flex-col justify-between"
                      >
                        <div>
                          {item.image_url && (
                            <div
                              onClick={() =>
                                setSelectedPhoto({
                                  id: item.id,
                                  title: `${item.item_name} (${item.quantity})`,
                                  image_url: item.image_url!,
                                  uploaded_by: item.updated_by || "ANARCHY VAULT",
                                  created_at: item.updated_at || new Date().toISOString(),
                                })
                              }
                              className="aspect-video bg-black overflow-hidden cursor-pointer border-b border-white/10"
                            >
                              <img
                                src={item.image_url}
                                alt={item.item_name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}

                          <div className="p-5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg ${
                                  item.category === "weapon"
                                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                    : item.category === "resource"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                }`}
                              >
                                {item.category === "weapon"
                                  ? "سلاح"
                                  : item.category === "resource"
                                  ? "مورد"
                                  : item.category === "ammo_armor"
                                  ? "ذخيرة / دروع"
                                  : "أخرى"}
                              </span>
                              <span className="text-lg font-black text-white">
                                {item.quantity}{" "}
                                <span className="text-xs text-zinc-400">قطعة</span>
                              </span>
                            </div>

                            <h3 className="text-base font-black text-white">{item.item_name}</h3>
                            {item.notes && (
                              <p className="text-xs text-[#e6dccb]/80 leading-relaxed">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-white/10">
                          <span className="text-[10px] text-zinc-400">
                            بواسطة: {item.updated_by || "الإدارة"}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustVaultQty(item, -1)}
                              className="p-1.5 rounded-lg bg-black/70 border border-white/15 text-red-400 hover:bg-red-500/20 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdjustVaultQty(item, 1)}
                              className="p-1.5 rounded-lg bg-black/70 border border-white/15 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVaultItem(item)}
                              className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/30 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </SpotlightCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================= */}
            {/* 9. Logs الخزنة والسلاح (تعديل + حذف + عرض للأدمن فقط)         */}
            {/* ============================================================= */}
            {activeTab === "weapons" && isAdmin && (
              <div className="anarchy-glass rounded-[34px] p-7 sm:p-9">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                    <Crosshair className="w-6 h-6 text-red-500" />
                    <span>Logs الخزنة والسلاح (سري للإدارة)</span>
                  </h2>
                  <p className="text-xs text-[#e6dccb]/80 mt-1">
                    سجل كامل بكل حركات السحب والتسليم في الخزنة — يمكنك تعديل أو حذف أي سجل مباشرة
                  </p>
                </div>

                <div className="space-y-3">
                  {weaponLogs.length === 0 ? (
                    <div className="text-center py-14 text-zinc-300 text-sm">
                      لا توجد حركات مسجلة في الخزنة حتى الآن.
                    </div>
                  ) : (
                    weaponLogs.map((log) => {
                      const isWithdraw = log.action_type === "withdraw";
                      const isEditing = editingLogId === log.id;

                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-2xl bg-black/60 border border-white/15 space-y-3"
                        >
                          {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs">
                              <select
                                value={editLogType}
                                onChange={(e) => setEditLogType(e.target.value as any)}
                                className="sm:col-span-2 bg-black border border-white/20 rounded-xl px-3 py-2 text-white outline-none"
                              >
                                <option value="deposit">تسليم</option>
                                <option value="withdraw">سحب</option>
                              </select>

                              <input
                                type="text"
                                value={editLogMember}
                                onChange={(e) => setEditLogMember(e.target.value)}
                                placeholder="اسم العضو"
                                className="sm:col-span-3 bg-black border border-white/20 rounded-xl px-3 py-2 text-white outline-none"
                              />

                              <input
                                type="text"
                                value={editLogWeapon}
                                onChange={(e) => setEditLogWeapon(e.target.value)}
                                placeholder="الصنف"
                                className="sm:col-span-3 bg-black border border-white/20 rounded-xl px-3 py-2 text-white outline-none"
                              />

                              <input
                                type="number"
                                min={1}
                                value={editLogQty}
                                onChange={(e) => setEditLogQty(Number(e.target.value))}
                                className="sm:col-span-1 bg-black border border-white/20 rounded-xl px-2.5 py-2 text-white outline-none text-center"
                              />

                              <input
                                type="text"
                                value={editLogNotes}
                                onChange={(e) => setEditLogNotes(e.target.value)}
                                placeholder="ملاحظات"
                                className="sm:col-span-3 bg-black border border-white/20 rounded-xl px-3 py-2 text-white outline-none"
                              />

                              <div className="sm:col-span-12 flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveLogEdit(log.id)}
                                  className="btn-cream-ivory px-4 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>حفظ التعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingLogId(null)}
                                  className="btn-cream-ghost px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>إلغاء</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3.5">
                                <div
                                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                                    isWithdraw
                                      ? "bg-red-500/20 text-red-400 border border-red-500/35"
                                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/35"
                                  }`}
                                >
                                  {isWithdraw ? (
                                    <ArrowUpRight className="w-5 h-5" />
                                  ) : (
                                    <ArrowDownLeft className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-sm text-white">
                                      {log.member_name}
                                    </span>
                                    <span
                                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md ${
                                        isWithdraw
                                          ? "bg-red-500/20 text-red-300"
                                          : "bg-emerald-500/20 text-emerald-300"
                                      }`}
                                    >
                                      {isWithdraw ? "سحب" : "تسليم"}
                                    </span>
                                    <span className="text-sm font-black text-[#f5efe6]">
                                      {log.quantity}x {log.weapon_name}
                                    </span>
                                  </div>
                                  {log.serial_or_notes && (
                                    <p className="text-xs text-zinc-300 mt-0.5">
                                      ملاحظات: {log.serial_or_notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="text-right sm:text-left text-[11px] text-zinc-400">
                                  <div>
                                    {new Date(log.logged_at).toLocaleString("ar-EG", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })}
                                  </div>
                                  <div>سجّلها: {log.logged_by}</div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => startEditingLog(log)}
                                    title="تعديل اللوج"
                                    className="btn-cream-ghost p-2 rounded-xl text-amber-300 hover:text-amber-200 cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWeaponLog(log)}
                                    title="حذف اللوج"
                                    className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* 10. داشبورد الأدمن الفخم                                      */}
            {/* ============================================================= */}
            {activeTab === "admin" && isAdmin && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="anarchy-glass rounded-[26px] p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#e6dccb]/75">أعضاء العيلة</span>
                      <span className="text-2xl font-black text-white block mt-1">
                        {familyMembersOnly.length}
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-[#f5efe6]/15 border border-[#f5efe6]/25 flex items-center justify-center text-[#f5efe6]">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="anarchy-glass rounded-[26px] p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#e6dccb]/75">طلبات معلقة</span>
                      <span className="text-2xl font-black text-amber-400 block mt-1">
                        {pendingAppsCount}
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="anarchy-glass rounded-[26px] p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#e6dccb]/75">عناصر الخزنة</span>
                      <span className="text-2xl font-black text-red-400 block mt-1">
                        {vaultItems.length}
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                      <Vault className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="anarchy-glass rounded-[26px] p-5 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#e6dccb]/75">منشورات المعرض</span>
                      <span className="text-2xl font-black text-emerald-400 block mt-1">
                        {photos.length}
                      </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <aside className="lg:col-span-3 anarchy-glass rounded-[28px] p-3 space-y-1.5">
                    {[
                      { id: "members", label: "الأعضاء والرولات والنقاط", icon: Users },
                      {
                        id: "apps",
                        label: `طلبات التقديم (${pendingAppsCount})`,
                        icon: UserPlus,
                      },
                      { id: "armory", label: "حركات لوج السلاح والخزنة", icon: Crosshair },
                      { id: "vault", label: "إدارة مخزون الخزنة", icon: Vault },
                      { id: "tasks", label: "إدارة التاسك الأسبوعي", icon: CheckSquare },
                      { id: "announce", label: "إرسال Announcement 📢", icon: Megaphone },
                      { id: "content", label: "حالة العيلة والصور والقوانين", icon: Sparkles },
                    ].map((st) => {
                      const Icon = st.icon;
                      const isSelected = adminSubTab === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => setAdminSubTab(st.id as AdminSubTab)}
                          className={`w-full px-4 py-3.5 rounded-2xl text-xs font-black flex items-center gap-3 transition-all cursor-pointer text-right ${
                            isSelected
                              ? "btn-cream-ivory"
                              : "text-[#f5efe6]/80 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-red-600" : "text-red-400"
                            }`}
                          />
                          <span>{st.label}</span>
                        </button>
                      );
                    })}
                  </aside>

                  <div className="lg:col-span-9 space-y-6">
                    {adminSubTab === "members" && (
                      <div className="space-y-6">
                        <div className="anarchy-glass rounded-[30px] p-6">
                          <h3 className="text-base font-black text-white mb-3">
                            ضم عضو جديد للعيلة مباشرة
                          </h3>
                          <form
                            onSubmit={handleAddDirectMember}
                            className="grid grid-cols-1 sm:grid-cols-4 gap-3"
                          >
                            <input
                              type="email"
                              required
                              value={newMemberEmail}
                              onChange={(e) => setNewMemberEmail(e.target.value)}
                              placeholder="إيميل الديسكورد للعضو"
                              dir="ltr"
                              className="bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none text-left"
                            />
                            <input
                              type="text"
                              required
                              value={newMemberIcName}
                              onChange={(e) => setNewMemberIcName(e.target.value)}
                              placeholder="اسم الشخصية (IC Name)"
                              className="bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                            />
                            <select
                              value={newMemberRank}
                              onChange={(e) => setNewMemberRank(e.target.value)}
                              className="bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                            >
                              {AVAILABLE_ROLES.map((r) => (
                                <option key={r.label} value={r.label}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="btn-cream-ivory py-3 rounded-xl text-xs font-black cursor-pointer"
                            >
                              + ضم العضو للعيلة
                            </button>
                          </form>
                          <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[11px] text-zinc-400">
                              لو ضفت عضو يدوي وصورته لسه مش ظاهرة، اسحب صورهم من سيرفر الديسكورد مباشرة:
                            </span>
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await fetch("/api/sync-discord-avatars", { method: "POST" });
                                const data = await res.json();
                                if (res.ok) {
                                  await fetchAllData();
                                  alert(`تم تحديث صور الديسكورد لـ (${data.updatedCount}) عضو بنجاح! 🎉`);
                                } else {
                                  alert("فشل المزامنة: " + (data.error || "تأكد من صلاحية البوت"));
                                }
                              }}
                              className="btn-cream-ghost px-4 py-2 rounded-xl text-xs font-black text-amber-300 hover:text-white cursor-pointer"
                            >
                              🔄 مزامنة صور الديسكورد من السيرفر
                            </button>
                          </div>
                        </div>

                        <div className="anarchy-glass rounded-[30px] p-6 space-y-4">
                          <h3 className="text-base font-black text-white">
                            التحكم في الأعضاء، تعدد الرولات، النقط، والتحذيرات (Warns)
                          </h3>

                          {members.map((m) => {
                            const memberWarns = warns.filter((w) => w.member_id === m.id);
                            const mRoles = getMemberRoles(m);

                            return (
                              <div
                                key={m.id}
                                className="p-4 rounded-2xl bg-black/60 border border-white/15 space-y-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    {m.avatar_url ? (
                                      <img
                                        src={m.avatar_url}
                                        alt={m.ic_name}
                                        className="w-10 h-10 rounded-xl object-cover"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-xl bg-red-950/70 flex items-center justify-center font-black text-red-400">
                                        {m.ic_name.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-black text-sm text-white flex items-center gap-1.5 flex-wrap">
                                        <span>{m.ic_name}</span>
                                        {mRoles.map((rl) => (
                                          <span
                                            key={rl}
                                            className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/35 px-2 py-0.5 rounded-md"
                                          >
                                            {rl}
                                          </span>
                                        ))}
                                      </div>
                                      <div className="text-[11px] text-zinc-400">{m.email}</div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setDossierMember(m)}
                                      className="btn-cream-ghost px-2.5 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                                    >
                                      <IdCard className="w-3.5 h-3.5 text-red-400" />
                                      <span>ID</span>
                                    </button>

                                    <div className="flex items-center gap-1 bg-black border border-white/15 rounded-xl px-2 py-1">
                                      <button
                                        onClick={() => handleQuickPoints(m, -1)}
                                        title="خصم نقطة"
                                        className="p-1 text-red-400 hover:bg-red-500/20 rounded-lg cursor-pointer"
                                      >
                                        <Minus className="w-3.5 h-3.5" />
                                      </button>
                                      <span className="text-xs font-black px-2 text-[#f5efe6]">
                                        {m.points} PTS
                                      </span>
                                      <button
                                        onClick={() => handleQuickPoints(m, 1)}
                                        title="إضافة نقطة"
                                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded-lg cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <button
                                      onClick={() =>
                                        warnMemberId === m.id
                                          ? setWarnMemberId(null)
                                          : setWarnMemberId(m.id)
                                      }
                                      className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      <span>Warn ({memberWarns.length})</span>
                                    </button>

                                    <button
                                      onClick={() =>
                                        editingMemberId === m.id
                                          ? setEditingMemberId(null)
                                          : startEditingMember(m)
                                      }
                                      className="btn-cream-ghost px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                      {editingMemberId === m.id
                                        ? "إغلاق"
                                        : "تعديل الرولات والروابط"}
                                    </button>

                                                                        {m.id !== currentMember?.id &&
                                      m.email.toLowerCase() !==
                                        currentUserEmail.toLowerCase() && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteMember(m)}
                                          title="حذف / طرد العضو من الموقع نهائياً"
                                          className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/35 border border-red-500/45 text-red-400 hover:text-red-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>حذف</span>
                                        </button>
                                      )}
</div>
                                </div>

                                {memberWarns.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {memberWarns.map((w) => (
                                      <div
                                        key={w.id}
                                        className="text-[11px] bg-amber-950/50 border border-amber-500/35 text-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-2"
                                      >
                                        <span className="font-black text-amber-400">
                                          Warn #{w.warn_number}:
                                        </span>
                                        <span>{w.reason}</span>
                                        <span className="text-zinc-400">
                                          (ينتهي{" "}
                                          {new Date(w.expires_at).toLocaleDateString("ar-EG")})
                                        </span>
                                        <button
                                          onClick={() => handleRemoveWarn(w.id)}
                                          className="text-red-400 hover:text-red-300 font-black cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {warnMemberId === m.id && (
                                  <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row gap-2.5">
                                    <input
                                      type="text"
                                      value={warnReason}
                                      onChange={(e) => setWarnReason(e.target.value)}
                                      placeholder={`سبب الـ Warn رقم #${memberWarns.length + 1} (سيخصم 3 نقط ويبعت Warn في السيرفر)...`}
                                      className="flex-1 bg-black/75 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                                    />
                                    <button
                                      onClick={() => handleIssueWarn(m)}
                                      className="btn-cream-crimson px-4 py-2 rounded-xl text-xs font-black cursor-pointer shrink-0"
                                    >
                                      تأكيد Warn (-3 نقط + Discord)
                                    </button>
                                  </div>
                                )}

                                {editingMemberId === m.id && (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                                    <div className="sm:col-span-3 bg-black/70 border border-white/15 rounded-2xl p-3.5">
                                      <label className="text-zinc-300 font-bold block mb-2">
                                        اختر الرولات للعضو (تقدر تختار أكثر من رول مع بعض):
                                      </label>
                                      <div className="flex flex-wrap gap-2">
                                        {AVAILABLE_ROLES.map((r) => {
                                          const active = editRolesList.includes(r.label);
                                          return (
                                            <button
                                              key={r.label}
                                              type="button"
                                              onClick={() => toggleMemberRoleChip(r.label)}
                                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                                                active
                                                  ? "btn-cream-ivory ring-2 ring-red-500"
                                                  : "bg-zinc-900 border border-white/15 text-zinc-400 hover:text-white"
                                              }`}
                                            >
                                              {active ? `✓ ${r.label}` : `+ ${r.label}`}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-zinc-300 block mb-1">
                                        اسم الشخصية IC
                                      </label>
                                      <input
                                        value={editIcName}
                                        onChange={(e) => setEditIcName(e.target.value)}
                                        className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-zinc-300 block mb-1">
                                        صلاحية الموقع
                                      </label>
                                      <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value as any)}
                                        className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-white"
                                      >
                                        <option value="member">Member (عضو)</option>
                                        <option value="admin">Admin (إدارة)</option>
                                        <option value="super_admin">Super Admin (قيادة)</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-zinc-300 block mb-1">
                                        النقاط الحالية
                                      </label>
                                      <input
                                        type="number"
                                        value={editPoints}
                                        onChange={(e) => setEditPoints(Number(e.target.value))}
                                        className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-white"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-zinc-300 block mb-1">رابط Kick</label>
                                      <input
                                        value={editKickUrl}
                                        onChange={(e) => setEditKickUrl(e.target.value)}
                                        placeholder="https://kick.com/..."
                                        dir="ltr"
                                        className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-white text-left"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-zinc-300 block mb-1">
                                        رابط YouTube
                                      </label>
                                      <input
                                        value={editYoutubeUrl}
                                        onChange={(e) => setEditYoutubeUrl(e.target.value)}
                                        placeholder="https://youtube.com/..."
                                        dir="ltr"
                                        className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-white text-left"
                                      />
                                    </div>

                                    <div>
                                      <label className="text-zinc-300 block mb-1">رابط TikTok</label>
                                      <input
                                        value={editTiktokUrl}
                                        onChange={(e) => setEditTiktokUrl(e.target.value)}
                                        placeholder="https://tiktok.com/@..."
                                        dir="ltr"
                                        className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-white text-left"
                                      />
                                    </div>

                                    <div className="sm:col-span-2">
                                      <label className="text-zinc-300 block mb-1">
                                        Discord Username
                                      </label>
                                      <input
                                        value={editDiscordUser}
                                        onChange={(e) => setEditDiscordUser(e.target.value)}
                                        className="w-full bg-black border border-white/15 rounded-xl px-3 py-2 text-white"
                                      />
                                    </div>

                                    <div className="flex items-end">
                                      <button
                                        onClick={() => saveMemberEdits(m.id)}
                                        className="w-full btn-cream-ivory py-2.5 rounded-xl font-black cursor-pointer"
                                      >
                                        حفظ التعديلات
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {adminSubTab === "apps" && (
                      <div className="anarchy-glass rounded-[30px] p-7 space-y-4">
                        <h3 className="text-lg font-black text-white">
                          طلبات الانضمام للعيلة والكليبرز ({applications.length})
                        </h3>
                        {applications.length === 0 ? (
                          <p className="text-xs text-zinc-300 py-8 text-center">
                            لا توجد طلبات تقديم حتى الآن.
                          </p>
                        ) : (
                          applications.map((app) => (
                            <div
                              key={app.id}
                              className="p-5 rounded-2xl bg-black/60 border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                            >
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-base text-white">
                                    {app.ic_name}
                                  </span>
                                  <span className="text-zinc-300">({app.real_name_age})</span>
                                  <span className="text-red-400 font-bold">
                                    - Discord: {app.discord_username}
                                  </span>
                                  <span className="text-amber-300 font-bold">
                                    - {app.fivem_hours}
                                  </span>
                                </div>
                                <p className="text-[#f5efe6]">
                                  <strong>التفاصيل:</strong> {app.why_anarchy}
                                </p>
                                {app.previous_gangs && (
                                  <p className="text-zinc-300">
                                    <strong>روابط / عائلات سابقة:</strong> {app.previous_gangs}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {app.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() => handleApplicationDecision(app, "accepted")}
                                      className="btn-cream-ivory px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer"
                                    >
                                      قبول ✓
                                    </button>
                                    <button
                                      onClick={() => handleApplicationDecision(app, "rejected")}
                                      className="btn-cream-crimson px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer"
                                    >
                                      رفض ✕
                                    </button>
                                  </>
                                ) : (
                                  <span
                                    className={`text-xs font-black px-3 py-1.5 rounded-xl ${
                                      app.status === "accepted"
                                        ? "bg-emerald-500/20 text-emerald-400"
                                        : "bg-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {app.status === "accepted" ? "تم القبول ✓" : "مرفوض ✕"}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {adminSubTab === "armory" && (
                      <div className="space-y-6">
                        <div className="anarchy-glass rounded-[30px] p-7">
                          <h3 className="text-lg font-black text-white mb-1">
                            تسجيل حركة في Logs الخزنة والسلاح
                          </h3>
                          <p className="text-xs text-[#e6dccb]/80 mb-5">
                            اختر العضو من القائمة المنسدلة المخصصة وسجّل السحب أو التسليم
                          </p>

                          <form onSubmit={handleAddWeaponLog} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  نوع الحركة
                                </label>
                                <select
                                  value={newLogType}
                                  onChange={(e) => setNewLogType(e.target.value as any)}
                                  className="w-full bg-black/75 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                >
                                  <option value="deposit">تسليم للخزنة (Deposit)</option>
                                  <option value="withdraw">سحب من الخزنة (Withdraw)</option>
                                </select>
                              </div>

                              <div className="relative">
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  مين العضو؟
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setMemberDropdownOpen((prev) => !prev)}
                                  className="w-full bg-black/75 hover:bg-black/90 border border-white/15 hover:border-red-400/50 rounded-xl px-4 py-3 text-xs text-white flex items-center justify-between gap-2 cursor-pointer transition-all"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {selectedLogMemberObj ? (
                                      <>
                                        {selectedLogMemberObj.avatar_url ? (
                                          <img
                                            src={selectedLogMemberObj.avatar_url}
                                            alt=""
                                            className="w-6 h-6 rounded-lg object-cover shrink-0"
                                          />
                                        ) : (
                                          <span className="w-6 h-6 rounded-lg bg-red-950 text-red-400 font-black flex items-center justify-center shrink-0">
                                            {selectedLogMemberObj.ic_name.charAt(0).toUpperCase()}
                                          </span>
                                        )}
                                        <span className="font-black text-white truncate">
                                          {selectedLogMemberObj.ic_name}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#f5efe6] text-[#120809] font-black shrink-0">
                                          {selectedLogMemberObj.rank_name}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-zinc-400">
                                        {newLogMember || "اختر عضو العيلة من القائمة..."}
                                      </span>
                                    )}
                                  </div>
                                  <ChevronDown
                                    className={`w-4 h-4 text-red-400 shrink-0 transition-transform ${
                                      memberDropdownOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>

                                <AnimatePresence>
                                  {memberDropdownOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                      transition={{ duration: 0.15 }}
                                      className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#110507]/98 backdrop-blur-2xl border border-[#f5efe6]/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2 z-40"
                                    >
                                      <div className="flex items-center gap-2 px-3 py-2 mb-1.5 rounded-xl bg-black/75 border border-white/10">
                                        <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                        <input
                                          type="text"
                                          value={memberSearchQuery}
                                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                                          placeholder="ابحث باسم العضو أو رتبته..."
                                          className="w-full bg-transparent text-xs text-white outline-none"
                                        />
                                      </div>

                                      <div className="max-h-56 overflow-y-auto space-y-1">
                                        {filteredDropdownMembers.map((m) => {
                                          const isSelected = newLogMember === m.ic_name;
                                          const online = isMemberOnlineDiscord(m);
                                          return (
                                            <button
                                              key={m.id}
                                              type="button"
                                              onClick={() => {
                                                setNewLogMember(m.ic_name);
                                                setMemberDropdownOpen(false);
                                                setMemberSearchQuery("");
                                              }}
                                              className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                                isSelected
                                                  ? "bg-red-600/25 border border-red-500/50 text-white"
                                                  : "hover:bg-white/10 text-[#f5efe6]"
                                              }`}
                                            >
                                              <div className="flex items-center gap-2.5 min-w-0">
                                                <span
                                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                                    online ? "bg-emerald-400" : "bg-zinc-600"
                                                  }`}
                                                />
                                                <span className="font-black truncate">
                                                  {m.ic_name}
                                                </span>
                                              </div>
                                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#f5efe6]/15 text-[#e6dccb] shrink-0">
                                                {m.rank_name}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  سلّم إيه أو سحب إيه؟
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={newLogWeapon}
                                  onChange={(e) => setNewLogWeapon(e.target.value)}
                                  placeholder="مثال: AK-47 / دروع / فلوس خزنة..."
                                  className="w-full bg-black/75 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  كام قطعة؟
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  required
                                  value={newLogQty}
                                  onChange={(e) => setNewLogQty(Number(e.target.value))}
                                  className="w-full bg-black/75 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                ملاحظات (اختياري)
                              </label>
                              <input
                                type="text"
                                value={newLogNotes}
                                onChange={(e) => setNewLogNotes(e.target.value)}
                                placeholder="أي تفاصيل إضافية..."
                                className="w-full bg-black/75 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full btn-cream-crimson py-3.5 rounded-xl text-xs font-black cursor-pointer"
                            >
                              تسجيل في Logs الخزنة والسلاح
                            </button>
                          </form>
                        </div>

                        <div className="anarchy-glass rounded-[30px] p-7 space-y-3">
                          <h4 className="text-base font-black text-white mb-2">
                            آخر الحركات المسجلة (تعديل / حذف)
                          </h4>
                          {weaponLogs.slice(0, 15).map((log) => (
                            <div
                              key={log.id}
                              className="p-3.5 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <span className="font-black text-white">{log.member_name}</span>{" "}
                                <span
                                  className={
                                    log.action_type === "withdraw"
                                      ? "text-red-400 font-bold"
                                      : "text-emerald-400 font-bold"
                                  }
                                >
                                  ({log.action_type === "withdraw" ? "سحب" : "تسليم"})
                                </span>{" "}
                                <span className="text-[#f5efe6] font-black">
                                  {log.quantity}x {log.weapon_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab("weapons");
                                    startEditingLog(log);
                                  }}
                                  className="btn-cream-ghost px-2.5 py-1.5 rounded-lg text-amber-300 font-bold cursor-pointer"
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWeaponLog(log)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 font-bold cursor-pointer"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {adminSubTab === "vault" && (
                      <div className="anarchy-glass rounded-[30px] p-7 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-white">
                              إدارة مخزون الخزنة والموارد والأسلحة
                            </h3>
                            <p className="text-xs text-[#e6dccb]/80 mt-1">
                              أنت الآن تملك صلاحية إضافة الأصناف ورفع الصور وتعديل الكميات من تبويب الخزنة الكامل
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("vault")}
                            className="btn-cream-ivory px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer shrink-0"
                          >
                            فتح صفحة الخزنة الكاملة
                          </button>
                        </div>
                      </div>
                    )}

                    {adminSubTab === "tasks" && (
                      <div className="anarchy-glass rounded-[30px] p-7 space-y-5">
                        <div>
                          <h3 className="text-lg font-black text-white">
                            إدارة التاسك الأسبوعي (إضافة، حذف، وتعديل المسلّمين)
                          </h3>
                          <p className="text-xs text-[#e6dccb]/75 mt-1">
                            اضغط على اسم أي عضو لتأكيد تسليمه أو إلغاء تسليمه حتى بعد الحفظ، أو احذف التاسك بالكامل
                          </p>
                        </div>

                        <form
                          onSubmit={handleAddWeeklyTask}
                          className="flex flex-col sm:flex-row gap-3"
                        >
                          <input
                            type="text"
                            required
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="عنوان تاسك الأسبوع..."
                            className="flex-1 bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                          />
                          <button
                            type="submit"
                            className="btn-cream-ivory px-6 py-3 rounded-xl text-xs font-black cursor-pointer"
                          >
                            + إضافة تاسك جديد
                          </button>
                        </form>

                        <div className="space-y-4">
                          {tasks.map((task) => {
                            const taskSubs = submissions.filter((s) => s.task_id === task.id);
                            return (
                              <div
                                key={task.id}
                                className="p-5 rounded-2xl bg-black/60 border border-white/15 space-y-3.5"
                              >
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                                  <div>
                                    <span className="font-black text-sm text-white block">
                                      {task.title}
                                    </span>
                                    <span className="text-[11px] text-emerald-400 font-bold">
                                      سلّم التاسك: {taskSubs.length} من {familyMembersOnly.length} عضو
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWeeklyTask(task)}
                                    title="حذف التاسك بالكامل"
                                    className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>حذف التاسك</span>
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {familyMembersOnly.map((m) => {
                                    const done = taskSubs.some((s) => s.member_id === m.id);
                                    return (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => handleToggleTaskSubmission(task, m)}
                                        title={
                                          done
                                            ? "اضغط لإزالة العضو من قائمة المسلّمين"
                                            : "اضغط لتأكيد تسليم العضو"
                                        }
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                                          done
                                            ? "bg-emerald-600/30 border border-emerald-500/50 text-emerald-200 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-200"
                                            : "btn-cream-ghost"
                                        }`}
                                      >
                                        <UserCheck className="w-3.5 h-3.5" />
                                        <span>
                                          {done ? `✓ ${m.ic_name} (اضغط للإزالة)` : m.ic_name}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {adminSubTab === "announce" && (
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        <div className="xl:col-span-7 anarchy-glass rounded-[30px] p-7 space-y-5">
                          <div>
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                              <Megaphone className="w-5 h-5 text-red-500" />
                              <span>إرسال إعلان رسمي لتشانلات الديسكورد</span>
                            </h3>
                            <p className="text-xs text-[#e6dccb]/80 mt-1">
                              اختر تشانل واحدة أو أكثر من القائمة المنسدلة وابعت الإعلان ليهم كلهم في نفس اللحظة
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {ANNOUNCEMENT_TEMPLATES.map((tpl) => (
                              <button
                                key={tpl.name}
                                type="button"
                                onClick={() => handleApplyAnnouncementTemplate(tpl)}
                                className="px-3.5 py-2 rounded-xl bg-black/65 hover:bg-red-500/20 border border-white/15 hover:border-red-500/50 text-xs font-black text-[#f5efe6] cursor-pointer transition-all"
                              >
                                📋 {tpl.name}
                              </button>
                            ))}
                          </div>

                          <form onSubmit={handleSendAnnouncement} className="space-y-4">
                            <div className="relative">
                              <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                إرسال إلى أي تشانل؟ (يمكن اختيار أكثر من تشانل مع بعض)
                              </label>
                              <button
                                type="button"
                                onClick={() => setAnnDropdownOpen((prev) => !prev)}
                                className="w-full bg-black/75 hover:bg-black/90 border border-white/15 hover:border-red-400/60 rounded-xl px-4 py-3 text-xs text-white flex items-center justify-between gap-2 cursor-pointer transition-all"
                              >
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                  {annChannels.map((chId) => {
                                    const chObj = ANNOUNCEMENT_CHANNELS.find(
                                      (c) => c.id === chId
                                    );
                                    return (
                                      <span
                                        key={chId}
                                        className="px-2.5 py-1 rounded-lg bg-red-600/25 border border-red-500/50 text-[#f5efe6] font-black text-[11px]"
                                      >
                                        ✓ {chObj?.label || chId}
                                      </span>
                                    );
                                  })}
                                </div>
                                <ChevronDown
                                  className={`w-4 h-4 text-red-400 shrink-0 transition-transform ${
                                    annDropdownOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              <AnimatePresence>
                                {annDropdownOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute left-0 right-0 mt-2 rounded-2xl bg-[#110507]/98 backdrop-blur-2xl border border-[#f5efe6]/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-2 space-y-1 z-40"
                                  >
                                    <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/10 text-[11px]">
                                      <span className="text-zinc-400 font-bold">
                                        حدّد التشانلز المستهدفة ({annChannels.length} مختارة)
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setAnnChannels(
                                              ANNOUNCEMENT_CHANNELS.map((c) => c.id)
                                            )
                                          }
                                          className="text-emerald-400 hover:underline font-black cursor-pointer"
                                        >
                                          تحديد الكل
                                        </button>
                                        <span className="text-zinc-600">|</span>
                                        <button
                                          type="button"
                                          onClick={() => setAnnChannels(["gang_ann"])}
                                          className="text-red-400 hover:underline font-black cursor-pointer"
                                        >
                                          إعادة ضبط
                                        </button>
                                      </div>
                                    </div>

                                    {ANNOUNCEMENT_CHANNELS.map((ch) => {
                                      const checked = annChannels.includes(ch.id);
                                      return (
                                        <button
                                          key={ch.id}
                                          type="button"
                                          onClick={() => toggleAnnChannel(ch.id)}
                                          className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                                            checked
                                              ? "bg-red-600/25 border border-red-500/50 text-white"
                                              : "hover:bg-white/10 text-[#f5efe6]/85"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <span
                                              className={`w-4 h-4 rounded-md flex items-center justify-center border text-[10px] font-black ${
                                                checked
                                                  ? "bg-[#f5efe6] border-white text-[#120809]"
                                                  : "border-white/25 bg-black/60"
                                              }`}
                                            >
                                              {checked ? "✓" : ""}
                                            </span>
                                            <span className="font-black">{ch.label}</span>
                                          </div>
                                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[#e6dccb]">
                                            {ch.badge}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  عنوان الإعلان
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={annTitle}
                                  onChange={(e) => setAnnTitle(e.target.value)}
                                  placeholder="مثال: إعلان اجتماع مهم"
                                  className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  المنشن (Mention)
                                </label>
                                <select
                                  value={annMention}
                                  onChange={(e) => setAnnMention(e.target.value)}
                                  dir="ltr"
                                  className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                >
                                  <option value="@everyone">@everyone</option>
                                  <option value="@here">@here</option>
                                  <option value="none">بدون منشن</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                نص الرسالة
                              </label>
                              <textarea
                                required
                                rows={6}
                                value={annMessage}
                                onChange={(e) => setAnnMessage(e.target.value)}
                                placeholder="اكتب تفاصيل الإعلان هنا..."
                                className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white leading-relaxed outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  المكان (اختياري)
                                </label>
                                <input
                                  type="text"
                                  value={annLocation}
                                  onChange={(e) => setAnnLocation(e.target.value)}
                                  placeholder="مثال: VC 1"
                                  className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-[#e6dccb] mb-1.5">
                                  الميعاد (اختياري)
                                </label>
                                <input
                                  type="text"
                                  value={annTime}
                                  onChange={(e) => setAnnTime(e.target.value)}
                                  placeholder="مثال: النهارده الساعة 10 مساءً"
                                  className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={sendingAnn}
                              className="w-full btn-cream-crimson py-4 rounded-2xl text-xs font-black cursor-pointer animate-sheen"
                            >
                              {sendingAnn
                                ? "جاري الإرسال للديسكورد..."
                                : `📢 إرسال الإعلان الآن إلى (${annChannels.length}) تشانل`}
                            </button>
                          </form>
                        </div>

                        <div className="xl:col-span-5 anarchy-glass rounded-[30px] p-7 space-y-4">
                          <div className="flex items-center justify-between border-b border-white/10 pb-3">
                            <span className="text-xs font-black text-white">
                              معاينة شكل الرسالة في الديسكورد
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400">
                              LIVE PREVIEW
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {annChannels.map((chId) => {
                              const chObj = ANNOUNCEMENT_CHANNELS.find((c) => c.id === chId);
                              return (
                                <span
                                  key={chId}
                                  className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-200"
                                >
                                  #{chObj?.badge || chId}
                                </span>
                              );
                            })}
                          </div>

                          <div className="rounded-2xl bg-[#1e1f22] border border-white/10 p-4 space-y-2.5 text-xs text-zinc-100 leading-relaxed whitespace-pre-line font-medium">
                            {annMention !== "none" && (
                              <span className="inline-block bg-[#5865F2]/30 text-[#c9cdfb] font-bold px-1.5 py-0.5 rounded">
                                {annMention}
                              </span>
                            )}
                            <div className="text-base font-black text-white">
                              📢 {annTitle || "عنوان الإعلان"}
                            </div>
                            <div className="text-zinc-500 select-none">
                              ━━━━━━━━━━━━━━━━━━
                            </div>
                            <div>{annMessage || "نص الرسالة سيظهر هنا..."}</div>
                            {(annLocation || annTime) && (
                              <>
                                <div className="text-zinc-500 select-none">
                                  ━━━━━━━━━━━━━━━━━━
                                </div>
                                {annLocation && (
                                  <div>
                                    📍 <strong>المكان:</strong> {annLocation}
                                  </div>
                                )}
                                {annTime && (
                                  <div>
                                    ⏰ <strong>الميعاد:</strong> {annTime}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {adminSubTab === "content" && (
                      <div className="space-y-6">
                        <div className="anarchy-glass rounded-[30px] p-7 space-y-4 border border-red-500/25">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <Flame className="w-5 h-5 text-red-500" />
                                <span>مؤشر نشاط وحالة العيلة (Alert Level)</span>
                              </h3>
                              <p className="text-xs text-[#e6dccb]/80 mt-0.5">
                                اختر وضع العيلة الحالي وسيظهر فوراً في الصفحة الرئيسية ويُرسل إشعار للديسكورد
                              </p>
                            </div>
                            {savingAlert && (
                              <span className="text-xs text-amber-300 font-bold">
                                جاري التحديث...
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {(["farm", "alert", "war"] as AlertModeType[]).map((modeKey) => {
                              const cfg = ALERT_MODES[modeKey];
                              const active = alertMode === modeKey;
                              return (
                                <button
                                  key={modeKey}
                                  type="button"
                                  onClick={() => handleUpdateAlertLevel(modeKey)}
                                  className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                                    active
                                      ? `${cfg.badgeBg} ring-2 ring-white/40 scale-[1.02]`
                                      : "bg-black/60 border-white/10 text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  <div>
                                    <span className="block text-xs font-black">
                                      {cfg.label}
                                    </span>
                                    <span className="block text-[10px] opacity-75 mt-0.5">
                                      {cfg.en}
                                    </span>
                                  </div>
                                  <span className={`w-3 h-3 rounded-full ${cfg.dotColor}`} />
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 pt-1">
                            <input
                              type="text"
                              value={alertMessage}
                              onChange={(e) => setAlertMessage(e.target.value)}
                              placeholder="اكتب رسالة توجيهية للأعضاء تظهر في الشريط..."
                              className="flex-1 bg-black/65 border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAlertLevel(alertMode, alertMessage)
                              }
                              className="btn-cream-ivory px-6 py-3 rounded-xl text-xs font-black cursor-pointer shrink-0"
                            >
                              تحديث الرسالة وإرسال تنبيه
                            </button>
                          </div>
                        </div>

                        <div className="anarchy-glass rounded-[30px] p-7">
                          <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                            <ImagePlus className="w-5 h-5 text-red-400" />
                            <span>تغيير خلفية الموقع وصفحة Home من جهازك</span>
                          </h3>
                          <p className="text-xs text-[#e6dccb]/80 mb-4">
                            ارفع أي صورة من جهازك وهتتطبق فوراً كخلفية للهوم والموقع كله
                          </p>

                          <form
                            onSubmit={handleUploadBackgroundFromDevice}
                            className="flex flex-col sm:flex-row items-center gap-4"
                          >
                            <label className="flex-1 w-full border-2 border-dashed border-red-500/45 hover:border-red-400 rounded-2xl px-5 py-4 text-center cursor-pointer bg-black/50 transition-all">
                              <span className="text-xs font-black text-white">
                                {bgFile
                                  ? `تم اختيار الخلفية: ${bgFile.name}`
                                  : "اضغط لاختيار صورة الخلفية من جهازك"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => setBgFile(e.target.files?.[0] || null)}
                              />
                            </label>

                            <button
                              type="submit"
                              disabled={uploadingBg}
                              className="w-full sm:w-auto btn-cream-crimson px-7 py-4 rounded-2xl text-xs font-black cursor-pointer shrink-0"
                            >
                              {uploadingBg ? "جاري الرفع..." : "تطبيق كخلفية للموقع"}
                            </button>
                          </form>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="anarchy-glass rounded-[30px] p-7 space-y-4">
                            <h3 className="text-lg font-black text-white">
                              إدارة صور وفيديوهات المعرض
                            </h3>
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                              {photos.map((p) => {
                                const vIdx = p.image_url.indexOf("#video=");
                                const thumb =
                                  vIdx !== -1 ? p.image_url.slice(0, vIdx) : p.image_url;
                                return (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between bg-black/60 px-3 py-2 rounded-xl text-xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img
                                        src={thumb}
                                        alt=""
                                        className="w-9 h-9 rounded-lg object-cover shrink-0"
                                      />
                                      <span className="truncate font-bold">{p.title}</span>
                                    </div>
                                    <button
                                      onClick={() => handleDeletePhoto(p.id)}
                                      className="text-red-400 hover:text-red-300 p-1.5 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <form
                            onSubmit={handleSaveFamilyContent}
                            className="anarchy-glass rounded-[30px] p-7 space-y-4"
                          >
                            <h3 className="text-lg font-black text-white">
                              تعديل "نبذة عن العيلة" و "القوانين"
                            </h3>

                            <div>
                              <label className="block text-xs font-bold text-[#e6dccb] mb-1">
                                عنوان النبذة
                              </label>
                              <input
                                value={aboutTitle}
                                onChange={(e) => setAboutTitle(e.target.value)}
                                className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#e6dccb] mb-1">
                                نص نبذة عن العيلة وإنجازاتها
                              </label>
                              <textarea
                                rows={4}
                                value={aboutContent}
                                onChange={(e) => setAboutContent(e.target.value)}
                                className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-[#e6dccb] mb-1">
                                قوانين العيلة (كل قانون في سطر جديد)
                              </label>
                              <textarea
                                rows={5}
                                value={rulesContent}
                                onChange={(e) => setRulesContent(e.target.value)}
                                className="w-full bg-black/65 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={savingContent}
                              className="w-full btn-cream-crimson py-3.5 rounded-xl text-xs font-black cursor-pointer"
                            >
                              {savingContent ? "جاري الحفظ..." : "حفظ النبذة والقوانين"}
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* =================================================================== */}
      {/* Modal بطاقة الهوية العسكرية / الإجرامية (Syndicate ID Card)        */}
      {/* =================================================================== */}
      <AnimatePresence>
        {dossierMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDossierMember(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-lg w-full rounded-[34px] bg-gradient-to-b from-[#1e070b] via-[#0e0406] to-[#060203] border border-[#f5efe6]/25 p-6 sm:p-7 shadow-[0_30px_80px_rgba(0,0,0,0.95)] space-y-5 relative overflow-hidden"
            >
              <div className="pointer-events-none absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <div className="flex items-center gap-2">
                  <IdCard className="w-5 h-5 text-red-500" />
                  <span className="text-xs font-black tracking-[0.2em] text-[#f5efe6] uppercase">
                    ANARCHY SYNDICATE • ID CARD
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDossierMember(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-500/30 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                {dossierMember.avatar_url ? (
                  <img
                    src={dossierMember.avatar_url}
                    alt={dossierMember.ic_name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-red-500/60 shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-3xl font-black text-red-400 shrink-0">
                    {dossierMember.ic_name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                      {dossierMember.ic_name}
                    </h3>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isMemberOnlineDiscord(dossierMember)
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50"
                          : "bg-zinc-800 text-zinc-300 border-white/10"
                      }`}
                    >
                      {isMemberOnlineDiscord(dossierMember) ? "● ACTIVE" : "○ STANDBY"}
                    </span>
                  </div>

                  <p dir="ltr" className="text-xs font-mono text-red-300 text-right">
                    SERIAL: ANC-{dossierMember.id.slice(0, 8).toUpperCase()}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {getMemberRoles(dossierMember).map((rl) => (
                      <span
                        key={rl}
                        className="text-[10px] font-black bg-[#f5efe6] text-[#120809] px-2.5 py-0.5 rounded-md"
                      >
                        {rl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-black/65 border border-white/10">
                  <span className="text-lg font-black text-[#f5efe6] block">
                    {dossierMember.points}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">النقاط (PTS)</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/65 border border-white/10">
                  <span className="text-lg font-black text-emerald-400 block">
                    {dossierMember.tasks_completed_count || 0}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">التاسكات</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-black/65 border border-white/10">
                  <span className="text-lg font-black text-amber-400 block">
                    {warns.filter((w) => w.member_id === dossierMember.id).length}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-bold">تحذيرات نشطة</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Discord Handle:</span>
                  <span dir="ltr" className="font-bold text-white">
                    {dossierMember.discord_username
                      ? `@${dossierMember.discord_username}`
                      : "غير مربوط"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">الرتبة القيادية:</span>
                  <span className="font-black text-red-400">{dossierMember.rank_name}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal تكبير الصورة */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="max-w-4xl w-full anarchy-glass rounded-3xl overflow-hidden">
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.title || ""}
              className="w-full max-h-[80vh] object-contain bg-black"
            />
            <div className="p-4 flex justify-between items-center text-xs">
              <span className="font-bold text-white">{selectedPhoto.title}</span>
              <span className="text-zinc-300">اضغط في أي مكان للإغلاق</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}