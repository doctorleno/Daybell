import {sqliteTable,text,integer,index} from "drizzle-orm/sqlite-core";
export const entries=sqliteTable("entries",{
 id:text("id").primaryKey(),title:text("title").notNull(),kind:text("kind").notNull(),
 starts:text("starts").notNull(),minutes:integer("minutes").notNull(),sound:text("sound").notNull(),
 notes:text("notes").notNull(),done:integer("done").notNull().default(0),
 ownerId:text("owner_id").notNull().default("")
},table=>[index("idx_entries_owner_starts").on(table.ownerId,table.starts)]);
export const users=sqliteTable("users",{
 id:text("id").primaryKey(),email:text("email").notNull().unique(),name:text("name").notNull(),
 passwordHash:text("password_hash").notNull(),recoveryHash:text("recovery_hash").notNull(),createdAt:integer("created_at").notNull()
});
export const sessions=sqliteTable("sessions",{
 tokenHash:text("token_hash").primaryKey(),userId:text("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
 expiresAt:integer("expires_at").notNull()
},t=>[index("idx_sessions_user").on(t.userId)]);
export const authLimits=sqliteTable("auth_limits",{
 bucket:text("bucket").primaryKey(),attempts:integer("attempts").notNull(),expiresAt:integer("expires_at").notNull()
});
