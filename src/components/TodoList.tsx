"use client";

import { useState, useRef, useEffect } from "react";
import { useOptimistic, useTransition } from "react";
import { Trash2, Check, Pencil } from "lucide-react";
import { deleteTodo, toggleTodo, editTodo } from "@/app/actions";
import { todos } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";

type Todo = InferSelectModel<typeof todos>;

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    initialTodos,
    (state, action: { type: "toggle" | "delete" | "edit"; id: number; newTitle?: string }) => {
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
      if (action.type === "edit" && action.newTitle) {
        return state.map((todo) =>
          todo.id === action.id
            ? { ...todo, title: action.newTitle! }
            : todo
        );
      }
      return state;
    }
  );

  const [isPending, startTransition] = useTransition();

  // Track which todo is being edited
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
    // Focus input after render
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const saveEdit = (id: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      // If empty, revert to original
      setEditingId(null);
      return;
    }
    // Optimistically update
    setOptimisticTodos({ type: "edit", id, newTitle: trimmed });
    // Actually save
    startTransition(async () => {
      await editTodo(id, trimmed);
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Keyboard handlers
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

  // Click outside to save
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
    <div className="space-y-2">
      {optimisticTodos.length === 0 ? (
        <p className="text-gray-500 text-center">No todos yet. Add one above!</p>
      ) : (
        optimisticTodos.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center justify-between gap-3 border p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
              isPending ? "opacity-50" : "opacity-100"
            }`}
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

            {/* Title with Edit */}
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
                {todo.title}
              </span>
            )}

            <div className="flex items-center gap-2">
              {/* Edit Button (pencil) */}
              {editingId !== todo.id && (
                <button
                  onClick={() => startEditing(todo)}
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                  aria-label="Edit todo"
                >
                  <Pencil size={16} />
                </button>
              )}

              {/* Delete Button */}
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
  );
}