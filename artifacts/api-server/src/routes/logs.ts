import { Router, type IRouter } from "express";
import { db, logsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { GetLogsQueryParams, CreateLogBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/logs", async (req, res) => {
  try {
    const query = GetLogsQueryParams.parse({
      limit: req.query.limit,
      level: req.query.level,
    });

    let dbQuery = db.select().from(logsTable).orderBy(desc(logsTable.createdAt));

    if (query.level && query.level !== "all") {
      dbQuery = db
        .select()
        .from(logsTable)
        .where(eq(logsTable.level, query.level))
        .orderBy(desc(logsTable.createdAt)) as typeof dbQuery;
    }

    const logs = await dbQuery.limit(query.limit ?? 50);
    const mapped = logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Error listing logs");
    res.status(500).json({ error: "Failed to list logs" });
  }
});

router.post("/logs", async (req, res) => {
  try {
    const body = CreateLogBody.parse(req.body);
    const [log] = await db.insert(logsTable).values({
      level: body.level,
      message: body.message,
      source: body.source ?? null,
      metadata: body.metadata ?? null,
    }).returning();

    res.status(201).json({
      ...log,
      createdAt: log.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error creating log");
    res.status(500).json({ error: "Failed to create log" });
  }
});

export default router;
