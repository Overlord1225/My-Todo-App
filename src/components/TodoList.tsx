"use client";

import { useOptimistic, useTransition } from "react";
import { Trash2, Check } from "lucide-react";
import { deleteTodo, toggleTodo } from "@/app/actions";

type Todo = {
  id: number;
  title: string;
  completed: boolean | null;
  userId: string;
  createdAt: Date | null;
};

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    initialTodos,
    (state, action: { type: "toggle" | "delete"; id: number }) => {
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
      return state;
    }
  );

  const [isPending, startTransition] = useTransition();

  const handleToggle = (id: number) => {
    startTransition(async () => {
      // 1. Immediately update the UI
      setOptimisticTodos({ type: "toggle", id });
      // 2. Run the Server Action in the background
      await toggleTodo(id);
    });
  };

  const handleDelete = (id: number) => {
    startTransition(async () => {
      // 1. Immediately remove from UI
      setOptimisticTodos({ type: "delete", id });
      // 2. Run the Server Action in the background
      await deleteTodo(id);
    });
  };

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
            >
              {todo.completed && <Check size={14} className="text-white" />}
            </button>

            <span
              className={`flex-1 text-gray-800 ${
                todo.completed ? "line-through text-gray-400" : ""
              }`}
            >
              {todo.title}
            </span>

            {/* Delete Button */}
            <button
              onClick={() => handleDelete(todo.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}