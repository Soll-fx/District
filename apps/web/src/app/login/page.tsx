"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Send,
  ShieldCheck,
  Tag,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import type { LoginResponse } from "@/lib/types";

type Tab = "login" | "register";
type CodeKind = "login-2fa" | "register";

const CODE_REASON: Record<CodeKind, string> = {
  "login-2fa": "login.codeReasonTwoFactor",
  register: "login.codeReasonRegister",
};

const PANEL = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
  transition: { duration: 0.22, ease: "easeOut" as const },
};

const spring = { type: "spring", stiffness: 420, damping: 34 } as const;

const BOOT_KEY = "sollo-boot-v1";
const BOOT_LINES = [
  "> SOLLO OS v2.6.0 — secure channel",
  "> handshake .......... OK",
  "> neural link ........ ESTABLISHED",
  "> decrypt interface .. DONE",
];

function pwScore(p: string) {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if ((/[A-ZА-ЯЁ]/.test(p) && /[a-zа-яё]/.test(p))) s++;
  if (/\d/.test(p) || /[^\w\s]/.test(p)) s++;
  return Math.min(s, 4);
}

const GoogleIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.281-5.281A5.27 5.27 0 0 1 11.956 6.7c1.309 0 2.531.462 3.47 1.372l2.588-2.588A9.007 9.007 0 0 0 11.956 3C7.086 3 3.167 6.92 3.167 11.79s3.919 8.79 8.789 8.79c4.528 0 8.424-3.216 8.424-8.79 0-.477-.051-.946-.097-1.434z"
    />
  </svg>
);

const SOCIALS: { key: string; label: string; icon: ReactNode }[] = [
  { key: "google", label: "Google", icon: <GoogleIcon /> },
];

function AppInput({
  label,
  icon,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: ReactNode }) {
  const [hovering, setHovering] = useState(false);
  const [line, setLine] = useState(160);
  const ref = useRef<HTMLDivElement>(null);

  const track = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setLine(e.clientX - rect.left);
  };

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovering(true)}
      onMouseMove={track}
      onMouseLeave={() => setHovering(false)}
      className="relative"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[7px] left-0 h-3 w-28 transition-opacity duration-200"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(64px circle at ${line}px 0px, var(--violet) 0%, transparent 70%)`,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[7px] left-0 h-3 w-28 transition-opacity duration-200"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(64px circle at ${line}px 12px, var(--violet) 0%, transparent 70%)`,
        }}
      />
      {label && <label className="label-caps mb-1.5 block">{label}</label>}
      <div className="flex h-[52px] items-center gap-3 rounded-2xl border border-card-border bg-bg px-4 transition-all duration-150 hover:border-violet/40 focus-within:border-violet/50 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.16)]">
        {icon && <span className="shrink-0 text-text-3">{icon}</span>}
        <input
          type="text"
          {...rest}
          className={cn(
            "h-full w-full bg-transparent text-[14px] text-text-1 outline-none placeholder:text-text-3",
            className
          )}
        />
      </div>
    </div>
  );
}

function PwMeter({ value }: { value: string }) {
  const { t } = useLang();
  if (!value) return null;
  const s = pwScore(value);
  const label = s <= 1 ? t("login.pwWeak") : s === 2 ? t("login.pwMedium") : t("login.pwStrong");
  const color =
    s <= 1 ? "var(--neg)" : s === 2 ? "var(--orange)" : s === 3 ? "var(--teal)" : "var(--pos)";
  return (
    <div className="flex items-center gap-2.5 pt-0.5">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i < s ? color : "var(--card-border)" }}
          />
        ))}
      </div>
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-wider"
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}

function SocialButton({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      onClick={(e) => e.preventDefault()}
      className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-card-border bg-bg transition-colors duration-200 hover:border-violet/40"
    >
      <span className="absolute inset-0 origin-bottom scale-y-0 bg-hero transition-transform duration-500 ease-out group-hover:scale-y-100" />
      <span className="relative z-10 text-text-2 transition-colors duration-300 group-hover:text-white">
        {children}
      </span>
    </a>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn btn-primary group/btn relative w-full overflow-hidden !py-2.5"
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <span className="pointer-events-none absolute inset-0 z-0 flex h-full w-full justify-center [transform:skewX(-13deg)_translateX(-120%)] transition-transform duration-700 ease-out group-hover/btn:[transform:skewX(-13deg)_translateX(120%)]">
        <span className="h-full w-8 bg-white/25" />
      </span>
    </button>
  );
}

const HudCorners = () => (
  <>
    <span aria-hidden className="cp-corner left-2 top-2 rounded-tl-sm border-l-2 border-t-2" />
    <span aria-hidden className="cp-corner right-2 top-2 rounded-tr-sm border-r-2 border-t-2" />
    <span aria-hidden className="cp-corner bottom-2 left-2 rounded-bl-sm border-b-2 border-l-2" />
    <span aria-hidden className="cp-corner bottom-2 right-2 rounded-br-sm border-b-2 border-r-2" />
  </>
);

function GlitchTitle({ children }: { children: string }) {
  return (
    <h1
      className="glitch text-center text-[26px] font-extrabold tracking-tight text-text-1"
      data-text={children}
    >
      {children}
    </h1>
  );
}

function BootOverlay({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const iv = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= BOOT_LINES.length) {
        clearInterval(iv);
        timer = setTimeout(onDone, 450);
      }
    }, 230);
    return () => {
      clearInterval(iv);
      if (timer) clearTimeout(timer);
    };
  }, [onDone]);

  return (
    <motion.div
      exit={{ opacity: 0 }}
      onClick={onDone}
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center overflow-hidden bg-[#05060A]"
    >
      <div className="cp-scan" aria-hidden />
      <div className="relative w-full max-w-[420px] px-6">
        <div className="space-y-1.5 font-mono text-[13px] leading-relaxed text-teal sm:text-[13.5px]">
          {BOOT_LINES.slice(0, count).map((l, i) => (
            <p key={l} className={i === count - 1 ? "cp-caret" : undefined}>
              {l}
            </p>
          ))}
        </div>
      </div>
      <SkipHint />
    </motion.div>
  );
}

function SkipHint() {
  const { t } = useLang();
  return (
    <p className="absolute bottom-7 left-0 right-0 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white/25">
      {t("login.bootSkip")}
    </p>
  );
}

function CyberBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
        el.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="cp-scene fixed inset-0 overflow-hidden bg-[#05060A]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,108,240,0.14), transparent), radial-gradient(ellipse 70% 50% at 85% 110%, rgba(20,184,166,0.10), transparent)",
        }}
      />
      <div className="cp-orb cp-orb-a" />
      <div className="cp-orb cp-orb-b" />
      <div className="cp-orb cp-orb-c" />
      <div className="cp-grid" />
      <div className="cp-vignette" />
      <div className="cp-scan" />
      <div className="cp-sweep" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const { t } = useLang();

  const [tab, setTab] = useState<Tab>("login");
  const [step, setStep] = useState<"form" | "code">("form");
  const [codeKind, setCodeKind] = useState<CodeKind>("login-2fa");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promo, setPromo] = useState("");
  const [code, setCode] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [blobOn, setBlobOn] = useState(false);
  const [blob, setBlob] = useState({ x: 240, y: 240 });

  const [booted, setBooted] = useState(true);
  const [granted, setGranted] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRaf = useRef(0);

  useEffect(() => {
    if (sessionStorage.getItem(BOOT_KEY) === "1") return;
    const id = requestAnimationFrame(() => setBooted(false));
    return () => cancelAnimationFrame(id);
  }, []);

  const finishBoot = useCallback(() => {
    sessionStorage.setItem(BOOT_KEY, "1");
    setBooted(true);
  }, []);

  const enter = (res: LoginResponse) => {
    if (!res.accessToken || !res.user) return;
    setSession(res.accessToken, res.user);
    setGranted(true);
    window.setTimeout(() => router.replace("/"), 950);
  };

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setStep("form");
    setError(null);
    setLoading(false);
  };

  const requestCode = async (kind: CodeKind) => {
    setError(null);
    setLoading(true);
    try {
      let res: LoginResponse;
      if (kind === "register") {
        res = await api.post<LoginResponse>("/auth/register", {
          email,
          password,
          promoCode: promo.trim() || undefined,
        });
      } else {
        res = await api.post<LoginResponse>("/auth/login", { email, password });
        if (res.accessToken) {
          enter(res);
          return;
        }
      }
      if (res.twoFactorToken) {
        setToken(res.twoFactorToken);
        setDevCode(res.devCode ?? null);
        setSentEmail(email);
        setCodeKind(kind);
        setCode("");
        setStep("code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const res =
        codeKind === "register"
          ? await api.post<LoginResponse>("/auth/confirm-registration", {
              twoFactorToken: token,
              code,
            })
          : await api.post<LoginResponse>("/auth/verify-2fa", {
              twoFactorToken: token,
              code,
            });
      if (res.accessToken) {
        enter(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  const backToForm = () => {
    setStep("form");
    setError(null);
    setToken(null);
    setDevCode(null);
    setCode("");
  };

  const fillDemo = () => {
    setEmail("sollo@example.com");
    setPassword("sollo123");
    setError(null);
  };

  const onCardMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    cancelAnimationFrame(tiltRaf.current);
    tiltRaf.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1200px) rotateY(${(x * 3.2).toFixed(2)}deg) rotateX(${(-y * 3.2).toFixed(2)}deg)`;
    });
  };

  const onCardLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    cancelAnimationFrame(tiltRaf.current);
    el.style.transform = "";
  };

  const ErrorBox = error ? (
    <p className="rounded-xl bg-neg/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-neg">{error}</p>
  ) : null;

  return (
    <div data-theme="dark" className="relative min-h-dvh overflow-hidden bg-[#05060A]">
      <AnimatePresence>{!booted && <BootOverlay key="boot" onDone={finishBoot} />}</AnimatePresence>

      <AnimatePresence>
        {granted && (
          <motion.div
            key="granted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 1.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              className="cp-stamp rounded-lg bg-black/60 px-8 py-5 font-mono text-[20px] font-extrabold tracking-[0.28em] text-pos sm:text-[24px]"
            >
              ACCESS GRANTED
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CyberBackdrop />

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 py-10">
        <motion.div
          ref={cardRef}
          onMouseMove={onCardMove}
          onMouseLeave={onCardLeave}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="card relative w-full max-w-[920px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        >
          <HudCorners />

          <div className="flex">
            {/* ── левая половина: форма ── */}
            <div
              className="relative w-full overflow-hidden px-6 py-10 sm:px-10 lg:w-1/2 lg:px-14"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setBlob({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseEnter={() => setBlobOn(true)}
              onMouseLeave={() => setBlobOn(false)}
            >
              <div
                aria-hidden
                className={cn(
                  "pointer-events-none absolute left-0 top-0 h-[480px] w-[480px] rounded-full blur-3xl transition-opacity duration-300",
                  blobOn ? "opacity-100" : "opacity-0"
                )}
                style={{
                  background: "radial-gradient(circle, rgba(124,108,240,0.13), transparent 65%)",
                  transform: `translate(${blob.x - 240}px, ${blob.y - 240}px)`,
                  transition: blobOn ? "transform 0.15s ease-out" : "none",
                }}
              />

              <div className="relative z-10">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring}
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-teal text-[17px] font-extrabold text-white"
                >
                  D
                </motion.span>

                <div className="pill-control mx-auto mt-7 mb-8 w-full max-w-[300px]">
                  {(["login", "register"] as const).map((k) => {
                    const active = tab === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => switchTab(k)}
                        className={cn("relative flex-1 !px-2 py-2 text-center", active && "!text-white")}
                      >
                        {active && (
                          <motion.span
                            layoutId="auth-tab"
                            className="absolute inset-0 rounded-[9px] bg-[var(--hero)]"
                            transition={spring}
                          />
                        )}
                        <span className="relative z-10">
                          {t(k === "login" ? "login.tabLogin" : "login.tabRegister")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {step === "code" ? (
                    <motion.form key="code" {...PANEL} onSubmit={verifyCode} className="space-y-4">
                      <div className="flex flex-col items-center text-center">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/10 text-violet">
                          <ShieldCheck size={20} />
                        </span>
                        <h2 className="mt-3 text-[16px] font-extrabold text-text-1">{t("login.twoFactorTitle")}</h2>
                        <p className="mt-1 text-[12.5px] text-text-2">
                          {t("login.codeSentTo")} <span className="font-semibold text-text-1">{sentEmail}</span>
                          <span className="mx-1.5 text-text-3">·</span>
                          {t(CODE_REASON[codeKind])}
                        </p>
                      </div>

                      <div>
                        <label htmlFor="code" className="label-caps mb-1.5 block">
                          {t("login.codeLabel")}
                        </label>
                        <input
                          id="code"
                          type="text"
                          inputMode="numeric"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          autoFocus
                          className="field text-center font-mono text-[16px] tracking-[0.35em]"
                          placeholder="••••••"
                        />
                      </div>

                      {devCode && (
                        <p className="rounded-xl bg-teal/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-teal">
                          {t("login.devCode")} <span className="font-mono tracking-widest">{devCode}</span>
                        </p>
                      )}

                      {ErrorBox}

                      <SubmitButton loading={loading}>
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                        {loading ? t("login.loading") : t("login.verify")}
                      </SubmitButton>

                      <button
                        type="button"
                        onClick={() => requestCode(codeKind)}
                        disabled={loading}
                        className="btn btn-ghost w-full !py-2 text-[12.5px]"
                      >
                        <Send size={14} />
                        {t("login.resend")}
                      </button>

                      <button
                        type="button"
                        onClick={backToForm}
                        className="btn btn-ghost w-full !py-2 text-[12.5px]"
                      >
                        <ArrowLeft size={14} />
                        {t("login.backToCredentials")}
                      </button>
                    </motion.form>
                  ) : (
                    <motion.div key={tab} {...PANEL} className="space-y-4">
                      <div className="text-center">
                        <GlitchTitle>{t(tab === "login" ? "login.tabLogin" : "login.tabRegister")}</GlitchTitle>
                        <p className="mt-1 text-[13px] text-text-2">
                          {t(tab === "login" ? "login.subtitle" : "login.registerSubtitle")}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        {SOCIALS.map((s) => (
                          <SocialButton key={s.key} label={s.label} href="#">
                            {s.icon}
                          </SocialButton>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-[11.5px] font-semibold text-text-3">
                        <span className="h-px flex-1 bg-card-border" />
                        {t("login.orAccount")}
                        <span className="h-px flex-1 bg-card-border" />
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          requestCode(tab === "login" ? "login-2fa" : "register");
                        }}
                        className="space-y-3.5"
                      >
                        <AppInput
                          label={t("login.emailLabel")}
                          icon={<Mail size={16} />}
                          id={tab === "login" ? "email" : "reg-email"}
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                          required
                        />
                        <AppInput
                          label={t("login.password")}
                          icon={<Lock size={16} />}
                          id={tab === "login" ? "password" : "reg-password"}
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete={tab === "login" ? "current-password" : "new-password"}
                          required
                          minLength={6}
                        />

                        {tab === "register" && <PwMeter value={password} />}

                        {tab === "register" && (
                          <AppInput
                            label={t("login.promo")}
                            icon={<Tag size={16} />}
                            id="reg-promo"
                            name="promo"
                            type="text"
                            placeholder="SOLLO30"
                            value={promo}
                            onChange={(e) => setPromo(e.target.value.toUpperCase())}
                            autoComplete="off"
                            className="uppercase tracking-wider"
                          />
                        )}

                        {ErrorBox}

                        <SubmitButton loading={loading}>
                          {loading ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : tab === "login" ? (
                            <LogIn size={15} />
                          ) : (
                            <UserPlus size={15} />
                          )}
                          {loading ? t("login.loading") : tab === "login" ? t("login.submit") : t("login.registerSubmit")}
                        </SubmitButton>

                        {tab === "login" ? (
                          <div className="space-y-2">
                            <a
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="block text-right text-[12px] font-semibold text-text-2 transition-colors hover:text-text-1"
                            >
                              {t("login.forgot")}
                            </a>
                            <p className="text-center text-[11.5px] text-text-3">
                              {t("login.demoHint")}{" "}
                              <button
                                type="button"
                                onClick={fillDemo}
                                className="font-semibold text-text-2 transition-colors hover:text-text-1"
                              >
                                sollo@example.com / sollo123
                              </button>
                            </p>
                          </div>
                        ) : (
                          <p className="text-center text-[11.5px] text-text-3">{t("login.registerSubtitle")}</p>
                        )}
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── правая половина: кибер-сцена ── */}
            <div className="relative hidden w-1/2 overflow-hidden bg-[#070A12] lg:block">
              <div className="cp-grid opacity-80" aria-hidden />
              <div className="cp-scan" aria-hidden />
              <div className="cp-sweep" aria-hidden />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="px-10 text-center">
                  <p
                    className="glitch font-mono text-[44px] font-extrabold leading-none tracking-[0.06em] text-white"
                    data-text="SOLLO"
                  >
                    SOLLO
                  </p>
                  <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.4em] text-teal">
                    trading terminal
                  </p>

                  <div className="mx-auto mt-9 w-fit space-y-1.5 text-left font-mono text-[11px] text-white/40">
                    <p>
                      <span className="text-pos">●</span>&nbsp;&nbsp;market feed ....... ONLINE
                    </p>
                    <p>
                      <span className="text-pos">●</span>&nbsp;&nbsp;analytics core .... ONLINE
                    </p>
                    <p>
                      <span className="text-orange">▲</span>&nbsp;&nbsp;latency ........... 23ms
                    </p>
                  </div>

                  <p className="mx-auto mt-8 max-w-[300px] text-[12.5px] leading-relaxed text-white/55">
                    {t(tab === "login" ? "login.panelLogin" : "login.panelRegister")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
