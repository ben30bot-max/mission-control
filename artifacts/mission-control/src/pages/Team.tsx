import React from "react";
import { ShieldCheck, Wrench, ClipboardList, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type TeamMember = {
  name: string;
  emoji: string;
  role: string;
  reportsTo: string;
  model: string;
  vibe: string;
  responsibilities: string[];
  defaultOutput: string;
  status: string;
  accent: {
    label: string;
    border: string;
    topBar: string;
    badge: string;
    dot: string;
    hover: string;
  };
};

const leader: TeamMember = {
  name: "Ben",
  emoji: "🎯",
  role: "Leader / Delegator / Orchestrator",
  reportsTo: "George",
  model: "gpt-5.4",
  vibe: "Direct, organized, employee energy with personality",
  responsibilities: [
    "Assign work and coordinate agents",
    "Keep direction and priorities clear",
    "Route tasks to the right specialist",
    "Communicate outcomes to George",
  ],
  defaultOutput: "Ownership summary, delegation log, next steps",
  status: "active",
  accent: {
    label: "text-sky-300",
    border: "border-sky-500/28",
    topBar: "bg-gradient-to-r from-sky-600/45 via-sky-400/38 to-sky-600/45",
    badge: "text-sky-300/85 border-sky-300/28 bg-sky-300/6",
    dot: "bg-sky-300",
    hover: "hover:border-sky-500/42 hover:bg-sky-950/10",
  },
};

const teamMembers: TeamMember[] = [
  {
    name: "Bobby",
    emoji: "📋",
    role: "Project Manager",
    reportsTo: "Ben",
    model: "gpt-5.4",
    vibe: "Disciplined, calm, structured, dependable PM operator",
    responsibilities: [
      "Manage projects, tasks, and workflow hygiene",
      "Track status, owners, and blockers",
      "Surface next actions and risks",
      "Keep the system tidy and current",
    ],
    defaultOutput: "Status summary, owners, blockers, next actions",
    status: "active",
    accent: {
      label: "text-amber-400",
      border: "border-amber-500/28",
      topBar: "bg-gradient-to-r from-amber-600/45 via-amber-400/38 to-amber-600/45",
      badge: "text-amber-400/85 border-amber-400/28 bg-amber-400/6",
      dot: "bg-amber-400",
      hover: "hover:border-amber-500/42 hover:bg-amber-950/10",
    },
  },
  {
    name: "Charlie",
    emoji: "🔎",
    role: "QA / Verification / Watchdog",
    reportsTo: "Ben",
    model: "google/gemini-2.5-flash-lite",
    vibe: "Methodical, skeptical, detail-oriented, high-signal",
    responsibilities: [
      "Verify task completion and claimed results",
      "Review correctness and completeness",
      "Detect drift, failures, and regressions",
      "Compare actual state against approved state",
    ],
    defaultOutput: "Assessment, issues found, recommended correction",
    status: "active",
    accent: {
      label: "text-purple-400",
      border: "border-purple-500/28",
      topBar: "bg-gradient-to-r from-purple-600/45 via-purple-400/38 to-purple-600/45",
      badge: "text-purple-400/85 border-purple-400/28 bg-purple-400/6",
      dot: "bg-purple-400",
      hover: "hover:border-purple-500/42 hover:bg-purple-950/10",
    },
  },
  {
    name: "Ernie",
    emoji: "⚙️",
    role: "Builder / Coder",
    reportsTo: "Ben",
    model: "gpt-5.4",
    vibe: "Focused, technical, solution-oriented, gets things done",
    responsibilities: [
      "Write, debug, and ship code",
      "Build features, tools, and scripts",
      "Implement technical solutions end-to-end",
      "Own validation notes and test coverage",
    ],
    defaultOutput: "Working code, implementation notes, test results",
    status: "active",
    accent: {
      label: "text-emerald-400",
      border: "border-emerald-500/28",
      topBar: "bg-gradient-to-r from-emerald-600/45 via-emerald-400/38 to-emerald-600/45",
      badge: "text-emerald-400/85 border-emerald-400/28 bg-emerald-400/6",
      dot: "bg-emerald-400",
      hover: "hover:border-emerald-500/42 hover:bg-emerald-950/10",
    },
  },
];

function Label({ text }: { text: string }) {
  return (
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/55">
      {text}
    </span>
  );
}

function StatusBadge({ member }: { member: TeamMember }) {
  return (
    <span className={cn("text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border", member.accent.badge)}>
      <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", member.accent.dot)} />
      {member.status}
    </span>
  );
}

function ModelBadge({ model, accent }: { model: string; accent: TeamMember["accent"] }) {
  return (
    <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border", accent.badge)}>
      {model}
    </span>
  );
}

function MemberCard({ member, compact = false }: { member: TeamMember; compact?: boolean }) {
  return (
    <section className={cn("rounded-xl border bg-card/25 transition-colors", member.accent.border, member.accent.hover, compact ? "p-5" : "p-6")}>
      <div className={cn("h-1 rounded-full mb-5", member.accent.topBar)} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xl">{member.emoji}</span>
            <span className={cn("text-3xl font-mono leading-none", compact ? "text-2xl" : "text-3xl", member.accent.label)}>{member.name}</span>
            {!compact && <StatusBadge member={member} />}
          </div>
          <div className="mt-2 text-[12px] font-mono text-muted-foreground/55">reports to {member.reportsTo}</div>
          <div className="mt-5 text-xl font-mono text-foreground">{member.role}</div>
          <p className="mt-2 text-sm italic font-mono text-muted-foreground/65">{member.vibe}</p>
        </div>
        {compact && <StatusBadge member={member} />}
      </div>

      <div className={cn("grid gap-6 mt-8", compact ? "grid-cols-1" : "grid-cols-[1.4fr_1fr]")}>
        <div>
          <Label text="Model" />
          <div className="mt-2">
            <ModelBadge model={member.model} accent={member.accent} />
          </div>
        </div>

        <div className={cn("space-y-3", compact ? "" : "border-l border-border/35 pl-6")}>
          <Label text="Responsibilities" />
          <ul className="space-y-2">
            {member.responsibilities.map((item) => (
              <li key={item} className="text-sm font-mono text-foreground/78 flex gap-2">
                <span className={cn("mt-1 inline-block w-1.5 h-1.5 rounded-full shrink-0", member.accent.dot)} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="pt-3 border-t border-border/25">
            <Label text="Output" />
            <p className="mt-2 text-sm italic font-mono text-muted-foreground/68">{member.defaultOutput}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Team() {
  return (
    <div className="space-y-8">
      <div className="pb-5 border-b border-border/40">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/55">
            <Crown className="w-4 h-4 text-primary/75" />
            org structure
          </div>
          <div className="flex items-center gap-5 text-[10px] font-mono text-muted-foreground/45">
            <span>4 agents</span>
            <span>leader: Ben</span>
            <span>lanes: verification, build, pm</span>
          </div>
        </div>
      </div>

      <MemberCard member={leader} />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {teamMembers.map((member) => (
          <MemberCard key={member.name} member={member} compact />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-border/45 bg-card/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary/75" />
            <Label text="Work Routing" />
          </div>
          <ul className="space-y-3 text-sm font-mono text-foreground/80">
            <li>Need verification / QA / drift review? → Charlie</li>
            <li>Need code / build work? → Ernie</li>
            <li>Need project/task/status cleanup? → Bobby</li>
            <li>Need direction or coordination? → Ben</li>
          </ul>
        </section>

        <section className="rounded-xl border border-border/45 bg-card/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-primary/75" />
            <Label text="Operating Principle" />
          </div>
          <ul className="space-y-3 text-sm font-mono text-foreground/80">
            <li>Ben leads</li>
            <li>Bobby manages projects, tasks, and workflow hygiene</li>
            <li>Charlie handles verification and watchdog work</li>
            <li>Ernie handles coding/building</li>
            <li>Work should be delegated by specialty whenever practical</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
