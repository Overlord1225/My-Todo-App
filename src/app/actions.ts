"use server";

import { db } from "@/db";
import { todos } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

export async function addTodo(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Guard against unauthenticated users or missing IDs
  if (!user || !user.id) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;

  // 2. user.id is now strictly typed as a string here
  await db.insert(todos).values({
    title: title,
    userId: user.id, 
  });
}
