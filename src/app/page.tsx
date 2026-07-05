import { addTodo, deleteTodo, toggleTodo } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./auth/actions";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Trash2, Check } from "lucide-react"; // Importing beautiful icons

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

  // Fetch todos
  const userTodos = await db.select().from(todos).where(eq(todos.userId, user.id));

  return (
    <main className="min-h-screen p-8 max-w-md mx-auto">
      {/* Header */}
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

      {/* Add Todo Form */}
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

      {/* THE UPGRADED TODO LIST */}
      <div className="space-y-2">
        {userTodos.length === 0 ? (
          <p className="text-gray-500 text-center">No todos yet. Add one above!</p>
        ) : (
          userTodos.map((todo) => (
            <div key={todo.id} className="flex items-center justify-between gap-3 border p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              
              {/* Toggle Complete Form */}
              <form action={toggleTodo.bind(null, todo.id)} className="flex items-center gap-3 flex-1 cursor-pointer">
                <button 
                  type="submit" 
                  className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors ${
                    todo.completed 
                      ? 'bg-green-500 border-green-500' 
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {todo.completed && <Check size={14} className="text-white" />}
                </button>
                <span className={`text-gray-800 ${todo.completed ? "line-through text-gray-400" : ""}`}>
                  {todo.title}
                </span>
              </form>

              {/* Delete Form */}
              <form action={deleteTodo.bind(null, todo.id)}>
                <button 
                  type="submit" 
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </main>
  );
}