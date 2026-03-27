import React, { useState, useRef } from "react";
import { Link } from "wouter";
import {
  useGetProjects,
  useGetTasks,
  useGetEvents,
  useCreateTask,
  useCreateInboxItem,
  useUpdateTask,
} from "@workspace/api-client-react";
import type { Task, Project, CalendarEvent } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  ChevronRight, Plus, Clock, Check, ArrowRight,
  AlertTriangle, MapPin,
} from "lucide-react";
import {
  format, isToday, isPast, parseISO,
  differenceInCalendarDays, isWithinInterval, addDays,
} from "date-fns";

const TODAY = format(new Date(), "yyyy-MM-dd");
const P_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type DueFlag = "overdue" | "today" | "soon" | "none";

function dueFlag(task: Task): DueFlag {
  if (!task.dueDate || task.status === "completed" || task.status === "cancelled") return "none";
  const d = parseISO(task.dueDate);
  if (isPast(d) && !isToday(d)) return "overdue";
  if (isToday(d)) return "today";
  if (isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 3) })) return "soon";
  return "none";
}

function taskUrgencyScore(task: Task): number {
  const flag = dueFlag(task);
  if (flag === "overdue") {
    const days = differenceInCalendarDays(new Date(), parseISO(task.dueDate!));
    return -(1000 + days * 10 + (P_ORDER[task.priority] ?? 9));
  }
  if (flag === "today") return -(500 + (P_ORDER[task.priority] ?? 9));
  return -(P_ORDER[task.priority] ?? 9);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Today() {
  const { data: projects } = useGetProjects({ query: { refetchInterval: 15000 } });
  const { data: tasks } = useGetTasks({ query: { refetchInterval: 15000 } });
  const { data: events } = useGetEvents({ query: { refetchInterval: 30000 } });
  const { mutate: createTask, isPending: creatingTask } = useCreateTask();
  const { mutate: captureInbox, isPending: capturingInbox } = useCreateInboxItem();
  const { mutate: updateTask } = useUpdateTask();

  const [captureInput, setCaptureInput] = useState("");
  const [captureMode, setCaptureMode] = useState<"task" | "note">("task");
  const inputRef = useRef<HTMLInputElement>(null);

  // projects
  const activeProjects = (projects ?? [])
    .filter(p => p.status === "active" || p.status === "blocked")
    .sort((a, b) => {
      if (a.status === "blocked" && b.status !== "blocked") return -1;
      if (b.status === "blocked" && a.status !== "blocked") return 1;
      return (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9);
    });

  // tasks — unified "needs action" list
  const activeTasks = (tasks ?? []).filter(t => t.status !== "completed" && t.status !== "cancelled");

  const needsActionTasks = activeTasks
    .filter(t => {
      const f = dueFlag(t);
      return f === "overdue" || f === "today" || t.priority === "critical" || t.priority === "high";
    })
    .sort((a, b) => taskUrgencyScore(b) - taskUrgencyScore(a))
    .slice(0, 8);

  // events
  const todayEvents = (events ?? [])
    .filter(e => e.date === TODAY)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

  const upcomingEvents = (events ?? [])
    .filter(e => e.date > TODAY)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? ""))
    .slice(0, 4);

  // stats for header
  const overdueCount = activeTasks.filter(t => dueFlag(t) === "overdue").length;
  const dueTodayCount = activeTasks.filter(t => dueFlag(t) === "today").length;
  const blockedCount = (projects ?? []).filter(p => p.status === "blocked").length;

  function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!captureInput.trim()) return;
    if (captureMode === "task") {
      createTask({ data: { title: captureInput.trim(), priority: "medium" } });
    } else {
      captureInbox({ data: { content: captureInput.trim() } });
    }
    setCaptureInput("");
    inputRef.current?.focus();
  }

  function toggleTask(task: Task) {
    updateTask({ id: task.id, data: { status: task.status === "completed" ? "pending" : "completed" } });
  }

  return (
    <div className="space-y-0">

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-6 border-b border-border/40">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">
            {format(new Date(), "EEEE")}
          </span>
          <span className="text-xs font-mono text-muted-foreground/60">
            {format(new Date(), "MMMM d, yyyy")}
          </span>
        </div>

        <div className="flex items-center gap-5 text-[10px] font-mono">
          {overdueCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              {overdueCount} past due
            </span>
          )}
          {dueTodayCount > 0 && (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
              {dueTodayCount} due today
            </span>
          )}
          {blockedCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-400/70">
              <AlertTriangle className="w-3 h-3" />
              {blockedCount} blocked
            </span>
          )}
          {overdueCount === 0 && dueTodayCount === 0 && blockedCount === 0 && (
            <span className="text-emerald-400/60">All clear</span>
          )}
        </div>
      </div>

      {/* ── ACTIVE PROJECTS ─────────────────────────────────────────── */}
      {activeProjects.length > 0 && (
        <section className="pt-6 pb-7">
          <div className="flex items-center justify-between mb-4">
            <Label text="Active" />
            <Link href="/projects" className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1">
              All projects <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>

          <div className="space-y-px">
            {activeProjects.map(p => <ProjectRow key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {/* ── DIVIDER ─────────────────────────────────────────────────── */}
      <div className="border-t border-border/40" />

      {/* ── LOWER GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-10 pt-6">

        {/* Left 3/5 — action items */}
        <div className="col-span-3 space-y-7">

          {/* Needs action */}
          {needsActionTasks.length > 0 ? (
            <section>
              <div className="flex items-center justify-between mb-3">
                <Label text="Needs action" />
                <Link href="/tasks" className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1">
                  All tasks <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="space-y-0.5">
                {needsActionTasks.map(t => <ActionTaskRow key={t.id} task={t} onToggle={toggleTask} />)}
              </div>
            </section>
          ) : (
            <div className="py-10 text-center">
              <p className="text-xs font-mono text-muted-foreground/30">Nothing urgent. Board is clear.</p>
            </div>
          )}
        </div>

        {/* Right 2/5 — schedule + capture */}
        <div className="col-span-2 space-y-7">

          {/* Schedule */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <Label text="Today's schedule" />
              <Link href="/calendar" className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-1">
                Calendar <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-[11px] font-mono text-muted-foreground/30 py-1">No events today.</p>
            ) : (
              <div className="space-y-1">
                {todayEvents.map(e => <ScheduleRow key={e.id} event={e} />)}
              </div>
            )}
          </section>

          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <section>
              <div className="mb-3">
                <Label text="Upcoming" />
              </div>
              <div className="space-y-1">
                {upcomingEvents.map(e => <ScheduleRow key={e.id} event={e} showDate />)}
              </div>
            </section>
          )}

          {/* Quick capture */}
          <section>
            <div className="mb-3">
              <Label text="Capture" />
            </div>
            <form onSubmit={handleCapture} className="space-y-2">
              <div className="flex border border-border/60 rounded overflow-hidden focus-within:border-primary/40 transition-colors">
                <input
                  ref={inputRef}
                  value={captureInput}
                  onChange={e => setCaptureInput(e.target.value)}
                  placeholder={captureMode === "task" ? "Add a task..." : "Drop a note..."}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!captureInput.trim() || creatingTask || capturingInbox}
                  className="px-3 text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 border-l border-border/60"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                {(["task", "note"] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCaptureMode(m)}
                    className={cn(
                      "text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded transition-colors",
                      captureMode === m
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground/40 hover:text-muted-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

// ─── Section label ──────────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
      {text}
    </span>
  );
}

// ─── Project row ────────────────────────────────────────────────────────────

const DOT: Record<string, string> = {
  active:  "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]",
  blocked: "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.9)]",
};

const ROW_BG: Record<string, string> = {
  active:  "hover:bg-white/[0.025]",
  blocked: "bg-red-950/20 border-l-2 border-l-red-500/40 hover:bg-red-950/30",
};

const PRI_BADGE: Record<string, string> = {
  critical: "text-red-400 border-red-400/40",
  high:     "text-orange-400 border-orange-400/40",
  medium:   "text-zinc-500 border-zinc-700",
  low:      "text-zinc-600 border-zinc-800",
};

function ProjectRow({ project }: { project: Project }) {
  const dot = DOT[project.status] ?? "bg-zinc-500";
  const rowBg = ROW_BG[project.status] ?? "hover:bg-white/[0.025]";
  const pri = PRI_BADGE[project.priority] ?? PRI_BADGE.medium;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className={cn("group flex items-center gap-4 px-3 py-3 rounded cursor-pointer transition-colors", rowBg)}>
        {/* Dot */}
        <span className={cn("w-2 h-2 rounded-full shrink-0", dot)} />

        {/* Name */}
        <span className="text-sm font-mono font-medium text-foreground min-w-0 truncate flex-none w-56">
          {project.name}
        </span>

        {/* Owner */}
        {project.owner && (
          <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">{project.owner}</span>
        )}

        {/* Priority badge */}
        <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 hidden sm:block", pri)}>
          {project.priority === "critical" ? "CRIT" : project.priority === "high" ? "HIGH" : project.priority === "medium" ? "MED" : "LOW"}
        </span>

        {/* Next step — takes remaining space */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 ml-1">
          {project.status === "blocked" ? (
            <span className="text-[10px] font-mono text-red-400/80 flex items-center gap-1 truncate">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">{project.nextStep ?? "Blocked — needs attention"}</span>
            </span>
          ) : project.nextStep ? (
            <span className="text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1 truncate">
              <ChevronRight className="w-3 h-3 shrink-0 text-primary/40" />
              <span className="truncate">{project.nextStep}</span>
            </span>
          ) : null}
        </div>

        {/* Arrow on hover */}
        <ArrowRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-primary/40 shrink-0 transition-colors" />
      </div>
    </Link>
  );
}

// ─── Action task row ─────────────────────────────────────────────────────────

function ActionTaskRow({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  const flag = dueFlag(task);
  const isCompleted = task.status === "completed";

  const urgencyTag = (() => {
    if (flag === "overdue") {
      const days = differenceInCalendarDays(new Date(), parseISO(task.dueDate!));
      return { label: days === 1 ? "1d overdue" : `${days}d overdue`, cls: "text-red-400 border-red-400/30 bg-red-400/5" };
    }
    if (flag === "today") return { label: "due today", cls: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5" };
    if (task.priority === "critical") return { label: "critical", cls: "text-red-400 border-red-400/30 bg-red-400/5" };
    if (task.priority === "high") return { label: "high", cls: "text-orange-400 border-orange-400/30 bg-orange-400/5" };
    return null;
  })();

  return (
    <div
      onClick={() => onToggle(task)}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded group cursor-pointer transition-colors",
        flag === "overdue" ? "hover:bg-red-950/20" : "hover:bg-white/[0.025]",
        isCompleted && "opacity-40"
      )}
    >
      {/* Checkbox */}
      <div className={cn(
        "w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors",
        isCompleted ? "bg-primary/20 border-primary/40" : "border-border/60 group-hover:border-primary/40"
      )}>
        {isCompleted && <Check className="w-2.5 h-2.5 text-primary" />}
      </div>

      {/* Title */}
      <span className={cn(
        "text-sm font-mono flex-1 min-w-0 truncate",
        isCompleted ? "line-through text-muted-foreground/40" : "text-foreground/80"
      )}>
        {task.title}
      </span>

      {/* Urgency tag */}
      {urgencyTag && !isCompleted && (
        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0", urgencyTag.cls)}>
          {urgencyTag.label}
        </span>
      )}
    </div>
  );
}

// ─── Schedule row ────────────────────────────────────────────────────────────

function ScheduleRow({ event, showDate }: { event: CalendarEvent; showDate?: boolean }) {
  const now = new Date();
  const isNow = event.startTime && event.endTime && event.date === TODAY &&
    event.startTime <= format(now, "HH:mm") && event.endTime >= format(now, "HH:mm");

  return (
    <div className={cn(
      "flex items-start gap-3 px-3 py-2 rounded transition-colors",
      isNow ? "bg-primary/5 border border-primary/20" : "hover:bg-white/[0.025]"
    )}>
      {/* Time */}
      <div className="shrink-0 text-right w-16">
        {showDate ? (
          <span className="text-[10px] font-mono text-muted-foreground/50">
            {format(parseISO(event.date), "EEE d")}
          </span>
        ) : event.startTime ? (
          <span className={cn("text-[10px] font-mono", isNow ? "text-primary" : "text-muted-foreground/50")}>
            {event.startTime}
          </span>
        ) : null}
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <div className={cn("text-xs font-mono truncate", isNow ? "text-foreground" : "text-foreground/70")}>
          {event.title}
          {isNow && <span className="ml-2 text-[9px] text-primary/70 font-mono uppercase tracking-wider">now</span>}
        </div>
        {event.location && (
          <div className="text-[10px] font-mono text-muted-foreground/40 flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5" />{event.location}
          </div>
        )}
      </div>
    </div>
  );
}
