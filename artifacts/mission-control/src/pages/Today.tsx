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
  ChevronRight, Plus, Clock, AlertTriangle, Check,
  Calendar, FolderKanban, ArrowRight, Circle,
} from "lucide-react";
import { format, isToday, isPast, parseISO, isWithinInterval, addDays } from "date-fns";

const TODAY = format(new Date(), "yyyy-MM-dd");

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function taskDueStatus(task: Task): "overdue" | "today" | "soon" | "none" {
  if (!task.dueDate || task.status === "completed" || task.status === "cancelled") return "none";
  const d = parseISO(task.dueDate);
  if (isPast(d) && !isToday(d)) return "overdue";
  if (isToday(d)) return "today";
  if (isWithinInterval(d, { start: new Date(), end: addDays(new Date(), 3) })) return "soon";
  return "none";
}

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

  const activeProjects = (projects ?? []).filter(p => p.status === "active");
  const blockedProjects = (projects ?? []).filter(p => p.status === "blocked");

  const activeTasks = (tasks ?? []).filter(t => t.status !== "completed" && t.status !== "cancelled");

  const overdueTasks = activeTasks
    .filter(t => taskDueStatus(t) === "overdue")
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const todayTasks = activeTasks
    .filter(t => taskDueStatus(t) === "today")
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const topPriorities = activeTasks
    .filter(t => (t.priority === "critical" || t.priority === "high") && taskDueStatus(t) === "none")
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
    .slice(0, 5);

  const todayEvents = (events ?? [])
    .filter(e => e.date === TODAY)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

  const upcomingEvents = (events ?? [])
    .filter(e => e.date > TODAY)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? ""))
    .slice(0, 3);

  function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!captureInput.trim()) return;
    if (captureMode === "task") {
      createTask({ data: { title: captureInput.trim(), priority: "medium" } });
    } else {
      captureInbox({ data: { content: captureInput.trim() } });
    }
    setCaptureInput("");
  }

  function toggleTask(task: Task) {
    updateTask({ id: task.id, data: { status: task.status === "completed" ? "pending" : "completed" } });
  }

  const dayName = format(new Date(), "EEEE");
  const dateStr = format(new Date(), "MMMM d, yyyy");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground">{dayName}</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          {overdueTasks.length > 0 && (
            <span className="text-red-400">{overdueTasks.length} overdue</span>
          )}
          {todayTasks.length > 0 && (
            <span className="text-yellow-400">{todayTasks.length} due today</span>
          )}
          {activeProjects.length > 0 && (
            <span className="text-emerald-400">{activeProjects.length} active</span>
          )}
        </div>
      </div>

      {/* Quick Capture */}
      <form onSubmit={handleCapture} className="flex items-stretch gap-0 border border-border rounded overflow-hidden focus-within:border-primary/50 transition-colors">
        <div className="flex border-r border-border shrink-0">
          <button
            type="button"
            onClick={() => setCaptureMode("task")}
            className={cn("px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors", captureMode === "task" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground")}
          >Task</button>
          <button
            type="button"
            onClick={() => setCaptureMode("note")}
            className={cn("px-3 py-2.5 text-[10px] font-mono uppercase tracking-wider transition-colors border-l border-border", captureMode === "note" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground")}
          >Note</button>
        </div>
        <input
          ref={inputRef}
          value={captureInput}
          onChange={e => setCaptureInput(e.target.value)}
          placeholder={captureMode === "task" ? "Add a task..." : "Capture a thought..."}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!captureInput.trim() || creatingTask || capturingInbox}
          className="px-4 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      <div className="grid grid-cols-5 gap-8">
        {/* Left column — 3/5 */}
        <div className="col-span-3 space-y-8">

          {/* Active Projects */}
          {(activeProjects.length > 0 || blockedProjects.length > 0) && (
            <section>
              <SectionHeader label="Active Projects" href="/projects" count={activeProjects.length} />
              <div className="grid grid-cols-2 gap-2 mt-3">
                {activeProjects.slice(0, 4).map(p => <ProjectCard key={p.id} project={p} />)}
                {blockedProjects.slice(0, 2).map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            </section>
          )}

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <section>
              <SectionHeader label="Overdue" danger count={overdueTasks.length} />
              <div className="space-y-1 mt-3">
                {overdueTasks.slice(0, 6).map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} />)}
              </div>
            </section>
          )}

          {/* Due Today */}
          {todayTasks.length > 0 && (
            <section>
              <SectionHeader label="Due Today" warn count={todayTasks.length} />
              <div className="space-y-1 mt-3">
                {todayTasks.map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} />)}
              </div>
            </section>
          )}

          {/* Top Priorities */}
          {topPriorities.length > 0 && (
            <section>
              <SectionHeader label="Top Priorities" href="/tasks" count={topPriorities.length} />
              <div className="space-y-1 mt-3">
                {topPriorities.map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} />)}
              </div>
            </section>
          )}

          {overdueTasks.length === 0 && todayTasks.length === 0 && topPriorities.length === 0 && activeProjects.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-xs font-mono text-muted-foreground">Clear board. Add something above.</p>
            </div>
          )}
        </div>

        {/* Right column — 2/5 */}
        <div className="col-span-2 space-y-8">
          {/* Today's Schedule */}
          <section>
            <SectionHeader label="Today" href="/calendar" />
            {todayEvents.length === 0 ? (
              <div className="mt-3 text-xs font-mono text-muted-foreground/50">No events scheduled.</div>
            ) : (
              <div className="space-y-1 mt-3">
                {todayEvents.map(e => <EventRow key={e.id} event={e} />)}
              </div>
            )}
          </section>

          {/* Upcoming */}
          {upcomingEvents.length > 0 && (
            <section>
              <SectionHeader label="Coming Up" href="/calendar" />
              <div className="space-y-1 mt-3">
                {upcomingEvents.map(e => <EventRow key={e.id} event={e} showDate />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, href, count, danger, warn }: { label: string; href?: string; count?: number; danger?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("text-[10px] font-mono uppercase tracking-widest", danger ? "text-red-400" : warn ? "text-yellow-400" : "text-muted-foreground")}>
        {label}
        {count !== undefined && <span className="ml-1.5 opacity-50">{count}</span>}
      </span>
      <div className="flex-1 h-px bg-border/50" />
      {href && (
        <Link href={href} className="text-[10px] font-mono text-muted-foreground/40 hover:text-primary transition-colors flex items-center gap-0.5">
          All <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      )}
    </div>
  );
}

const STATUS_CONFIG: Record<string, { dot: string; border: string }> = {
  active:  { dot: "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.7)]", border: "border-l-emerald-500/60" },
  blocked: { dot: "bg-red-400 shadow-[0_0_5px_rgba(239,68,68,0.7)]",      border: "border-l-red-500/60" },
  planned: { dot: "bg-sky-400",    border: "border-l-sky-500/40" },
  on_hold: { dot: "bg-zinc-500",   border: "border-l-zinc-600" },
  done:    { dot: "bg-zinc-600",   border: "border-l-zinc-700" },
};

function ProjectCard({ project }: { project: Project }) {
  const cfg = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.planned;
  return (
    <Link href={`/projects/${project.id}`}>
      <div className={cn("border border-border border-l-2 rounded px-3 py-2.5 bg-card/40 hover:bg-card/70 transition-colors cursor-pointer", cfg.border)}>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-foreground leading-snug">{project.name}</span>
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1", cfg.dot)} />
        </div>
        {project.nextStep && (
          <p className="text-[10px] font-mono text-primary/70 mt-1.5 flex items-center gap-1 leading-tight">
            <ChevronRight className="w-2.5 h-2.5 shrink-0" />
            <span className="line-clamp-1">{project.nextStep}</span>
          </p>
        )}
        {project.status === "blocked" && (
          <p className="text-[10px] font-mono text-red-400/80 mt-1">⚠ Blocked</p>
        )}
      </div>
    </Link>
  );
}

const PRIORITY_COLOR: Record<string, string> = {
  critical: "text-red-400",
  high: "text-orange-400",
  medium: "text-muted-foreground",
  low: "text-muted-foreground/50",
};

function TaskRow({ task, onToggle }: { task: Task; onToggle: (t: Task) => void }) {
  const dueStatus = taskDueStatus(task);
  const isCompleted = task.status === "completed";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded group hover:bg-white/3 transition-colors cursor-pointer",
        isCompleted && "opacity-40"
      )}
      onClick={() => onToggle(task)}
    >
      <div className={cn(
        "w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors",
        isCompleted ? "bg-primary/20 border-primary/40" : "border-border group-hover:border-primary/40"
      )}>
        {isCompleted && <Check className="w-2.5 h-2.5 text-primary" />}
      </div>
      <span className={cn("text-xs font-mono flex-1 min-w-0 truncate", isCompleted && "line-through", PRIORITY_COLOR[task.priority])}>
        {task.title}
      </span>
      {task.dueDate && dueStatus !== "none" && (
        <span className={cn("text-[10px] font-mono shrink-0 flex items-center gap-1",
          dueStatus === "overdue" ? "text-red-400" : dueStatus === "today" ? "text-yellow-400" : "text-zinc-500"
        )}>
          <Clock className="w-2.5 h-2.5" />
          {dueStatus === "overdue" ? "Overdue" : dueStatus === "today" ? "Today" : format(parseISO(task.dueDate), "MMM d")}
        </span>
      )}
    </div>
  );
}

function EventRow({ event, showDate }: { event: CalendarEvent; showDate?: boolean }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2 rounded hover:bg-white/3 transition-colors">
      <div className="flex flex-col items-center shrink-0 mt-0.5">
        <Calendar className="w-3 h-3 text-primary/50" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono text-foreground truncate">{event.title}</div>
        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
          {showDate && <span className="mr-2">{format(parseISO(event.date), "EEE MMM d")}</span>}
          {event.startTime && <span>{event.startTime}{event.endTime && ` – ${event.endTime}`}</span>}
          {event.location && <span className="ml-2 opacity-60">{event.location}</span>}
        </div>
      </div>
    </div>
  );
}
