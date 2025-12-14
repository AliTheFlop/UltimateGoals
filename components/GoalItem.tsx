"use client";

import { Check, Trash2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface GoalItemProps {
  text: string;
  completed: boolean;
  onToggle: () => void;
  onChange: (text: string) => void;
  onDelete: () => void;
  placeholder?: string;
}

export function GoalItem({
  text,
  completed,
  onToggle,
  onChange,
  onDelete,
  placeholder = "Enter goal...",
}: GoalItemProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
        completed
          ? "bg-zinc-900/20 border-zinc-900 opacity-50"
          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
          completed
            ? "bg-amber-500 border-amber-500 text-zinc-950"
            : "border-zinc-600 hover:border-amber-500/50"
        )}
      >
        {completed && <Check className="w-4 h-4" strokeWidth={3} />}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent border-none outline-none text-lg placeholder:text-zinc-700",
          completed ? "line-through text-zinc-500" : "text-zinc-200"
        )}
      />

      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-opacity"
        title="Delete goal"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
