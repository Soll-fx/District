import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  sub,
  tone = "default",
  icon,
  className,
  animate,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "default" | "pos" | "neg" | "hero";
  icon?: React.ReactNode;
  className?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={cn(
        "card relative overflow-hidden p-4 sm:p-5",
        tone === "hero" && "hero-card",
        animate && "animate-in",
        className,
      )}
    >
      {icon && <div className="mb-3">{icon}</div>}
      <p
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.08em]",
          tone === "hero" ? "text-white/60" : "text-text-3",
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "num mt-1 text-[22px] font-bold leading-none tracking-tight",
          tone === "hero" ? "text-white" : "text-text-1",
        )}
      >
        {value}
      </div>
      {sub && (
        <div
          className={cn("mt-1.5 text-[12px] font-semibold", tone === "hero" ? "text-white/70" : "text-text-2")}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
