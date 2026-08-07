"use client";

import { useRef, useState } from "react";
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
      <div className="flex h-[52px] items-center gap-3 rounded-2xl border border-card-border bg-bg px-4 transition-all duration-150 hover:border-violet/40 focus-within:border-violet/50">
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
          setSession(res.accessToken, res.user!);
          router.replace("/");
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
        setSession(res.accessToken, res.user!);
        router.replace("/");
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
    setEmail("district@example.com");
    setPassword("district123");
    setError(null);
  };

  const ErrorBox = error ? (
    <p className="rounded-xl bg-neg/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-neg">{error}</p>
  ) : null;

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="card w-full max-w-[920px] overflow-hidden"
      >
        <div className="flex">
          {/* ── left: form ── */}
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
                      <h1 className="text-[26px] font-extrabold tracking-tight text-text-1">
                        {t(tab === "login" ? "login.tabLogin" : "login.tabRegister")}
                      </h1>
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

                      {tab === "register" && (
                        <AppInput
                          label={t("login.promo")}
                          icon={<Tag size={16} />}
                          id="reg-promo"
                          name="promo"
                          type="text"
                          placeholder="DISTRICT30"
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
                              district@example.com / district123
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

          {/* ── right: image ── */}
          <div className="relative hidden w-1/2 lg:block">
            <img
              src="https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-hero/90 via-hero/45 to-transparent" />
            <div className="absolute inset-0 flex items-end p-8">
              <div>
                <p className="text-[17px] font-extrabold leading-snug text-white">District</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-white/80">
                  {t(tab === "login" ? "login.panelLogin" : "login.panelRegister")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
