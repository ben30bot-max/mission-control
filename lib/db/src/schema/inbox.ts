import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inboxTable = pgTable("inbox", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  processed: boolean("processed").notNull().default(false),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInboxSchema = createInsertSchema(inboxTable).omit({ id: true, createdAt: true });
export type InsertInboxItem = z.infer<typeof insertInboxSchema>;
export type InboxItem = typeof inboxTable.$inferSelect;
