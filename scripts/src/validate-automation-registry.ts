import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Automation = {
  id: string;
  name: string;
  health: string;
  status: string;
  group: string;
};

type Registry = {
  generatedAt: string;
  summary: {
    totalAutomations: number;
    active: number;
    warningsOrFailed: number;
    disabled: number;
    duplicatesOrOverlap: number;
  };
  groups: Array<{
    name: string;
    count: number;
  }>;
  automations: Automation[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryPath = path.resolve(__dirname, "../../../docs/automation-registry.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8")) as Registry;

const warningSet = new Set(["warning", "failed"]);
const duplicateSet = new Set(["duplicate", "overlap"]);

const computed = {
  totalAutomations: registry.automations.length,
  active: registry.automations.filter((item) => item.status === "active").length,
  disabled: registry.automations.filter((item) => item.status === "disabled").length,
  warningsOrFailed: registry.automations.filter((item) => warningSet.has(item.health)).length,
  duplicatesOrOverlap: registry.automations.filter((item) => duplicateSet.has(item.health)).length,
};

const groupCounts = new Map<string, number>();
for (const automation of registry.automations) {
  groupCounts.set(automation.group, (groupCounts.get(automation.group) ?? 0) + 1);
}

const problems: string[] = [];

for (const [key, value] of Object.entries(computed)) {
  const actual = registry.summary[key as keyof typeof computed];
  if (actual !== value) {
    problems.push(`summary.${key} is ${actual}, expected ${value}`);
  }
}

for (const group of registry.groups) {
  const actual = groupCounts.get(group.name) ?? 0;
  if (group.count !== actual) {
    problems.push(`groups[${group.name}] count is ${group.count}, expected ${actual}`);
  }
}

for (const groupName of groupCounts.keys()) {
  if (!registry.groups.some((group) => group.name === groupName)) {
    problems.push(`group missing from groups[]: ${groupName}`);
  }
}

const duplicateIds = registry.automations
  .map((item) => item.id)
  .filter((id, index, list) => list.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  problems.push(`duplicate job ids found: ${Array.from(new Set(duplicateIds)).join(", ")}`);
}

if (problems.length > 0) {
  console.error("Automation registry validation failed:\n");
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log("Automation registry validation passed.");
console.log(`- generatedAt: ${registry.generatedAt}`);
console.log(`- automations: ${computed.totalAutomations}`);
console.log(`- warningsOrFailed: ${computed.warningsOrFailed}`);
console.log(`- duplicatesOrOverlap: ${computed.duplicatesOrOverlap}`);
