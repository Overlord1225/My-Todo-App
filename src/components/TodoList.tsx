"use client";

import { useState, useRef, useEffect } from "react";
import { useOptimistic, useTransition } from "react";
import { Trash2, Check, Pencil } from "lucide-react";
import { deleteTodo, toggleTodo, editTodo } from "@/app/actions";
import { todos } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Todo = InferSelectModel<typeof todos>;
type FilterType = "all" | "active" | "completed";

export default function TodoList({
  initialTodos,
}: {
  initialTodos: Todo[];
}) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    initialTodos,
    (state, action: {
      type: "toggle" | "delete" | "edit" | "reset";
      id?: number;
      newTitle?: string;
      todos?: Todo[];
    }) => {
      if (action.type === "delete" && action.id !== undefined) {
        return state.filter((todo) => todo.id !== action.id);
      }
      if (action.type === "toggle" && action.id !== undefined) {
        return state.map((todo) =>
          todo.id === action.id
            ? { ...todo, completed: !todo.completed }
            : todo
        );
      }
      if (action.type === "edit" && action.id !== undefined && action.newTitle) {
        return state.map((todo) =>
          todo.id === action.id
            ? { ...todo, title: action.newTitle! }
            : todo
        );
      }
      if (action.type === "reset" && action.todos) {
        return action.todos;
      }
      return state;
    }
  );

  const [isPending, startTransition] = useTransition();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTodos = optimisticTodos.filter((todo) => {
    if (filter === "active" && todo.completed) return false;
    if (filter === "completed" && !todo.completed) return false;

    if (searchTerm.trim()) {
      return todo.title.toLowerCase().includes(searchTerm.toLowerCase().trim());
    }

    return true;
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
    setEditValue(todo.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = (id: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    setOptimisticTodos({ type: "edit", id, newTitle: trimmed });
    startTransition(async () => {
      await editTodo(id, trimmed);
    });
    setEditingId(null);
  };

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

  useEffect(() => {
    setOptimisticTodos({ type: "reset", todos: initialTodos });
  }, [initialTodos, setOptimisticTodos]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingId !== null && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        saveEdit(editingId);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingId, editValue]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search todos..."
            className="w-full px-3 py-2 pl-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
            aria-label="Search todos"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? "All" : f === "active" ? "Active" : "Completed"}
          </button>
        ))}
      </div>

      {/* Todo List */}
      <div className="space-y-2">
      {filteredTodos.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">
          {searchTerm.trim() && "No todos match your search."}
          {!searchTerm.trim() && filter === "all" && "No todos yet. Add one above!"}
          {!searchTerm.trim() && filter === "active" && "🎉 All done! No active todos."}
          {!searchTerm.trim() && filter === "completed" && "No completed todos yet."}
        </p>
      ) : (
        filteredTodos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center justify-between gap-3 border p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
              isPending ? "opacity-50" : "opacity-100"
            }`}
          >
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

            {editingId === todo.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, todo.id)}
                className="flex-1 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Edit todo title"
              />
            ) : (
              <span
                className={`flex-1 text-gray-800 cursor-pointer ${
                  todo.completed ? "line-through text-gray-400" : ""
                }`}
                onClick={() => startEditing(todo)}
                onDoubleClick={() => startEditing(todo)}
                role="button"
                tabIndex={0}
                aria-label="Edit todo"
              >
                {/* Highlight matching search term */}
                {searchTerm.trim() ? (
                  <HighlightText text={todo.title} highlight={searchTerm.trim()} />
                ) : (
                  todo.title
                )}
              </span>
            )}

            <div className="flex items-center gap-2">
              {editingId !== todo.id && (
                <button
                  onClick={() => startEditing(todo)}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label="Edit todo"
                >
                  <Pencil size={16} />
                </button>
              )}
              <button
                onClick={() => handleDelete(todo.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Delete todo"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
    </div>
  );
}

// Helper component for highlighting search matches
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 rounded px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}