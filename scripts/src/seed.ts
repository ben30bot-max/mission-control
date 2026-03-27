import { db, agentTable, tasksTable, logsTable, memoryTable } from "@workspace/db";

async function seed() {
  console.log("Seeding Mission Control data...");

  const existing = await db.select().from(agentTable).limit(1);
  if (existing.length === 0) {
    await db.insert(agentTable).values({
      name: "Ben",
      state: "idle",
      taskCount: 5,
      completedCount: 12,
      errorCount: 1,
      lastActive: new Date(),
    });
    console.log("Created agent Ben");
  } else {
    console.log("Agent already exists, skipping");
  }

  const taskCount = await db.select().from(tasksTable);
  if (taskCount.length === 0) {
    await db.insert(tasksTable).values([
      {
        title: "Analyze competitor pricing data",
        description: "Scrape and analyze competitor pricing from top 5 sites",
        status: "completed",
        priority: "high",
        completedAt: new Date(Date.now() - 3600000),
      },
      {
        title: "Generate weekly summary report",
        description: "Compile activity from the past week into a report",
        status: "in_progress",
        priority: "medium",
      },
      {
        title: "Monitor social media mentions",
        description: "Track brand mentions across Twitter, Reddit, and HN",
        status: "pending",
        priority: "low",
      },
      {
        title: "Update knowledge base",
        description: "Ingest latest documentation and update context",
        status: "pending",
        priority: "high",
      },
      {
        title: "Send daily digest email",
        description: "Compose and queue the daily digest for subscribers",
        status: "failed",
        priority: "critical",
        completedAt: new Date(Date.now() - 7200000),
      },
    ]);
    console.log("Created seed tasks");
  }

  const logCount = await db.select().from(logsTable);
  if (logCount.length === 0) {
    const now = Date.now();
    await db.insert(logsTable).values([
      { level: "info", message: "Agent Ben initialized successfully", source: "system", createdAt: new Date(now - 3600000 * 5) },
      { level: "success", message: "Completed task: Analyze competitor pricing data", source: "task-runner", createdAt: new Date(now - 3600000 * 4) },
      { level: "info", message: "Starting task: Generate weekly summary report", source: "task-runner", createdAt: new Date(now - 3600000 * 3) },
      { level: "warning", message: "Rate limit approaching on external API", source: "http-client", createdAt: new Date(now - 3600000 * 2) },
      { level: "error", message: "Failed to send daily digest: SMTP connection refused", source: "email-service", createdAt: new Date(now - 3600000 * 1) },
      { level: "info", message: "Memory context updated with 15 new items", source: "memory", createdAt: new Date(now - 1800000) },
      { level: "success", message: "Health check passed", source: "monitor", createdAt: new Date(now - 900000) },
      { level: "info", message: "Polling for new tasks...", source: "scheduler", createdAt: new Date(now - 300000) },
    ]);
    console.log("Created seed logs");
  }

  const memCount = await db.select().from(memoryTable);
  if (memCount.length === 0) {
    await db.insert(memoryTable).values([
      { key: "user_timezone", value: "America/New_York", category: "preferences" },
      { key: "openai_model", value: "gpt-4o", category: "config" },
      { key: "max_retries", value: "3", category: "config" },
      { key: "target_audience", value: "B2B SaaS companies with 10-500 employees", category: "context" },
      { key: "primary_language", value: "English", category: "preferences" },
      { key: "email_signature", value: "Ben | openclaw AI Agent", category: "identity" },
      { key: "last_run_summary", value: "Processed 23 tasks, 2 errors, 8 hours runtime", category: "stats" },
      { key: "api_endpoint", value: "https://api.openclaw.ai/v1", category: "config" },
    ]);
    console.log("Created seed memory items");
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
