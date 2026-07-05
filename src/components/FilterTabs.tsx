"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type FilterType = "all" | "active" | "completed";

export default function FilterTabs({ 
  currentFilter, 
  searchTerm,
  pendingTodos,
  completedTodos 
}: { 
  currentFilter: FilterType;
  searchTerm: string;
  pendingTodos: number;
  completedTodos: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const setFilter = (filter: FilterType) => {
    const params = new URLSearchParams();
    if (filter !== "all") params.set("filter", filter);
    if (searchTerm) params.set("search", searchTerm);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
            currentFilter === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
            currentFilter === "active"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
            currentFilter === "completed"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Completed
        </button>
      </div>
      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
        {currentFilter === "all" && `${pendingTodos} remaining`}
        {currentFilter === "active" && `${pendingTodos} active`}
        {currentFilter === "completed" && `${completedTodos} done`}
      </span>
    </div>
  );
}