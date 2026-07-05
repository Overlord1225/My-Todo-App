import { addTodo } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./auth/actions";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq } from "drizzle-orm";
import TodoList from "@/components/TodoList";
import DatePicker from "@/components/DatePicker";
import { CheckCircle, Circle, ListTodo, LogOut, Plus } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
        </div>
      </main>
    );
  }

  const userTodos = await db.select().from(todos).where(eq(todos.userId, user.id));

  const totalTodos = userTodos.length;
  const completedTodos = userTodos.filter(t => t.completed).length;
  const pendingTodos = totalTodos - completedTodos;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-950 tracking-tight flex items-center gap-3">
              <ListTodo className="w-8 h-8 text-blue-600" />
              My Todo Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, {user.email}
            </p>
          </div>
          <form action={signOut}>
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Tasks</p>
                <p className="text-2xl font-bold text-slate-900">{totalTodos}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <ListTodo className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedTodos}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{pendingTodos}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <Circle className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          {/* Left Column: Add Todo */}
          <div>
            <div className="sticky top-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Plus className="h-4 w-4 text-blue-600" />
                Add New Task
              </h2>
              <form action={addTodo} className="space-y-3">
                <input
                  name="title"
                  type="text"
                  placeholder="What needs to be done?"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  required
                />
                
                <select
                  name="priority"
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  defaultValue="medium"
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>

                <DatePicker name="dueDate" label="Pick a due date" />
                
                <button 
                  type="submit" 
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Todo List */}
          <div>
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <TodoList initialTodos={userTodos} />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
