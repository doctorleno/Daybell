import {sqliteTable,text,integer,index} from "drizzle-orm/sqlite-core";
export const entries=sqliteTable("entries",{
 id:text("id").primaryKey(),title:text("title").notNull(),kind:text("kind").notNull(),
 starts:text("starts").notNull(),minutes:integer("minutes").notNull(),sound:text("sound").notNull(),
 notes:text("notes").notNull(),done:integer("done").notNull().default(0),
 ownerId:text("owner_id").notNull().default("")
},table=>[index("idx_entries_owner_starts").on(table.ownerId,table.starts)]);
