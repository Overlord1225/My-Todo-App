import { addTodo } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./auth/actions";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no user, show a login prompt
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

  // FETCH todos for this specific user from the database
  let userTodos = [];
  try {
    userTodos = await db.select().from(todos).where(eq(todos.userId, user.id));
  } catch (error: any) {
    console.error("Database error:", error);
    // Show the error on the page so you can see what's wrong
    return (
      <main className="min-h-screen p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Database Error</h1>
        <p className="text-gray-700 mb-2">Failed to fetch todos:</p>
        <pre className="bg-red-50 p-4 rounded-lg text-sm text-red-800 overflow-auto">
          {error?.message || "Unknown error"}
        </pre>
        <a href="/login" className="text-blue-600 hover:underline mt-4 block">Go back</a>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-md mx-auto">
      {/* Header with Logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Todo List</h1>
        <form action={signOut}>
          <button 
            type="submit" 
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
          >
            Logout
          </button>
        </form>
      </div>
      
      <p className="text-gray-600 mb-4">Welcome, {user?.email}!</p>

      {/* ADD TODO FORM */}
      <form action={addTodo} className="flex gap-2 mb-6">
        <input 
          name="title" 
          type="text" 
          placeholder="Enter a todo..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button 
          type="submit" 
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </form>

      {/* DISPLAY THE LIST OF TODOS */}
      <div className="space-y-2">
        {userTodos.length === 0 ? (
          <p className="text-gray-500 text-center">No todos yet. Add one above!</p>
        ) : (
          userTodos.map((todo) => (
            <div key={todo.id} className="flex items-center justify-between border p-3 rounded-lg shadow-sm">
              <span className={todo.completed ? "line-through text-gray-400" : "text-gray-800"}>
                {todo.title}
              </span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}