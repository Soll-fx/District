"use client";

import { GraduationCap, PlayCircle, Lock, Clock, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { useCourses } from "@/hooks/use-education";
import { useLang } from "@/lib/i18n";

export default function EducationPage() {
  const { data: courses } = useCourses();
  const { t } = useLang();
  const COURSES = courses ?? [];
  const doneTotal = COURSES.reduce((s, c) => s + c.done, 0);
  const lessonsTotal = COURSES.reduce((s, c) => s + c.lessons, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("page.education.t")}
        subtitle={t("page.education.s")}
        actions={
          <div className="flex items-center gap-2">
            <span className="pill pill-violet">
              {doneTotal} / {lessonsTotal} {t("education.lessons")}
            </span>
          </div>
        }
      />

      <Card className="hero-card animate-in flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
            <GraduationCap size={24} />
          </span>
          <div>
            <p className="text-[17px] font-extrabold tracking-tight text-white">{t("education.continueTitle")}</p>
            <p className="mt-0.5 text-[12.5px] text-white/60">{t("education.continueSub")}</p>
          </div>
        </div>
        <button type="button" className="btn bg-white text-[#12182B] hover:bg-white/90">
          <PlayCircle size={16} /> {t("education.continue")}
        </button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((c) => {
          const progress = c.lessons ? Math.round((c.done / c.lessons) * 100) : 0;
          return (
          <Card key={c.id} className={cn("animate-in p-4", !c.locked && "card-hover")} hover={!c.locked}>
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: c.color }}>
                <BarChart3 size={18} />
              </span>
              {c.locked ? (
                <span className="pill pill-neutral">
                  <Lock size={11} /> paywall
                </span>
              ) : progress === 100 ? (
                <span className="pill pill-pos">{t("education.completed")}</span>
              ) : (
                <span className="pill pill-teal">{t("education.available")}</span>
              )}
            </div>

            <p className="mt-3 text-[14px] font-extrabold leading-snug text-text-1">{c.title}</p>
            <p className="mt-0.5 text-[11.5px] font-bold uppercase tracking-wide text-text-3">{c.tag}</p>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-semibold">
                <span className="text-text-2">
                  {c.done} {t("education.of")} {c.lessons} {t("education.lessons")}
                </span>
                <span className="num text-text-1">{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-neutral/6">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, background: c.color }}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-card-border pt-3">
              <span className="flex items-center gap-1 text-[11.5px] font-semibold text-text-3">
                <Clock size={12} /> {c.time}
              </span>
              <button
                type="button"
                className={cn("btn !px-3 !py-1.5 text-[12px]", c.locked ? "btn-ghost" : "btn-primary")}
                disabled={c.locked}
              >
                {c.locked ? <Lock size={12} /> : progress === 100 ? t("education.repeat") : t("education.start")}
              </button>
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}
