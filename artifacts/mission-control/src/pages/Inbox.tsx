import React, { useState, useRef } from "react";
import {
  useGetInbox, useCreateInboxItem, useUpdateInboxItem, useDeleteInboxItem,
  useGetProjects,
} from "@workspace/api-client-react";
import type { InboxItem, Project } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  Plus, Check, Trash2, FolderKanban, ChevronDown,
  Archive, X, Inbox as InboxIcon,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";

export default function Inbox() {
  const { data: items } = useGetInbox({ query: { refetchInterval: 15000 } });
  const { data: projects } = useGetProjects();
  const { mutate: create, isPending: creating } = useCreateInboxItem();
  const { mutate: update } = useUpdateInboxItem();
  const { mutate: remove } = useDeleteInboxItem();

  const [input, setInput] = useState("");
  const [showProcessed, setShowProcessed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const unprocessed = (items ?? []).filter(i => !i.processed);
  const processed = (items ?? []).filter(i => i.processed);

  function handleCapture(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    create({ data: { content: input.trim() } }, { onSuccess: () => setInput("") });
  }

  function markProcessed(item: InboxItem) {
    update({ id: item.id, data: { processed: true } });
  }

  function markUnprocessed(item: InboxItem) {
    update({ id: item.id, data: { processed: false } });
  }

  function assignProject(item: InboxItem, projectId: number | null) {
    update({ id: item.id, data: { projectId } });
  }

  const projectMap = Object.fromEntries((projects ?? []).map(p => [p.id, p]));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-bold uppercase tracking-widest text-foreground">Inbox</h1>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {unprocessed.length} item{unprocessed.length !== 1 ? "s" : ""} to process
          </p>
        </div>
      </div>

      {/* Capture input */}
      <form onSubmit={handleCapture} className="flex items-stretch gap-0 border border-border rounded overflow-hidden focus-within:border-primary/50 transition-colors">
        <div className="flex items-center px-3 text-muted-foreground/50">
          <InboxIcon className="w-4 h-4" />
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Capture anything — thought, task, link, idea..."
          className="flex-1 bg-transparent px-2 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          disabled={!input.trim() || creating}
          className="px-4 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 border-l border-border"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Unprocessed */}
      {unprocessed.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/40 rounded">
          <InboxIcon className="w-6 h-6 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground/40">Inbox is clear.</p>
        </div>
      ) : (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">To process</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <div className="space-y-1.5">
            {unprocessed.map(item => (
              <InboxRow
                key={item.id}
                item={item}
                projects={projects ?? []}
                projectMap={projectMap}
                onProcess={() => markProcessed(item)}
                onDelete={() => remove({ id: item.id })}
                onAssign={(pid) => assignProject(item, pid)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Processed (collapsible) */}
      {processed.length > 0 && (
        <section>
          <button
            onClick={() => setShowProcessed(v => !v)}
            className="flex items-center gap-3 w-full group"
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
              Processed · {processed.length}
            </span>
            <div className="flex-1 h-px bg-border/30" />
            <ChevronDown className={cn("w-3 h-3 text-muted-foreground/30 transition-transform", showProcessed && "rotate-180")} />
          </button>
          {showProcessed && (
            <div className="space-y-1.5 mt-3">
              {processed.map(item => (
                <InboxRow
                  key={item.id}
                  item={item}
                  projects={projects ?? []}
                  projectMap={projectMap}
                  onProcess={() => markUnprocessed(item)}
                  onDelete={() => remove({ id: item.id })}
                  onAssign={(pid) => assignProject(item, pid)}
                  isProcessed
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function InboxRow({
  item, projects, projectMap, onProcess, onDelete, onAssign, isProcessed,
}: {
  item: InboxItem;
  projects: Project[];
  projectMap: Record<number, Project>;
  onProcess: () => void;
  onDelete: () => void;
  onAssign: (pid: number | null) => void;
  isProcessed?: boolean;
}) {
  const [showProjects, setShowProjects] = useState(false);
  const assignedProject = item.projectId ? projectMap[item.projectId] : null;

  return (
    <div className={cn(
      "group flex items-start gap-3 px-3 py-3 rounded border transition-colors",
      isProcessed
        ? "border-border/20 bg-card/10 opacity-50 hover:opacity-70"
        : "border-border/50 bg-card/30 hover:bg-card/50"
    )}>
      {/* Process toggle */}
      <button
        onClick={onProcess}
        className={cn(
          "mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors",
          isProcessed
            ? "bg-primary/20 border-primary/40"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        )}
      >
        {isProcessed && <Check className="w-2.5 h-2.5 text-primary" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-mono text-foreground", isProcessed && "line-through text-muted-foreground")}>
          {item.content}
        </p>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground/40">
            {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true })}
          </span>
          {assignedProject && (
            <span className="text-[10px] font-mono text-primary/60 flex items-center gap-1">
              <FolderKanban className="w-2.5 h-2.5" />{assignedProject.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {/* Assign to project */}
        <div className="relative">
          <button
            onClick={() => setShowProjects(v => !v)}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            title="Assign to project"
          >
            <FolderKanban className="w-3.5 h-3.5" />
          </button>
          {showProjects && (
            <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded shadow-lg min-w-[160px] py-1">
              <button
                onClick={() => { onAssign(null); setShowProjects(false); }}
                className="w-full text-left px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                No project
              </button>
              {projects.filter(p => p.status !== "done").map(p => (
                <button
                  key={p.id}
                  onClick={() => { onAssign(p.id); setShowProjects(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs font-mono text-foreground hover:bg-white/5 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onDelete}
          className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
