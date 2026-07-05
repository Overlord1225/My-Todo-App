"use server";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { and, eq, type InferInsertModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

type Priority = "low" | "medium" | "high";
type TodoUpdate = Partial<Pick<InferInsertModel<typeof todos>, "title" | "priority" | "dueDate">>;

const prioritySchema = z.enum(["low", "medium", "high"]);

// Validation schemas
const addTodoSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  priority: prioritySchema.default("medium"),
  dueDate: z.string().nullable(),
});

const editTodoSchema = z.object({
  todoId: z.number().int().positive(),
  title: z.string().trim().min(1, "Title cannot be empty"),
  priority: prioritySchema.optional(),
  dueDate: z.string().nullable().optional(),
});

function normalizeDueDate(value: FormDataEntryValue | string | null | undefined) {
  const dueDate = typeof value === "string" ? value.trim() : "";
  return dueDate || null;
}

function ownedTodoWhere(todoId: number, userId: string) {
  return and(eq(todos.id, todoId), eq(todos.userId, userId));
}

export async function addTodo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const validated = addTodoSchema.parse({
    title: formData.get("title") ?? "",
    priority: formData.get("priority") ?? "medium",
    dueDate: normalizeDueDate(formData.get("dueDate")),
  });

  await db.insert(todos).values({
    title: validated.title,
    priority: validated.priority,
    dueDate: validated.dueDate,
    userId: user.id,
  });

  revalidatePath("/");
}

export async function editTodo(
  todoId: number,
  newTitle: string,
  newPriority?: Priority,
  newDueDate?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const validated = editTodoSchema.parse({
    todoId,
    title: newTitle,
    priority: newPriority,
    dueDate: normalizeDueDate(newDueDate),
  });

  const updateData: TodoUpdate = { title: validated.title };
  if (validated.priority) updateData.priority = validated.priority;
  if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate;

  await db.update(todos)
    .set(updateData)
    .where(ownedTodoWhere(validated.todoId, user.id));

  revalidatePath("/");
}

export async function deleteTodo(todoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await db.delete(todos).where(ownedTodoWhere(todoId, user.id));
  revalidatePath("/");
}

export async function toggleTodo(todoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const currentTodo = await db.select().from(todos).where(ownedTodoWhere(todoId, user.id)).limit(1);
  if (currentTodo.length === 0) return;

  await db.update(todos)
    .set({ completed: !currentTodo[0].completed })
    .where(ownedTodoWhere(todoId, user.id));

  revalidatePath("/");
}
