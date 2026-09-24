import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const entries = sqliteTable("entries", {
    id: text("id").primaryKey(), title: text("title").notNull(), kind: text("kind").notNull(),
    starts: text("starts").notNull(), minutes: integer("minutes").notNull(), sound: text("sound").notNull(),
    notes: text("notes").notNull(), done: integer("done").notNull().default(0)
});
