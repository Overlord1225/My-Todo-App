"use server";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// --- Your existing Add Todo ---
export async function addTodo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  
  await db.insert(todos).values({
    title: title,
    userId: user.id,
  });

  revalidatePath("/"); // Refresh the homepage data
}

// --- NEW: Delete a Todo ---
export async function deleteTodo(todoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await db.delete(todos).where(eq(todos.id, todoId));
  
  revalidatePath("/"); // Refresh the list
}

// --- NEW: Toggle Complete/Incomplete ---
export async function toggleTodo(todoId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Fetch the current todo to check its current state
  const currentTodo = await db.select().from(todos).where(eq(todos.id, todoId)).limit(1);
  if (currentTodo.length === 0) return;

  // 2. Flip the completed status
  const newCompleted = !currentTodo[0].completed;

  // 3. Update the database
  await db.update(todos)
    .set({ completed: newCompleted })
    .where(eq(todos.id, todoId));

  revalidatePath("/"); // Refresh the list
}

export async function editTodo(todoId: number, newTitle: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!newTitle.trim()) {
    throw new Error("Title cannot be empty");
  }

  await db.update(todos)
    .set({ title: newTitle.trim() })
    .where(eq(todos.id, todoId));

  revalidatePath("/");
}