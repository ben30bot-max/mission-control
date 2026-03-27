import React from "react";
import { Link } from "wouter";
import {
  useGetAgentStatus,
  useControlAgent,
  useGetTasks,
  useGetLogs,
} from "@workspace/api-client-react";
import { Play, Square, Pause, PlayCircle, AlertTriangle, ArrowRight, ChevronRight, Zap, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function AgentBar() {
  const { data: agent } = useGetAgentStatus({ query: { refetchInterval: 3000 } });
  const { mutate: controlAgent, isPending } = useControlAgent();

  const state = agent?.state ?? "idle";
  const isActive = state === "active";
  const isPaused = state === "paused";
  const isStopped = state === "stopped" || state === "idle";

  const stateColor: Record<string, string> = {
    active: "text-emerald-400",
    paused: "text-yellow-400",
    stopped: "text-zinc-500",
    idle: "text-zinc-500",
    error: "text-red-400",
  };

  const dotColor: Record<string, string> = {
    active: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    paused: "bg-yellow-400",
    stopped: "bg-zinc-600",
    idle: "bg-zinc-600",
    error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]",
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/40 mb-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", isActive && "animate-pulse", dotColor[state] ?? "bg-zinc-600")} />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Ben</span>
          <span className={cn("text-xs font-mono font-bold uppercase tracking-widest", stateColor[state])}>
            {state}
          </span>
        </div>
        {agent?.currentTask && (
          <span className="text-xs font-mono text-muted-foreground border-l border-border pl-4 truncate max-w-xs">
            {agent.currentTask}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isStopped && (
          <button
            onClick={() => controlAgent({ data: { action: "start" } })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 rounded hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3" /> Initialize
          </button>
        )}
        {isActive && (
          <button
            onClick={() => controlAgent({ data: { action: "pause" } })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded hover:bg-yellow-400/20 transition-colors disabled:opacity-50"
          >
            <Pause className="w-3 h-3" /> Pause
          </button>
        )}
        {isPaused && (
          <button
            onClick={() => controlAgent({ data: { action: "resume" } })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 rounded hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
          >
            <PlayCircle className="w-3 h-3" /> Resume
          </button>
        )}
        {(isActive || isPaused) && (
          <button
            onClick={() => controlAgent({ data: { action: "stop" } })}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <Square className="w-3 h-3" /> Stop
          </button>
        )}
      </div>
    </div>
  );
}

const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const priorityLabel: Record<string, string> = {
  critical: "CRIT",
  high: "HIGH",
  medium: "MED",
  low: "LOW",
};

const priorityColor: Record<string, string> = {
  critical: "text-red-400 border-red-400/40 bg-red-400/5",
  high: "text-orange-400 border-orange-400/40 bg-orange-400/5",
  medium: "text-yellow-400 border-yellow-400/40 bg-yellow-400/5",
  low: "text-zinc-500 border-zinc-600 bg-zinc-800/30",
};

export default function Dashboard() {
  const { data: tasks } = useGetTasks({ query: { refetchInterval: 5000 } });
  const { data: logs } = useGetLogs({ limit: 20 }, { query: { refetchInterval: 5000 } });

  const active = (tasks ?? []).filter(t => t.status === "in_progress");
  const failed = (tasks ?? []).filter(t => t.status === "failed");
  const pending = (tasks ?? [])
    .filter(t => t.status === "pending")
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

  const warnings = (logs ?? []).filter(l => l.level === "warning" || l.level === "error").slice(0, 5);

  const needsAttention = [
    ...failed.map(t => ({ type: "task" as const, id: `t-${t.id}`, label: t.title, detail: "Task failed", severity: "error" as const, ts: t.updatedAt })),
    ...warnings.map(l => ({ type: "log" as const, id: `l-${l.id}`, label: l.message, detail: l.source ?? "system", severity: l.level as "warning" | "error", ts: l.createdAt })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).slice(0, 6);

  return (
    <div>
      <AgentBar />

      <div className="grid grid-cols-3 gap-6">
        {/* ACTIVE NOW */}
        <div>
          <SectionHeader label="Active now" count={active.length} accent="emerald" />
          <div className="space-y-2 mt-3">
            {active.length === 0 ? (
              <Empty label="Nothing running" />
            ) : active.map(t => (
              <TaskRow key={t.id} title={t.title} priority={t.priority} meta={`started ${formatDistanceToNow(new Date(t.updatedAt), { addSuffix: true })}`} pulse />
            ))}
          </div>
        </div>

        {/* NEEDS ATTENTION */}
        <div>
          <SectionHeader label="Needs attention" count={needsAttention.length} accent="red" />
          <div className="space-y-2 mt-3">
            {needsAttention.length === 0 ? (
              <Empty label="All clear" icon="check" />
            ) : needsAttention.map(item => (
              <AttentionRow
                key={item.id}
                label={item.label}
                detail={item.detail}
                severity={item.severity}
                ts={item.ts}
              />
            ))}
          </div>
          {needsAttention.length > 0 && (
            <Link href="/logs" className="flex items-center gap-1 mt-3 text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              View all logs <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* UP NEXT */}
        <div>
          <SectionHeader label="Up next" count={pending.length} accent="sky" />
          <div className="space-y-2 mt-3">
            {pending.length === 0 ? (
              <Empty label="Queue is empty" />
            ) : pending.slice(0, 6).map((t, i) => (
              <TaskRow key={t.id} title={t.title} priority={t.priority} meta={`#${i + 1} in queue`} />
            ))}
          </div>
          {pending.length > 6 && (
            <Link href="/tasks" className="flex items-center gap-1 mt-3 text-xs font-mono text-muted-foreground hover:text-primary transition-colors">
              +{pending.length - 6} more <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, count, accent }: { label: string; count: number; accent: "emerald" | "red" | "sky" }) {
  const colors = {
    emerald: "text-emerald-400 border-emerald-400/30",
    red: "text-red-400 border-red-400/30",
    sky: "text-sky-400 border-sky-400/30",
  };
  return (
    <div className="flex items-center justify-between pb-2 border-b border-border">
      <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-mono font-bold tabular-nums px-1.5 py-0.5 rounded border", colors[accent])}>
        {count}
      </span>
    </div>
  );
}

function TaskRow({ title, priority, meta, pulse }: { title: string; priority: string; meta: string; pulse?: boolean }) {
  return (
    <div className="group flex items-start gap-3 px-3 py-2.5 rounded border border-border/50 bg-card/30 hover:border-border hover:bg-card/60 transition-all">
      {pulse && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />}
      {!pulse && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate leading-snug">{title}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">{meta}</p>
      </div>
      <span className={cn("text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border shrink-0 mt-0.5", priorityColor[priority] ?? priorityColor.low)}>
        {priorityLabel[priority] ?? priority}
      </span>
    </div>
  );
}

function AttentionRow({ label, detail, severity, ts }: { label: string; detail: string; severity: "error" | "warning"; ts: string }) {
  return (
    <div className={cn(
      "flex items-start gap-3 px-3 py-2.5 rounded border transition-all",
      severity === "error"
        ? "border-red-500/20 bg-red-500/5 hover:border-red-500/40"
        : "border-yellow-400/20 bg-yellow-400/5 hover:border-yellow-400/40"
    )}>
      {severity === "error"
        ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs leading-snug truncate", severity === "error" ? "text-red-300" : "text-yellow-300")}>{label}</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
          {detail} · {formatDistanceToNow(new Date(ts), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function Empty({ label, icon }: { label: string; icon?: "check" }) {
  return (
    <div className="flex items-center gap-2 px-3 py-4 text-xs font-mono text-muted-foreground">
      {icon === "check" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-30" />}
      {label}
    </div>
  );
}
