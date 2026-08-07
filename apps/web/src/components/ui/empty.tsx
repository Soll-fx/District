import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg text-text-3">
        {icon}
      </div>
      <p className="text-[15px] font-extrabold tracking-tight text-text-1">{title}</p>
      {description && <p className="mt-1.5 max-w-[340px] text-[13px] leading-relaxed text-text-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
