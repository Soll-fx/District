"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Send,
  ShieldCheck,
  Tag,
  UserPlus,
} from "lucide-react";
import { SplineScene } from "@/components/spline-scene";
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

const ROBOT_SCENE = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode";

function pwScore(p: string) {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if ((/[A-ZА-ЯЁ]/.test(p) && /[a-zа-яё]/.test(p))) s++;
  if (/\d/.test(p) || /[^\w\s]/.test(p)) s++;
  return Math.min(s, 4);
}

function PwMeter({ value }: { value: string }) {
  const { t } = useLang();
  if (!value) return null;
  const s = pwScore(value);
  const label = s <= 1 ? t("login.pwWeak") : s === 2 ? t("login.pwMedium") : t("login.pwStrong");
  const color =
    s <= 1 ? "#EF4444" : s === 2 ? "#F59E0B" : s === 3 ? "#14B8A6" : "#22C55E";
  return (
    <div className="flex items-center gap-2.5 pt-0.5">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: i < s ? color : "rgba(255,255,255,0.10)" }}
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

function AppInput({
  label,
  icon,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: ReactNode }) {
  return (
    <div className="relative">
      {label && <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-white/40">{label}</label>}
      <div className="flex h-[52px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 transition-all duration-150 hover:border-white/20 focus-within:border-violet/60 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_24px_rgba(124,108,240,0.25)]">
        {icon && <span className="shrink-0 text-white/35">{icon}</span>}
        <input
          {...rest}
          className={cn(
            "h-full w-full bg-transparent text-[14px] text-white outline-none placeholder:text-white/25",
            className
          )}
        />
      </div>
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

  const [granted, setGranted] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = "light";
  }, []);

  const enter = (res: LoginResponse) => {
    if (!res.accessToken || !res.user) return;
    setSession(res.accessToken, res.user);
    setGranted(true);
    window.setTimeout(() => router.replace("/"), 850);
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

  const ErrorBox = error ? (
    <p className="rounded-xl bg-red-500/15 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-400">{error}</p>
  ) : null;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F5F6FA] px-4 py-8 sm:py-12">
      {/* мягкие пятна на белом фоне */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-violet/15 blur-[110px]" />
        <div className="absolute -bottom-40 -right-28 h-[460px] w-[460px] rounded-full bg-teal/15 blur-[120px]" />
      </div>

      <AnimatePresence>
        {granted && (
          <motion.div
            key="granted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 backdrop-blur-[6px]"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
              className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-pos bg-pos/15 text-pos shadow-[0_0_60px_rgba(34,197,94,0.4)]"
            >
              <Check size={38} strokeWidth={2.6} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 mx-auto grid w-full max-w-[1060px] overflow-hidden rounded-[28px] bg-[#0B0B10] shadow-[0_40px_100px_rgba(15,20,43,0.35)] lg:grid-cols-2"
      >
        {/* ── левая половина: форма ── */}
        <div className="relative w-full px-6 py-10 sm:px-12 sm:py-12">
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
            className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-teal text-[17px] font-extrabold text-white shadow-[0_0_30px_rgba(124,108,240,0.45)]"
          >
            D
          </motion.span>

          <div className="mx-auto mt-7 mb-8 flex w-full max-w-[300px] rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(["login", "register"] as const).map((k) => {
              const active = tab === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => switchTab(k)}
                  className={cn(
                    "relative flex-1 px-2 py-2 text-center",
                    active ? "text-white" : "text-white/45 hover:text-white/80"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet to-teal"
                      transition={spring}
                    />
                  )}
                  <span className="relative z-10 text-[12.5px] font-bold">
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
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/15 text-violet">
                    <ShieldCheck size={20} />
                  </span>
                  <h2 className="mt-3 text-[16px] font-extrabold text-white">{t("login.twoFactorTitle")}</h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">
                    {t("login.codeSentTo")} <span className="font-semibold text-white">{sentEmail}</span>
                    <span className="mx-1.5 text-white/30">·</span>
                    {t(CODE_REASON[codeKind])}
                  </p>
                </div>

                <div>
                  <label htmlFor="code" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-white/40">
                    {t("login.codeLabel")}
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center font-mono text-[16px] tracking-[0.35em] text-white outline-none transition-colors placeholder:text-white/25 focus:border-violet/60 focus:shadow-[0_0_24px_rgba(124,108,240,0.25)]"
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
                  className="btn w-full border border-white/10 bg-transparent !py-2 text-[12.5px] font-bold text-white/60 transition-colors hover:border-white/25 hover:text-white"
                >
                  <Send size={14} />
                  {t("login.resend")}
                </button>

                <button
                  type="button"
                  onClick={backToForm}
                  className="btn w-full border border-white/10 bg-transparent !py-2 text-[12.5px] font-bold text-white/60 transition-colors hover:border-white/25 hover:text-white"
                >
                  <ArrowLeft size={14} />
                  {t("login.backToCredentials")}
                </button>
              </motion.form>
            ) : (
              <motion.div key={tab} {...PANEL} className="space-y-5">
                <div className="text-center">
                  <h1 className="text-[26px] font-extrabold tracking-tight text-white">
                    {t(tab === "login" ? "login.tabLogin" : "login.tabRegister")}
                  </h1>
                  <p className="mt-1 text-[13px] text-white/50">
                    {t(tab === "login" ? "login.subtitle" : "login.registerSubtitle")}
                  </p>
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
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="block text-right text-[12px] font-semibold text-white/45 transition-colors hover:text-white"
                    >
                      {t("login.forgot")}
                    </a>
                  ) : (
                    <p className="text-center text-[11.5px] text-white/35">{t("login.registerSubtitle")}</p>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── правая половина: живой робот ── */}
        <div className="relative hidden min-h-[620px] lg:block">
          <SplineScene scene={ROBOT_SCENE} className="absolute inset-0 h-full w-full" />
          <div aria-hidden className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 h-9 w-24 rounded-lg bg-[#0B0B10]" />
        </div>
      </motion.div>
    </div>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group/btn relative w-full overflow-hidden rounded-xl bg-white !py-3 text-[13.5px] font-extrabold text-[#0B0B10] transition-transform active:scale-[0.98] disabled:opacity-70"
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      <span className="pointer-events-none absolute inset-0 z-0 flex h-full w-full justify-center [transform:skewX(-13deg)_translateX(-120%)] transition-transform duration-700 ease-out group-hover/btn:[transform:skewX(-13deg)_translateX(120%)]">
        <span className="h-full w-8 bg-violet/30" />
      </span>
    </button>
  );
}
