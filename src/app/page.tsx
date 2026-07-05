import { addTodo } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./auth/actions";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq } from "drizzle-orm";
import TodoList from "@/components/TodoList";
import { CheckCircle, Circle, ListTodo, LogOut, Plus, X } from "lucide-react";
import Link from "next/link";

type FilterType = "all" | "active" | "completed";

function getFilterFromURL(searchParams: { filter?: string }): FilterType {
  const filter = searchParams.filter;
  if (filter === "active" || filter === "completed") return filter;
  return "all";
}

export default async function Home({
  searchParams,
}: {
  searchParams: { filter?: string; search?: string };
}) {
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

  const currentFilter = getFilterFromURL(searchParams);
  const searchTerm = searchParams?.search || "";

  // Build URL helper
  const buildFilterUrl = (filter: FilterType) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (searchTerm) params.set("search", searchTerm);
    return `/?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
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

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Add Todo */}
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
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  Add Task
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Todo List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              
              {/* Search Bar */}
              <div className="mb-4">
                <form method="GET" action="/" className="relative">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchTerm}
                    placeholder="Search todos..."
                    className="w-full px-3 py-2 pl-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchTerm && (
                    <a
                      href={buildFilterUrl(currentFilter)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </a>
                  )}
                </form>
              </div>
              
              {/* Filter Tabs - Using plain links for reliability */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  <a
                    href={buildFilterUrl("all")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                      currentFilter === "all"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    All
                  </a>
                  <link
                    href={buildFilterUrl("active")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                      currentFilter === "active"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Active
                  </link>
                  <link
                    href={buildFilterUrl("completed")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                      currentFilter === "completed"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Completed
                  </link>
                </div>
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  {currentFilter === "all" && `${pendingTodos} remaining`}
                  {currentFilter === "active" && `${pendingTodos} active`}
                  {currentFilter === "completed" && `${completedTodos} done`}
                </span>
              </div>

              <TodoList 
                initialTodos={userTodos} 
                filter={currentFilter} 
                searchTerm={searchTerm} 
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}