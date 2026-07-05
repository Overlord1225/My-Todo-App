"use server";

import { db } from "@/db";
import { todos, priorityEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod"; // Optional but recommended

// Validation schemas
const addTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional().nullable(),
});

// --- Add Todo with Priority and Due Date ---
export async function addTodo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const priority = (formData.get("priority") as string) || "medium";
  const dueDate = formData.get("dueDate") as string || null;

  // Validate
  const validated = addTodoSchema.parse({ title, priority, dueDate });

  await db.insert(todos).values({
    title: validated.title,
    priority: validated.priority as "low" | "medium" | "high",
    dueDate: validated.dueDate,
    userId: user.id,
  });

  revalidatePath("/");
}

// --- Edit Todo (update title, priority, due date) ---
export async function editTodo(
  todoId: number,
  newTitle: string,
  newPriority?: "low" | "medium" | "high",
  newDueDate?: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!newTitle.trim()) {
    throw new Error("Title cannot be empty");
  }

  const updateData: any = { title: newTitle.trim() };
  if (newPriority) updateData.priority = newPriority;
  if (newDueDate !== undefined) updateData.dueDate = newDueDate;

  await db.update(todos)
    .set(updateData)
    .where(eq(todos.id, todoId));

  revalidatePath("/");
}

// --- Delete Todo ---
export async function deleteTodo(todoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await db.delete(todos).where(eq(todos.id, todoId));
  revalidatePath("/");
}

// --- Toggle Todo ---
export async function toggleTodo(todoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const currentTodo = await db.select().from(todos).where(eq(todos.id, todoId)).limit(1);
  if (currentTodo.length === 0) return;

  await db.update(todos)
    .set({ completed: !currentTodo[0].completed })
    .where(eq(todos.id, todoId));

  revalidatePath("/");
}