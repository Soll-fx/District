"use client";

import { SunIcon, MoonIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEMES, useTheme, type AppTheme } from "@/hooks/use-theme";

const OPTIONS: { key: AppTheme; icon: typeof SunIcon; label: string }[] = [
  { key: "light", icon: SunIcon, label: "Light" },
  { key: "dark", icon: MoonIcon, label: "Dark" },
  { key: "neumorph", icon: Sparkles, label: "Soft" },
];

const SwitchToggleThemeDemo = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="pill-control" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={theme === key}
          title={label}
          onClick={() => setTheme(key)}
          className={cn(
            "flex items-center gap-1.5",
            theme === key && "active",
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default SwitchToggleThemeDemo;