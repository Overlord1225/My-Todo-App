"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useOptimistic, useTransition } from "react";
import { Trash2, Check, Pencil, Calendar, X } from "lucide-react";
import { deleteTodo, toggleTodo, editTodo } from "@/app/actions";
import { todos } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import PriorityBadge from "./PriorityBadge";
import DatePicker from "./DatePicker";
import { format } from "date-fns";

type Todo = InferSelectModel<typeof todos>;
type FilterType = "all" | "active" | "completed";

// Priority sort order: High → Medium → Low
const priorityOrder = { high: 0, medium: 1, low: 2 };

export default function TodoList({
  initialTodos,
}: {
  initialTodos: Todo[];
}) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    initialTodos,
    (
      state,
      action: {
        type: "toggle" | "delete" | "edit";
        id: number;
        newTitle?: string;
        newPriority?: "low" | "medium" | "high";
        newDueDate?: string | null;
      }
    ) => {
      if (action.type === "delete") {
        return state.filter((todo) => todo.id !== action.id);
      }
      if (action.type === "toggle") {
        return state.map((todo) =>
          todo.id === action.id
            ? { ...todo, completed: !todo.completed }
            : todo
        );
      }
      if (action.type === "edit") {
        return state.map((todo) =>
          todo.id === action.id
            ? {
                ...todo,
                title: action.newTitle ?? todo.title,
                priority: action.newPriority ?? todo.priority,
                dueDate: action.newDueDate !== undefined ? action.newDueDate : todo.dueDate,
              }
            : todo
        );
      }
      return state;
    }
  );

  const [isPending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editDueDate, setEditDueDate] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  // Combined filter + search + sort
  const filteredTodos = optimisticTodos
    .filter((todo) => {
      // Status filter
      if (filter === "active" && todo.completed) return false;
      if (filter === "completed" && !todo.completed) return false;

      // Search filter
      if (searchTerm.trim()) {
        return todo.title.toLowerCase().includes(searchTerm.toLowerCase().trim());
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by priority (High → Low)
      const aPriority = a.priority || "medium";
      const bPriority = b.priority || "medium";
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    });

  const handleToggle = (id: number) => {
    startTransition(async () => {
      setOptimisticTodos({ type: "toggle", id });
      await toggleTodo(id);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      setOptimisticTodos({ type: "delete", id });
      await deleteTodo(id);
    });
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditPriority(todo.priority || "medium");
    setEditDueDate(todo.dueDate || null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = useCallback((id: number) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    startTransition(async () => {
      setOptimisticTodos({
        type: "edit",
        id,
        newTitle: trimmed,
        newPriority: editPriority,
        newDueDate: editDueDate,
      });
      await editTodo(id, trimmed, editPriority, editDueDate);
    });
    setEditingId(null);
  }, [editDueDate, editPriority, editTitle, setOptimisticTodos, startTransition]);

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent, todo: Todo) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startEditing(todo);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        editingId !== null &&
        editContainerRef.current &&
        !editContainerRef.current.contains(e.target as Node)
      ) {
        saveEdit(editingId);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingId, saveEdit]);

  // Filter button config
  const filterOptions: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 pb-2 sm:flex-row">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === opt.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search todos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="space-y-2">
      {filteredTodos.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">
          {searchTerm.trim() && "No todos match your search."}
          {!searchTerm.trim() && filter === "all" && "No todos yet. Add one above!"}
          {!searchTerm.trim() && filter === "active" && "🎉 All done! No active todos."}
          {!searchTerm.trim() && filter === "completed" && "No completed todos yet."}
        </p>
      ) : (
        filteredTodos.map((todo) => {
          const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

          return (
            <div
              key={todo.id}
              className={`flex items-center justify-between gap-3 rounded-lg border bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md ${
                isPending ? "opacity-50" : "opacity-100"
              } ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}
            >
              {/* Toggle Button */}
              <button
                onClick={() => handleToggle(todo.id)}
                className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors shrink-0 ${
                  todo.completed
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 hover:border-blue-500"
                }`}
                aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
              >
                {todo.completed && <Check size={14} className="text-white" />}
              </button>

              {/* Edit Mode */}
              {editingId === todo.id ? (
                <div ref={editContainerRef} className="flex-1 flex flex-col sm:flex-row gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, todo.id)}
                    className="h-9 flex-1 rounded-lg border border-blue-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    aria-label="Edit todo title"
                  />
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as "low" | "medium" | "high")}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <DatePicker
                    value={editDueDate}
                    onChange={setEditDueDate}
                    label="Pick due date"
                    compact
                    className="sm:w-40"
                  />
                </div>
              ) : (
                /* Display Mode */
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`cursor-pointer rounded-sm outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500/30 ${
                        todo.completed ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                      onClick={() => startEditing(todo)}
                      onDoubleClick={() => startEditing(todo)}
                      onKeyDown={(e) => handleTitleKeyDown(e, todo)}
                      role="button"
                      tabIndex={0}
                    >
                      {todo.title}
                    </span>
                    <PriorityBadge priority={todo.priority || "medium"} />
                    {todo.dueDate && (
                      <span className={`text-xs flex items-center gap-1 ${
                        isOverdue ? "text-red-600 font-medium" : "text-slate-400"
                      }`}>
                        <Calendar size={12} />
                        {format(new Date(todo.dueDate), "MMM d")}
                        {isOverdue && " (Overdue!)"}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {editingId !== todo.id && (
                  <button
                    onClick={() => startEditing(todo)}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    aria-label="Edit todo"
                  >
                    <Pencil size={16} />
                  </button>
                )}
                {editingId === todo.id && (
                  <button
                    onClick={cancelEdit}
                    className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Cancel edit"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete todo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
    </div>
  );
}
