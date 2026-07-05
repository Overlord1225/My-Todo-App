import { addTodo } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./auth/actions";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq } from "drizzle-orm";
import TodoList from "@/components/TodoList";
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
    <main className="min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      {/* Main Container */}
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ListTodo className="w-8 h-8 text-blue-600" />
              My Todo List
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, {user.email}
            </p>
          </div>
          <form action={signOut}>
            <button 
              type="submit" 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </form>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
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
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
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
          
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
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

        {/* Two-Column Layout: Add Todo + List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Add Todo Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm sticky top-8">
              <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Task
              </h2>
              <form action={addTodo} className="space-y-3">
                <input
                  name="title"
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                  required
                />
                <button 
                  type="submit" 
                  className="w-full btn-primary text-sm font-medium"
                >
                  Add Task
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Todo List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700">
                  Your Tasks
                </h2>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  {pendingTodos} remaining
                </span>
              </div>
              <TodoList initialTodos={userTodos} />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}