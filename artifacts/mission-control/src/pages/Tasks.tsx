import React, { useState, useRef } from "react";
import {
  useGetTasks, useGetProjects,
  useCreateTask, useUpdateTask, useDeleteTask,
} from "@workspace/api-client-react";
import type { Task, Project } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  Plus, Check, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, Clock, X,
} from "lucide-react";
import {
  format, isToday, isPast, parseISO,
  differenceInCalendarDays,
} from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = format(new Date(), "yyyy-MM-dd");
const P_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type StatusKey = "pending" | "in_progress" | "completed" | "failed" | "cancelled";
type Filter = "all" | "today" | "in_progress" | "overdue";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dueCategory(t: Task): "overdue" | "today" | "none" {
  if (!t.dueDate || t.status === "completed" || t.status === "cancelled") return "none";
  const d = parseISO(t.dueDate);
  if (isPast(d) && !isToday(d)) return "overdue";
  if (isToday(d)) return "today";
  return "none";
}

function taskGroup(t: Task): "overdue" | "today" | "in_progress" | "next" | "done" | "other" {
  if (t.status === "completed" || t.status === "cancelled") return "done";
  const cat = dueCategory(t);
  if (cat === "overdue") return "overdue";
  if (cat === "today") return "today";
  if (t.status === "in_progress") return "in_progress";
  if (t.status === "pending") return "next";
  return "other";
}

const PRI: Record<string, { label: string; cls: string; rowCls?: string }> = {
  critical: { label: "P1", cls: "text-red-400 border-red-400/40 bg-red-400/5", rowCls: "border-l-red-500/40" },
  high:     { label: "P2", cls: "text-orange-400 border-orange-400/40 bg-orange-400/5" },
  medium:   { label: "P3", cls: "text-zinc-500 border-zinc-700/60 bg-zinc-800/20" },
  low:      { label: "P4", cls: "text-zinc-600 border-zinc-800 bg-transparent" },
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Next",
  in_progress: "In Progress",
  completed: "Done",
  cancelled: "Cancelled",
  failed: "Failed",
};

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task, project, onToggle, onStatus, onDelete,
}: {
  task: Task;
  project?: Project;
  onToggle: (t: Task) => void;
  onStatus: (t: Task, s: StatusKey) => void;
  onDelete: (id: number) => void;
}) {
  const group = taskGroup(task);
  const isCompleted = task.status === "completed" || task.status === "cancelled";
  const pri = PRI[task.priority] ?? PRI.medium;
  const dueCat = dueCategory(task);

  const overdueDays = task.dueDate && dueCat === "overdue"
    ? differenceInCalendarDays(new Date(), parseISO(task.dueDate))
    : 0;

  const dueLabel = (() => {
    if (!task.dueDate || isCompleted) return null;
    if (dueCat === "overdue") return { text: `${overdueDays}d overdue`, cls: "text-red-400" };
    if (dueCat === "today") return { text: "today", cls: "text-yellow-400" };
    return { text: format(parseISO(task.dueDate), "MMM d"), cls: "text-zinc-500" };
  })();

  function cycleStatus() {
    if (task.status === "pending") onStatus(task, "in_progress");
    else if (task.status === "in_progress") onStatus(task, "pending");
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded transition-colors",
        group === "overdue" ? "hover:bg-red-950/20" : "hover:bg-white/[0.025]",
        isCompleted && "opacity-40"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        className={cn(
          "w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
          isCompleted
            ? "bg-primary/15 border-primary/30"
            : group === "overdue"
            ? "border-red-500/40 hover:border-red-400"
            : "border-border/60 hover:border-primary/40"
        )}
      >
        {isCompleted && <Check className="w-2.5 h-2.5 text-primary" />}
      </button>

      {/* Title */}
      <span className={cn(
        "text-sm font-mono flex-1 min-w-0 truncate",
        isCompleted ? "line-through text-muted-foreground/40" : "text-foreground/85"
      )}>
        {task.title}
      </span>

      {/* Priority badge */}
      {task.priority !== "low" && !isCompleted && (
        <span className={cn("text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0", pri.cls)}>
          {pri.label}
        </span>
      )}

      {/* Project tag */}
      {project && !isCompleted && (
        <span className="text-[10px] font-mono text-primary/50 bg-primary/5 border border-primary/15 px-1.5 py-0.5 rounded shrink-0 max-w-[120px] truncate hidden sm:block">
          {project.name}
        </span>
      )}

      {/* Due date */}
      {dueLabel && (
        <span className={cn("text-[10px] font-mono flex items-center gap-1 shrink-0", dueLabel.cls)}>
          <Clock className="w-2.5 h-2.5" />
          {dueLabel.text}
        </span>
      )}

      {/* Status toggle (pending ↔ in_progress) */}
      {!isCompleted && (task.status === "pending" || task.status === "in_progress") && (
        <button
          onClick={cycleStatus}
          className={cn(
            "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors shrink-0 opacity-0 group-hover:opacity-100",
            task.status === "in_progress"
              ? "text-primary border-primary/30 bg-primary/5"
              : "text-muted-foreground/40 border-border/40 hover:text-primary hover:border-primary/30"
          )}
        >
          {task.status === "in_progress" ? "active" : "start"}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground/30 hover:text-red-400 hover:bg-red-400/5 transition-colors shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({
  label, count, tasks, projects, danger, warn, collapsible,
  onToggle, onStatus, onDelete,
}: {
  label: string;
  count: number;
  tasks: Task[];
  projects: Project[];
  danger?: boolean;
  warn?: boolean;
  collapsible?: boolean;
  onToggle: (t: Task) => void;
  onStatus: (t: Task, s: StatusKey) => void;
  onDelete: (id: number) => void;
}) {
  const [open, setOpen] = useState(!collapsible);
  if (count === 0) return null;
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

  return (
    <section>
      <button
        onClick={() => collapsible && setOpen(o => !o)}
        className={cn(
          "w-full flex items-center gap-3 mb-1",
          collapsible && "cursor-pointer"
        )}
      >
        <span className={cn(
          "text-[10px] font-mono uppercase tracking-widest",
          danger ? "text-red-400/80" : warn ? "text-yellow-400/80" : "text-muted-foreground/50"
        )}>
          {label} <span className="opacity-50 ml-1">{count}</span>
        </span>
        <div className="flex-1 h-px bg-border/25" />
        {collapsible && (
          open
            ? <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
            : <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
        )}
      </button>

      {open && (
        <div className="space-y-0.5">
          {tasks.map(t => (
            <TaskRow
              key={t.id}
              task={t}
              project={t.projectId ? projectMap[t.projectId] : undefined}
              onToggle={onToggle}
              onStatus={onStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Inline add form ──────────────────────────────────────────────────────────

function AddTaskForm({
  projects,
  onAdd,
  onClose,
}: {
  projects: Project[];
  onAdd: (d: { title: string; priority: string; projectId?: number; dueDate?: string }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [projectId, setProjectId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  React.useEffect(() => { ref.current?.focus(); }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      priority,
      projectId: projectId ? parseInt(projectId) : undefined,
      dueDate: dueDate || undefined,
    });
    setTitle(""); setPriority("medium"); setProjectId(""); setDueDate("");
    ref.current?.focus();
  }

  return (
    <form onSubmit={submit} className="border border-border/50 rounded bg-card/40 p-3 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-primary/30 shrink-0 bg-primary/5" />
        <input
          ref={ref}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/35 focus:outline-none"
        />
        <button type="button" onClick={onClose} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 pl-6">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className={S}
        >
          <option value="critical">P1 — Critical</option>
          <option value="high">P2 — High</option>
          <option value="medium">P3 — Medium</option>
          <option value="low">P4 — Low</option>
        </select>

        <select
          value={projectId}
          onChange={e => setProjectId(e.target.value)}
          className={S}
        >
          <option value="">No project</option>
          {projects.filter(p => p.status !== "done").map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className={S}
        />

        <button
          type="submit"
          disabled={!title.trim()}
          className="ml-auto text-xs font-mono px-3 py-1 bg-primary/10 text-primary border border-primary/25 rounded hover:bg-primary/20 transition-colors disabled:opacity-30"
        >
          Add task
        </button>
      </div>
    </form>
  );
}

const S = "text-[11px] font-mono bg-background border border-border/50 rounded px-2 py-1 text-foreground focus:outline-none focus:border-primary/40 transition-colors";

// ─── Page ─────────────────────────────────────────────────────────────────────

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "in_progress", label: "In progress" },
  { key: "overdue", label: "Overdue" },
];

export default function Tasks() {
  const { data: tasks = [], isLoading } = useGetTasks({ query: { refetchInterval: 15000 } });
  const { data: projects = [] } = useGetProjects({ query: { refetchInterval: 30000 } });
  const { mutate: createTask } = useCreateTask();
  const { mutate: updateTask } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);

  // Groups
  const active = tasks.filter(t => t.status !== "completed" && t.status !== "cancelled");

  const overdueAll  = active.filter(t => dueCategory(t) === "overdue").sort((a, b) => (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9));
  const todayAll    = active.filter(t => dueCategory(t) === "today").sort((a, b) => (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9));
  const inProgAll   = active.filter(t => t.status === "in_progress" && dueCategory(t) === "none").sort((a, b) => (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9));
  const nextAll     = active.filter(t => t.status === "pending" && dueCategory(t) === "none").sort((a, b) => (P_ORDER[a.priority] ?? 9) - (P_ORDER[b.priority] ?? 9));
  const doneAll     = tasks.filter(t => t.status === "completed" || t.status === "cancelled").slice(0, 20);

  // Apply filter
  const overdue  = filter === "all" || filter === "overdue"    ? overdueAll  : [];
  const today    = filter === "all" || filter === "today"      ? todayAll    : [];
  const inProg   = filter === "all" || filter === "in_progress"? inProgAll  : [];
  const next     = filter === "all"                             ? nextAll    : [];
  const done     = filter === "all"                             ? doneAll    : [];

  const totalVisible = overdue.length + today.length + inProg.length + next.length;

  function handleToggle(task: Task) {
    updateTask({ id: task.id, data: { status: task.status === "completed" ? "pending" : "completed" } });
  }

  function handleStatus(task: Task, status: StatusKey) {
    updateTask({ id: task.id, data: { status } });
  }

  function handleDelete(id: number) {
    deleteTask({ id });
  }

  function handleAdd(d: { title: string; priority: string; projectId?: number; dueDate?: string }) {
    createTask({ data: { title: d.title, priority: d.priority as any, projectId: d.projectId, dueDate: d.dueDate } });
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-5 border-b border-border/40">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xs font-mono font-bold uppercase tracking-widest text-foreground">Tasks</h1>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            {overdueAll.length > 0 && (
              <span className="flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {overdueAll.length} overdue
              </span>
            )}
            {todayAll.length > 0 && (
              <span className="flex items-center gap-1.5 text-yellow-400">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                {todayAll.length} due today
              </span>
            )}
            {inProgAll.length > 0 && (
              <span className="flex items-center gap-1.5 text-primary/70">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {inProgAll.length} in progress
              </span>
            )}
            {overdueAll.length === 0 && todayAll.length === 0 && inProgAll.length === 0 && active.length > 0 && (
              <span className="text-muted-foreground/40">{active.length} tasks queued</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-primary/8 text-primary border border-primary/25 rounded hover:bg-primary/15 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      </div>

      {/* ── Add task form ───────────────────────────────────────── */}
      {showAdd && (
        <AddTaskForm
          projects={projects}
          onAdd={d => { handleAdd(d); }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* ── Filter pills ────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {FILTER_LABELS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded transition-colors",
              filter === f.key
                ? "bg-primary/10 text-primary border border-primary/25"
                : "text-muted-foreground/40 hover:text-muted-foreground border border-transparent"
            )}
          >
            {f.label}
            {f.key === "overdue" && overdueAll.length > 0 && (
              <span className="ml-1.5 text-red-400">{overdueAll.length}</span>
            )}
            {f.key === "today" && todayAll.length > 0 && (
              <span className="ml-1.5 text-yellow-400">{todayAll.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Task sections ───────────────────────────────────────── */}
      {isLoading ? (
        <p className="text-xs font-mono text-muted-foreground/40 pt-4">Loading...</p>
      ) : totalVisible === 0 && done.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-xs font-mono text-muted-foreground/30">
            {filter === "all" ? "Nothing here. Add a task above." : "No tasks matching this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <Section label="Overdue" count={overdue.length} tasks={overdue} projects={projects} danger onToggle={handleToggle} onStatus={handleStatus} onDelete={handleDelete} />
          <Section label="Due today" count={today.length} tasks={today} projects={projects} warn onToggle={handleToggle} onStatus={handleStatus} onDelete={handleDelete} />
          <Section label="In progress" count={inProg.length} tasks={inProg} projects={projects} onToggle={handleToggle} onStatus={handleStatus} onDelete={handleDelete} />
          <Section label="Next up" count={next.length} tasks={next} projects={projects} onToggle={handleToggle} onStatus={handleStatus} onDelete={handleDelete} />
          <Section label="Done" count={done.length} tasks={done} projects={projects} collapsible onToggle={handleToggle} onStatus={handleStatus} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}
