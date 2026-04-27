import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Automation = {
  id: string;
  name: string;
  owner?: string;
  purpose?: string;
  status: string;
  health: string;
  group: string;
  schedule?: {
    kind?: string;
    label?: string;
    expr?: string;
  };
  nextRun?: string | null;
  lastRun?: string | null;
  delivery?: {
    mode?: string;
    target?: string;
    channelId?: string | null;
  };
  source?: {
    kind?: string;
    sessionTarget?: string | null;
    workspaceDocs?: string[];
  };
  notes?: string[];
  tags?: string[];
};

type Registry = {
  generatedAt: string;
  timezone?: string;
  summary: {
    totalAutomations: number;
    active: number;
    warningsOrFailed: number;
    disabled: number;
    duplicatesOrOverlap: number;
    nextScheduledRun?: string;
    notes?: string[];
  };
  groups: Array<{
    name: string;
    count: number;
    notes?: string[];
  }>;
  automations: Automation[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsDir = path.resolve(__dirname, "../../../docs");
const registryPath = path.join(docsDir, "automation-registry.json");
const outputPath = path.join(docsDir, "automation-registry.md");
const registry = JSON.parse(readFileSync(registryPath, "utf8")) as Registry;

const groupedAutomations = new Map<string, Automation[]>();
for (const group of registry.groups) {
  groupedAutomations.set(group.name, []);
}
for (const automation of registry.automations) {
  const group = groupedAutomations.get(automation.group) ?? [];
  group.push(automation);
  groupedAutomations.set(automation.group, group);
}

const toTitleCase = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const labelFor = (value?: string | null, fallback = "Unknown") => (value ? value : fallback);
const healthLabel = (value: string) => toTitleCase(value);
const formatGeneratedAt = (value: string) => value.replace("T", " ").replace(/:00(?=[+-]\d\d:\d\d$)/, "");
const bullets = (items: string[]) => items.map((item) => `- ${item}`).join("\n");

const needsAttention = registry.automations.filter((automation) =>
  new Set(["warning", "failed", "duplicate", "overlap", "drift", "paused", "new"]).has(automation.health),
);

const renderAutomation = (automation: Automation) => {
  const lines = [
    `#### ${automation.name}`,
    `- **Job ID:** \`${automation.id}\``,
  ];

  if (automation.purpose) lines.push(`- **Purpose:** ${automation.purpose}`);
  lines.push(`- **Health:** ${healthLabel(automation.health)}`);
  lines.push(`- **Status:** ${toTitleCase(automation.status)}`);
  lines.push(`- **Schedule:** ${labelFor(automation.schedule?.label)}`);
  lines.push(`- **Destination:** ${labelFor(automation.delivery?.target)}`);
  if (automation.nextRun) lines.push(`- **Next run:** ${automation.nextRun}`);
  if (automation.lastRun) lines.push(`- **Last run:** ${automation.lastRun}`);
  if (automation.source?.sessionTarget) lines.push(`- **Session target:** ${automation.source.sessionTarget}`);
  if (automation.source?.workspaceDocs?.length) {
    lines.push(`- **Source docs:** ${automation.source.workspaceDocs.map((doc) => `\`${doc}\``).join(", ")}`);
  }
  if (automation.notes?.length) {
    lines.push(`- **Notes:** ${automation.notes.join(" ")}`);
  }
  if (automation.tags?.length) {
    lines.push(`- **Tags:** ${automation.tags.map((tag) => `\`${tag}\``).join(", ")}`);
  }

  return lines.join("\n");
};

const sections: string[] = [];
sections.push("# Automation Registry");
sections.push("");
sections.push(
  "Purpose: durable source of truth for what automations exist, what they do, where they deliver, how healthy they are, and what needs cleanup.",
);
sections.push("");
sections.push("This registry is generated from `docs/automation-registry.json` so the human-readable handoff stays in sync with the app-readable source.");
sections.push("");
sections.push("Companion file:");
sections.push("- `docs/automation-registry.json`");
sections.push("");
sections.push(`Last refreshed: ${formatGeneratedAt(registry.generatedAt)}`);
if (registry.timezone) {
  sections.push(`Timezone: ${registry.timezone}`);
}
sections.push("");
sections.push("## Summary");
sections.push("");
sections.push(`- Total Automations: ${registry.summary.totalAutomations}`);
sections.push(`- Active: ${registry.summary.active}`);
sections.push(`- Warnings / Failed: ${registry.summary.warningsOrFailed}`);
sections.push(`- Disabled: ${registry.summary.disabled}`);
sections.push(`- Duplicate / overlap risks: ${registry.summary.duplicatesOrOverlap}`);
if (registry.summary.nextScheduledRun) {
  sections.push(`- Next scheduled run: ${registry.summary.nextScheduledRun}`);
}
if (registry.summary.notes?.length) {
  sections.push("");
  sections.push("### Current friction points");
  sections.push(bullets(registry.summary.notes));
}
sections.push("");
sections.push("## Registry grouping model");
sections.push("");
sections.push("The app should group automations by operating intent, not just sort them as a flat cron list.");
for (const group of registry.groups) {
  sections.push("");
  sections.push(`### ${group.name}`);
  sections.push(`${group.count} automations`);
  const names = (groupedAutomations.get(group.name) ?? []).map((automation) => automation.name);
  if (names.length) sections.push(bullets(names));
  if (group.notes?.length) {
    sections.push("");
    sections.push("Why this matters:");
    sections.push(group.notes.join(" "));
  }
}
sections.push("");
sections.push("## Needs attention now");
if (needsAttention.length === 0) {
  sections.push("");
  sections.push("No current warning, duplicate, overlap, drift, paused, or new-state items.");
} else {
  const order = ["warning", "failed", "duplicate", "overlap", "drift", "paused", "new"];
  for (const health of order) {
    const matches = needsAttention.filter((automation) => automation.health === health);
    if (!matches.length) continue;
    sections.push("");
    sections.push(`### ${healthLabel(health)}`);
    for (const automation of matches) {
      sections.push("");
      sections.push(renderAutomation(automation));
    }
  }
}
sections.push("");
sections.push("## Full automation inventory");
for (const group of registry.groups) {
  sections.push("");
  sections.push(`### ${group.name}`);
  const automations = groupedAutomations.get(group.name) ?? [];
  for (const automation of automations) {
    sections.push("");
    sections.push(renderAutomation(automation));
  }
}
sections.push("");
sections.push("## Validation");
sections.push("");
sections.push("Local commands:");
sections.push("- `pnpm --dir mission-control --filter @workspace/scripts run validate:automation-registry`");
sections.push("- `pnpm --dir mission-control --filter @workspace/scripts run generate:automation-registry`");
sections.push("");
sections.push("What the validator checks:");
sections.push("- summary totals vs listed automations");
sections.push("- group counts vs listed automations");
sections.push("- duplicate job IDs");
sections.push("");
sections.push("Operating rule: when the JSON changes, regenerate this markdown so app handoffs and human docs stay aligned.");
sections.push("");
writeFileSync(outputPath, `${sections.join("\n")}\n`, "utf8");
console.log(`Generated ${path.relative(process.cwd(), outputPath)}`);
