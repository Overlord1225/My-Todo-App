import { addTodo } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./auth/actions";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq } from "drizzle-orm";
import TodoList from "@/components/TodoList";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </main>
    );
  }

  const userTodos = await db.select().from(todos).where(eq(todos.userId, user.id));

  return (
    <main className="min-h-screen p-8 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Todo List</h1>
        <form action={signOut}>
          <button type="submit" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm">
            Logout
          </button>
        </form>
      </div>

      <p className="text-gray-600 mb-4">Welcome, {user?.email}!</p>

      <form action={addTodo} className="flex gap-2 mb-6">
        <input
          name="title"
          type="text"
          placeholder="Enter a todo..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Add
        </button>
      </form>

      <TodoList initialTodos={userTodos} />
    </main>
  );
}