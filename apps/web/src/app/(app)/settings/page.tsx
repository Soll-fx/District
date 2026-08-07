"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserRound, ShieldCheck, Bell, Gauge, IdCard, KeyRound, Smartphone, MonitorSmartphone, LogOut, Upload, Trash2, Copy, CheckCircle2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Toggle } from "@/components/ui/toggle";
import SwitchToggleThemeDemo from "@/components/ui/toggle-theme";
import { MetricsEditor } from "@/components/MetricsEditor";
import { ProfileCard } from "@/components/ProfileCard";
import { cn } from "@/lib/utils";
import { useLang, type Lang } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DeviceSession } from "@/lib/types";
import { useProfile, useUpdateProfile, useSessions, useRevokeSession, useRevokeOthers, useSendTwoFactorCode, useEnableTwoFactor, useDisableTwoFactor } from "@/hooks/use-settings";
import {
  useNotificationPrefs,
  useSubscribePush,
  useTestPush,
  useUnsubscribePush,
  useUpdateNotificationPrefs,
} from "@/hooks/use-notifications";
import {
  getCurrentPushSubscription,
  registerPushServiceWorker,
  subscriptionKeys,
  urlBase64ToUint8Array,
} from "@/lib/push";
import { api } from "@/lib/api";

const SOCIALS: { key: "instagram" | "telegram" | "youtube" | "tradingview"; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "telegram", label: "Telegram" },
  { key: "youtube", label: "YouTube" },
  { key: "tradingview", label: "TradingView" },
];

type TabKey = "profile" | "security" | "devices" | "notifications" | "metrics" | "card";

const TABS: { key: TabKey; labelKey: string; icon: typeof UserRound }[] = [
  { key: "profile", labelKey: "settings.profile", icon: UserRound },
  { key: "security", labelKey: "settings.security", icon: ShieldCheck },
  { key: "devices", labelKey: "settings.devices", icon: MonitorSmartphone },
  { key: "notifications", labelKey: "settings.notifications", icon: Bell },
  { key: "card", labelKey: "settings.card", icon: IdCard },
  { key: "metrics", labelKey: "settings.metrics", icon: Gauge },
];

const VALID_TABS: TabKey[] = TABS.map((t) => t.key);

const TIMEZONES: { value: string; label: string }[] = [
  { value: "UTC", label: "UTC (Greenwich, UK)" },
  { value: "Pacific/Pago_Pago", label: "Pago Pago, American Samoa" },
  { value: "Pacific/Honolulu", label: "Honolulu, USA" },
  { value: "America/Anchorage", label: "Anchorage, USA" },
  { value: "America/Los_Angeles", label: "Los Angeles, USA" },
  { value: "America/Vancouver", label: "Vancouver, Canada" },
  { value: "America/Denver", label: "Denver, USA" },
  { value: "America/Chicago", label: "Chicago, USA" },
  { value: "America/Mexico_City", label: "Mexico City, Mexico" },
  { value: "America/New_York", label: "New York, USA" },
  { value: "America/Toronto", label: "Toronto, Canada" },
  { value: "America/Bogota", label: "Bogotá, Colombia" },
  { value: "America/Lima", label: "Lima, Peru" },
  { value: "America/Santiago", label: "Santiago, Chile" },
  { value: "America/Sao_Paulo", label: "São Paulo, Brazil" },
  { value: "America/Buenos_Aires", label: "Buenos Aires, Argentina" },
  { value: "America/Noronha", label: "Fernando de Noronha, Brazil" },
  { value: "Atlantic/Azores", label: "Azores, Portugal" },
  { value: "Europe/London", label: "London, UK" },
  { value: "Europe/Dublin", label: "Dublin, Ireland" },
  { value: "Europe/Lisbon", label: "Lisbon, Portugal" },
  { value: "Africa/Casablanca", label: "Casablanca, Morocco" },
  { value: "Europe/Paris", label: "Paris, France" },
  { value: "Europe/Berlin", label: "Berlin, Germany" },
  { value: "Europe/Amsterdam", label: "Amsterdam, Netherlands" },
  { value: "Europe/Madrid", label: "Madrid, Spain" },
  { value: "Europe/Rome", label: "Rome, Italy" },
  { value: "Europe/Zurich", label: "Zurich, Switzerland" },
  { value: "Europe/Vienna", label: "Vienna, Austria" },
  { value: "Europe/Stockholm", label: "Stockholm, Sweden" },
  { value: "Europe/Helsinki", label: "Helsinki, Finland" },
  { value: "Europe/Warsaw", label: "Warsaw, Poland" },
  { value: "Europe/Prague", label: "Prague, Czechia" },
  { value: "Africa/Lagos", label: "Lagos, Nigeria" },
  { value: "Europe/Athens", label: "Athens, Greece" },
  { value: "Europe/Kyiv", label: "Kyiv, Ukraine" },
  { value: "Europe/Bucharest", label: "Bucharest, Romania" },
  { value: "Africa/Cairo", label: "Cairo, Egypt" },
  { value: "Africa/Johannesburg", label: "Johannesburg, South Africa" },
  { value: "Europe/Moscow", label: "Moscow, Russia" },
  { value: "Europe/Istanbul", label: "Istanbul, Türkiye" },
  { value: "Asia/Riyadh", label: "Riyadh, Saudi Arabia" },
  { value: "Africa/Nairobi", label: "Nairobi, Kenya" },
  { value: "Asia/Tehran", label: "Tehran, Iran" },
  { value: "Asia/Dubai", label: "Dubai, UAE" },
  { value: "Asia/Baku", label: "Baku, Azerbaijan" },
  { value: "Asia/Kabul", label: "Kabul, Afghanistan" },
  { value: "Asia/Yekaterinburg", label: "Yekaterinburg, Russia" },
  { value: "Asia/Tashkent", label: "Tashkent, Uzbekistan" },
  { value: "Asia/Karachi", label: "Karachi, Pakistan" },
  { value: "Asia/Kolkata", label: "Mumbai / New Delhi, India" },
  { value: "Asia/Kathmandu", label: "Kathmandu, Nepal" },
  { value: "Asia/Dhaka", label: "Dhaka, Bangladesh" },
  { value: "Asia/Almaty", label: "Almaty, Kazakhstan" },
  { value: "Asia/Yangon", label: "Yangon, Myanmar" },
  { value: "Asia/Bangkok", label: "Bangkok, Thailand" },
  { value: "Asia/Jakarta", label: "Jakarta, Indonesia" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Hong_Kong", label: "Hong Kong" },
  { value: "Asia/Shanghai", label: "Shanghai, China" },
  { value: "Asia/Manila", label: "Manila, Philippines" },
  { value: "Asia/Tokyo", label: "Tokyo, Japan" },
  { value: "Asia/Seoul", label: "Seoul, South Korea" },
  { value: "Australia/Adelaide", label: "Adelaide, Australia" },
  { value: "Australia/Sydney", label: "Sydney, Australia" },
  { value: "Australia/Melbourne", label: "Melbourne, Australia" },
  { value: "Pacific/Guadalcanal", label: "Honiara, Solomon Islands" },
  { value: "Pacific/Auckland", label: "Auckland, New Zealand" },
  { value: "Pacific/Fiji", label: "Suva, Fiji" },
  { value: "Pacific/Apia", label: "Apia, Samoa" },
  { value: "Pacific/Kiritimati", label: "Kiritimati, Kiribati" },
];

const TZ_VALUES = TIMEZONES.map((tz) => tz.value);

function offsetMinutes(tz: string): number {
  try {
    const off =
      Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
    const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(off);
    if (!m) return 0;
    const h = parseInt(m[2], 10);
    const min = m[3] ? parseInt(m[3], 10) : 0;
    return (m[1] === "-" ? -1 : 1) * (h * 60 + min);
  } catch {
    return 0;
  }
}

function offsetLabel(min: number): string {
  if (min === 0) return "UTC";
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${min > 0 ? "+" : "−"}${m ? `${h}:${String(m).padStart(2, "0")}` : h}`;
}

function timezoneLabel(tz: string) {
  try {
    const off = Intl.DateTimeFormat("en", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    return `UTC${(off ?? "").replace("GMT", "")}`;
  } catch {
    return tz;
  }
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const tab: TabKey = VALID_TABS.includes(raw as TabKey) ? (raw as TabKey) : "profile";

  const { lang, t, setLang } = useLang();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const send2faCode = useSendTwoFactorCode();
  const enable2fa = useEnableTwoFactor();
  const disable2fa = useDisableTwoFactor();
  const { theme } = useTheme();
  const router = useRouter();
  const logout = useAuth((s) => s.logout);

  const sessions = useSessions();
  const revokeSession = useRevokeSession();
  const revokeOthers = useRevokeOthers();
  const sessionsData = sessions.data;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("");
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [avatarDraft, setAvatarDraft] = useState<string | null | undefined>(undefined);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [socialsSaved, setSocialsSaved] = useState(false);
  const [socialsError, setSocialsError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [twoFaState, setTwoFaState] = useState<"idle" | "enable-code" | "disable-code" | "backup">("idle");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaMsg, setTwoFaMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [twoFaDevCode, setTwoFaDevCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [backupCopied, setBackupCopied] = useState(false);

  const handleTwoFactorToggle = (on: boolean) => {
    setTwoFaMsg(null);
    setTwoFaCode("");
    setBackupCodes(null);
    setTwoFaDevCode(null);
    send2faCode.mutate(undefined, {
      onSuccess: (res) => {
        setTwoFaDevCode(res.devCode ?? null);
        setTwoFaState(on ? "enable-code" : "disable-code");
      },
      onError: (err) =>
        setTwoFaMsg({
          type: "err",
          text: err instanceof Error ? err.message : t("settings.twoFactorError"),
        }),
    });
  };

  const confirmTwoFactor = () => {
    setTwoFaMsg(null);
    if (twoFaState === "enable-code") {
      enable2fa.mutate(twoFaCode, {
        onSuccess: (res) => {
          if (res.backupCodes?.length) {
            setBackupCodes(res.backupCodes);
            setTwoFaState("backup");
          } else {
            setTwoFaState("idle");
            setTwoFaMsg({ type: "ok", text: t("settings.twoFactorEnabled") });
          }
          setTwoFaCode("");
          setTwoFaDevCode(null);
        },
        onError: (err) =>
          setTwoFaMsg({
            type: "err",
            text: err instanceof Error ? err.message : t("settings.twoFactorError"),
          }),
      });
    } else {
      disable2fa.mutate(twoFaCode, {
        onSuccess: () => {
          setTwoFaState("idle");
          setTwoFaCode("");
          setTwoFaDevCode(null);
          setTwoFaMsg({ type: "ok", text: t("settings.twoFactorDisabled") });
        },
        onError: (err) =>
          setTwoFaMsg({
            type: "err",
            text: err instanceof Error ? err.message : t("settings.twoFactorError"),
          }),
      });
    }
  };

  const cancelTwoFactor = () => {
    setTwoFaState("idle");
    setTwoFaCode("");
    setTwoFaDevCode(null);
    setTwoFaMsg(null);
    setBackupCodes(null);
  };

  const copyBackupCodes = async () => {
    if (!backupCodes) return;
    try {
      await navigator.clipboard.writeText(backupCodes.join("\n"));
      setBackupCopied(true);
      window.setTimeout(() => setBackupCopied(false), 2500);
    } catch {
      // clipboard может быть недоступен
    }
  };

  const notifPrefs = useNotificationPrefs();
  const updatePrefs = useUpdateNotificationPrefs();
  const subscribePush = useSubscribePush();
  const unsubscribePush = useUnsubscribePush();
  const testPush = useTestPush();
  const prefs = notifPrefs.data;
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushTestSent, setPushTestSent] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  const handlePushToggle = async (v: boolean) => {
    setPushError(null);
    if (v) {
      try {
        const reg = await registerPushServiceWorker();
        if (!reg) {
          setPushError(t("notif.pushUnsupported"));
          return;
        }
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm !== "granted") {
          setPushError(t("notif.pushDenied"));
          return;
        }
        const { publicKey } = await api.get<{ publicKey: string }>("/notifications/vapid-public-key");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        await subscribePush.mutateAsync({
          endpoint: sub.endpoint,
          ...subscriptionKeys(sub),
        });
        await updatePrefs.mutateAsync({ pushNotif: true });
      } catch {
        setPushError(t("notif.pushError"));
      }
    } else {
      try {
        const sub = await getCurrentPushSubscription();
        if (sub) {
          await unsubscribePush.mutateAsync(sub.endpoint);
          await sub.unsubscribe();
        }
      } catch {
        // локальная отписка может упасть — но настройку всё равно сохраняем
      }
      await updatePrefs.mutateAsync({ pushNotif: false });
    }
  };

  const sendTest = () => {
    setPushTestSent(false);
    testPush.mutate(undefined, {
      onSuccess: () => {
        setPushTestSent(true);
        window.setTimeout(() => setPushTestSent(false), 3000);
      },
      onError: (err) =>
        setPushError(err instanceof Error ? err.message : t("notif.pushError")),
    });
  };

  const profileData = profile.data;
  const effectiveName = name !== "" ? name : profileData?.name ?? "";
  const effectiveEmail = email !== "" ? email : profileData?.email ?? "";
  const effectiveTimezone = timezone !== "" ? timezone : profileData?.timezone ?? "";
  const selectTz = TZ_VALUES.includes(effectiveTimezone) ? effectiveTimezone : "UTC";

  const tzOptions = useMemo(() => {
    return TIMEZONES.map((tz) => ({
      value: tz.value,
      label: tz.label,
      off: offsetMinutes(tz.value),
    }))
      .sort((a, b) => a.off - b.off || a.label.localeCompare(b.label))
      .map((tz) => ({
        ...tz,
        prefix: tz.value === "UTC" ? "" : `${offsetLabel(tz.off)} · `,
      }));
  }, []);
  const avatarUrl = profileData?.avatarUrl ?? null;
  const effectiveAvatar = avatarDraft !== undefined ? avatarDraft : avatarUrl;
  const socialValue = (key: (typeof SOCIALS)[number]["key"]) =>
    socials[key] !== undefined ? socials[key] : profileData?.[key] ?? "";

  const handleAvatarFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const max = 512;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          setAvatarDraft(objectUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        URL.revokeObjectURL(objectUrl);
        setAvatarDraft(dataUrl);
      } catch {
        URL.revokeObjectURL(objectUrl);
        setAvatarDraft(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => setAvatarDraft(String(reader.result));
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  };

  const setTab = (key: TabKey) => {
    window.history.replaceState(null, "", `/settings?tab=${key}`);
  };

  const changeLanguage = (next: Lang) => {
    if (next === lang) return;
    setLang(next);
    updateProfile.mutate({
      name: effectiveName.trim(),
      email: effectiveEmail.trim(),
      locale: next,
      timezone: effectiveTimezone,
    });
  };

  const changePassword = async () => {
    setPwBusy(true);
    setPwMsg(null);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPwMsg({ type: "ok", text: t("settings.passwordChanged") });
    } catch (err) {
      setPwMsg({
        type: "err",
        text: err instanceof Error ? err.message : t("settings.passwordError"),
      });
    } finally {
      setPwBusy(false);
    }
  };

  const handleRevokeSession = (s: DeviceSession) => {
    revokeSession.mutate(s.id, {
      onSuccess: () => {
        if (s.current) {
          logout();
          router.replace("/login");
        }
      },
    });
  };

  const lastActiveLabel = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return t("settings.justNow");
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins} ${t("settings.minAgo")}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${t("settings.hoursAgo")}`;
    return `${Math.floor(hours / 24)} ${t("settings.daysAgo")}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t("page.settings.t")} subtitle={t("page.settings.s")} />

      <div className="animate-in flex flex-wrap gap-1.5">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn("chip", tab === item.key && "active")}
          >
            <item.icon size={14} /> {t(item.labelKey)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="animate-in animate-delay-1 p-5">
            <h2 className="mb-4 text-[15px] font-extrabold tracking-tight text-text-1">{t("settings.personalData")}</h2>
            <div className="mb-4 flex items-center gap-4">
              {effectiveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveAvatar}
                  alt={effectiveName || "avatar"}
                  className="h-14 w-14 rounded-2xl object-cover ring-1 ring-card-border"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-teal text-[18px] font-extrabold text-white">
                  {(effectiveName || "?").trim()[0].toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[14px] font-extrabold text-text-1">{effectiveName || "—"}</p>
                <p className="text-[12px] text-text-2">{effectiveEmail || "—"}</p>
                <div className="mt-2 flex items-center gap-2">
                  <label className="btn btn-ghost cursor-pointer !px-3 !py-1 text-[12px]">
                    <Upload size={13} /> {t("settings.avatarChange")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarFile(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {effectiveAvatar && (
                    <button
                      type="button"
                      onClick={() => setAvatarDraft(null)}
                      className="btn btn-ghost !px-3 !py-1 text-[12px] !text-neg"
                    >
                      <Trash2 size={13} /> {t("settings.avatarRemove")}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="field-label">{t("settings.name")}</label>
                <input className="field" value={effectiveName} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="field-label">{t("settings.email")}</label>
                <input className="field" value={effectiveEmail} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-3">
              {saveError && <p className="text-[12px] font-semibold text-neg">{saveError}</p>}
              {saved && !saveError && (
                <p className="text-[12px] font-semibold text-pos">{t("settings.saved")}</p>
              )}
              <button
                type="button"
                className="btn btn-primary"
                disabled={!effectiveName.trim() || !effectiveEmail.trim()}
                onClick={() => {
                  setSaveError("");
                  setSaved(false);
                  updateProfile.mutate(
                    {
                      name: effectiveName.trim(),
                      email: effectiveEmail.trim(),
                      locale: lang,
                      timezone: effectiveTimezone,
                      ...(avatarDraft !== undefined ? { avatarUrl: avatarDraft } : {}),
                    },
                    {
                      onSuccess: () => {
                        setSaved(true);
                        window.setTimeout(() => setSaved(false), 3000);
                      },
                      onError: (err) =>
                        setSaveError(err instanceof Error ? err.message : t("settings.saveError")),
                    },
                  );
                }}
              >
                {updateProfile.isPending ? t("settings.saving") : t("settings.save")}
              </button>
            </div>
          </Card>

          <Card className="animate-in animate-delay-2 space-y-4 p-5">
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("settings.account")}</h2>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-card-border p-4">
              <div>
                <p className="text-[13.5px] font-extrabold text-text-1">{t("settings.darkTheme")}</p>
                <p className="mt-0.5 text-[12px] text-text-2">
                  {theme === "dark" ? t("settings.darkThemeOn") : t("settings.darkThemeOff")}
                </p>
              </div>
              <SwitchToggleThemeDemo />
            </div>
            <SettingRow
              label={t("settings.language")}
              hint={t("settings.languageHint")}
              checked={lang === "en"}
              onChange={() => changeLanguage(lang === "en" ? "ru" : "en")}
            />
            <div className="flex items-center justify-between gap-4 rounded-xl border border-card-border p-4">
              <div>
                <p className="text-[13.5px] font-extrabold text-text-1">{t("settings.timezone")}</p>
                <p className="mt-0.5 text-[12px] text-text-2">{timezoneLabel(effectiveTimezone || "UTC")}</p>
              </div>
              <Select
                value={selectTz}
                onValueChange={(v) => {
                  setTimezone(v);
                  updateProfile.mutate({
                    name: effectiveName.trim(),
                    email: effectiveEmail.trim(),
                    locale: lang,
                    timezone: v,
                  });
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder={t("settings.timezone")} />
                </SelectTrigger>
                <SelectContent>
                  {tzOptions.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.value === "UTC" ? tz.label : `${tz.prefix}${tz.label}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SettingRow
              label={t("settings.emailNotif")}
              hint={t("settings.emailNotifHint")}
              checked={prefs?.emailNotif ?? true}
              onChange={(v) => updatePrefs.mutate({ emailNotif: v })}
            />
            <SettingRow
              label={t("settings.pushNotif")}
              hint={t("settings.pushNotifHint")}
              checked={prefs?.pushNotif ?? true}
              onChange={handlePushToggle}
            />
          </Card>

          <Card className="animate-in animate-delay-2 space-y-3 p-5">
            <div>
              <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("settings.socials")}</h2>
              <p className="mt-0.5 text-[12px] text-text-2">{t("settings.socialsHint")}</p>
            </div>
            {SOCIALS.map((s) => (
              <div key={s.key}>
                <label className="field-label">{s.label}</label>
                <input
                  className="field"
                  placeholder={s.label}
                  value={socialValue(s.key)}
                  onChange={(e) =>
                    setSocials((cur) => ({ ...cur, [s.key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="flex items-center justify-end gap-3">
              {socialsError && <p className="text-[12px] font-semibold text-neg">{socialsError}</p>}
              {socialsSaved && !socialsError && (
                <p className="text-[12px] font-semibold text-pos">{t("settings.saved")}</p>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSocialsError("");
                  setSocialsSaved(false);
                  updateProfile.mutate(
                    {
                      instagram: socialValue("instagram").trim() || null,
                      telegram: socialValue("telegram").trim() || null,
                      youtube: socialValue("youtube").trim() || null,
                      tradingview: socialValue("tradingview").trim() || null,
                    },
                    {
                      onSuccess: () => {
                        setSocialsSaved(true);
                        window.setTimeout(() => setSocialsSaved(false), 3000);
                      },
                      onError: (err) =>
                        setSocialsError(err instanceof Error ? err.message : t("settings.saveError")),
                    },
                  );
                }}
              >
                {updateProfile.isPending ? t("settings.saving") : t("settings.save")}
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="animate-in animate-delay-1 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-text-1">
              <KeyRound size={16} className="text-text-2" /> {t("settings.changePassword")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="field-label">{t("settings.currentPassword")}</label>
                <input
                  className="field"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="field-label">{t("settings.newPassword")}</label>
                <input
                  className="field"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-3">
              {pwMsg && (
                <p className={cn("text-[12px] font-semibold", pwMsg.type === "ok" ? "text-pos" : "text-neg")}>
                  {pwMsg.text}
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary"
                disabled={pwBusy || !currentPassword || newPassword.length < 8}
                onClick={changePassword}
              >
                {pwBusy ? "…" : t("settings.updatePassword")}
              </button>
            </div>
          </Card>

          <Card className="animate-in animate-delay-2 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-text-1">
                  <Smartphone size={16} className="text-text-2" /> {t("settings.twoFactor")}
                </h2>
                <p className="mt-1 text-[12.5px] text-text-2">{t("settings.twoFactorDesc")}</p>
              </div>
              <Toggle
                checked={Boolean(profileData?.twoFactorEnabled)}
                onChange={handleTwoFactorToggle}
                label="2FA"
              />
            </div>

            {twoFaMsg && (
              <p
                className={cn(
                  "mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold",
                  twoFaMsg.type === "ok" ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg",
                )}
              >
                {twoFaMsg.text}
              </p>
            )}

            {(twoFaState === "enable-code" || twoFaState === "disable-code") && (
              <div className="mt-4 space-y-3 rounded-2xl bg-bg-2/60 p-4">
                <p className="text-[13px] font-semibold text-text-1">
                  {twoFaState === "enable-code"
                    ? t("settings.twoFactorEnableStep")
                    : t("settings.twoFactorDisableStep")}
                </p>
                {twoFaDevCode && (
                  <p className="rounded-xl bg-teal/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-teal">
                    {t("settings.devCode")} <span className="font-mono tracking-widest">{twoFaDevCode}</span>
                  </p>
                )}
                <input
                  className="field text-center font-mono text-[16px] tracking-[0.35em]"
                  placeholder="••••••"
                  value={twoFaCode}
                  onChange={(e) => setTwoFaCode(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className="btn btn-ghost !py-1.5 text-[12.5px]" onClick={cancelTwoFactor}>
                    {t("settings.cancel")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary !py-1.5 text-[12.5px]"
                    disabled={twoFaCode.length < 6}
                    onClick={confirmTwoFactor}
                  >
                    {t("settings.confirmCode")}
                  </button>
                </div>
              </div>
            )}

            {twoFaState === "backup" && backupCodes && (
              <div className="mt-4 space-y-3 rounded-2xl bg-bg-2/60 p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-pos">
                  <CheckCircle2 size={15} /> {t("settings.twoFactorEnabled")}
                </p>
                <p className="flex items-start gap-2 text-[12.5px] text-text-2">
                  <ShieldAlert size={15} className="mt-0.5 shrink-0 text-warn" />
                  {t("settings.backupCodesHint")}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((c) => (
                    <span key={c} className="rounded-lg bg-bg-1 px-2.5 py-1.5 text-center font-mono text-[12px] font-semibold tracking-wider text-text-1">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className="btn btn-ghost !py-1.5 text-[12.5px]" onClick={copyBackupCodes}>
                    {backupCopied ? <CheckCircle2 size={14} className="text-pos" /> : <Copy size={14} />}
                    {backupCopied ? t("settings.copied") : t("settings.copyCodes")}
                  </button>
                  <button type="button" className="btn btn-primary !py-1.5 text-[12.5px]" onClick={cancelTwoFactor}>
                    {t("settings.done")}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "devices" && (
        <Card className="animate-in animate-delay-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[15px] font-extrabold tracking-tight text-text-1">
                <MonitorSmartphone size={16} className="text-text-2" /> {t("settings.devices")}
              </h2>
              <p className="mt-1 text-[12.5px] text-text-2">{t("settings.devicesDesc")}</p>
            </div>
            <button
              type="button"
              className="btn btn-ghost !px-3 !py-1 text-[12px]"
              disabled={revokeOthers.isPending || !(sessionsData ?? []).some((s) => !s.current)}
              onClick={() => revokeOthers.mutate()}
            >
              <LogOut size={13} /> {t("settings.revokeAll")}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {sessionsData?.length ? (
              sessionsData.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-3 py-2.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card shadow-card">
                    <MonitorSmartphone size={17} className="text-text-2" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-bold text-text-1">{s.deviceName}</span>
                      {s.current && (
                        <span className="chip !py-0.5 !text-[10px]">{t("settings.currentDevice")}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-text-2">
                      {s.current ? t("settings.activeNow") : lastActiveLabel(s.lastActiveAt)}
                      {s.ip ? ` · ${s.ip}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost !h-8 !w-8 shrink-0 !p-0 !text-neg"
                    aria-label={t("settings.revokeDevice")}
                    title={t("settings.revokeDevice")}
                    disabled={revokeSession.isPending}
                    onClick={() => handleRevokeSession(s)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-text-2">{t("settings.devicesEmpty")}</p>
            )}
          </div>
        </Card>
      )}

      {tab === "notifications" && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="animate-in animate-delay-1 space-y-4 p-5">
            <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("settings.notificationsTitle")}</h2>
            <SettingRow
              label={t("settings.emailNotif")}
              hint={t("settings.emailNotifHint")}
              checked={prefs?.emailNotif ?? true}
              onChange={(v) => updatePrefs.mutate({ emailNotif: v })}
            />
            <SettingRow
              label={t("settings.ideaAlerts")}
              hint={t("settings.ideaAlertsHint")}
              checked={prefs?.ideaAlerts ?? true}
              onChange={(v) => updatePrefs.mutate({ ideaAlerts: v })}
            />
            <SettingRow
              label={t("settings.weeklyDigest")}
              hint={t("settings.weeklyDigestHint")}
              checked={prefs?.weeklyDigest ?? false}
              onChange={(v) => updatePrefs.mutate({ weeklyDigest: v })}
            />
          </Card>

          <Card className="animate-in animate-delay-2 space-y-4 p-5">
            <div>
              <h2 className="text-[15px] font-extrabold tracking-tight text-text-1">{t("settings.pushNotif")}</h2>
              <p className="mt-0.5 text-[12px] text-text-2">{t("settings.pushNotifHint")}</p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-card-border p-4">
              <div>
                <p className="text-[13.5px] font-extrabold text-text-1">{t("notif.device")}</p>
                <p className="mt-0.5 text-[12px] text-text-2">
                  {permission === "denied"
                    ? t("notif.permissionDenied")
                    : prefs?.subscribed
                      ? t("notif.subscribed")
                      : t("notif.notSubscribed")}
                </p>
              </div>
              <Toggle
                checked={Boolean(prefs?.pushNotif)}
                onChange={handlePushToggle}
                label={t("settings.pushNotif")}
              />
            </div>

            {pushError && (
              <p className="rounded-xl bg-neg/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-neg">{pushError}</p>
            )}
            {pushTestSent && (
              <p className="rounded-xl bg-pos/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-pos">{t("notif.testSent")}</p>
            )}

            <div className="flex items-center justify-end">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!prefs?.subscribed || permission !== "granted"}
                onClick={sendTest}
              >
                <Bell size={14} /> {t("notif.test")}
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === "card" && <ProfileCard />}

      {tab === "metrics" && <MetricsEditor />}
    </div>
  );
}

function SettingRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-card-border p-4">
      <div>
        <p className="text-[13.5px] font-extrabold text-text-1">{label}</p>
        <p className="mt-0.5 text-[12px] text-text-2">{hint}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
