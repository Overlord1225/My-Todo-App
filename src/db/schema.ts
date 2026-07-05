import { pgTable, text, serial, boolean, timestamp, date, pgEnum } from "drizzle-orm/pg-core";

// Create priority enum in database
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const todos = pgTable("todos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // NEW: Priority level
  priority: priorityEnum("priority").default("medium"),
  // NEW: Due date
  dueDate: date("due_date"),
});