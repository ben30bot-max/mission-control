import { Router, type IRouter } from "express";
import { db, agentTable, logsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  GetAgentStatusResponse,
  ControlAgentBody,
  ControlAgentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureAgent() {
  const existing = await db.select().from(agentTable).limit(1);
  if (existing.length === 0) {
    await db.insert(agentTable).values({
      name: "Ben",
      state: "idle",
      taskCount: 0,
      completedCount: 0,
      errorCount: 0,
    });
  }
  return (await db.select().from(agentTable).limit(1))[0];
}

router.get("/agent", async (req, res) => {
  try {
    const agent = await ensureAgent();
    const response = GetAgentStatusResponse.parse({
      ...agent,
    });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Error getting agent status");
    res.status(500).json({ error: "Failed to get agent status" });
  }
});

router.post("/agent/control", async (req, res) => {
  try {
    const body = ControlAgentBody.parse(req.body);
    const agent = await ensureAgent();

    const stateMap: Record<string, string> = {
      start: "active",
      stop: "stopped",
      pause: "paused",
      resume: "active",
    };

    const newState = stateMap[body.action] ?? agent.state;

    await db
      .update(agentTable)
      .set({
        state: newState,
        lastActive: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentTable.id, agent.id));

    await db.insert(logsTable).values({
      level: "info",
      message: `Agent ${body.action} command received — state changed to ${newState}`,
      source: "control",
    });

    const updated = await db.select().from(agentTable).where(eq(agentTable.id, agent.id)).limit(1);
    const response = ControlAgentResponse.parse({
      ...updated[0],
    });
    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Error controlling agent");
    res.status(500).json({ error: "Failed to control agent" });
  }
});

export default router;
