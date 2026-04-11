"use client";

import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyGoalCardProps {
  id: string;
  text: string;
  completed: boolean;
  onToggle: () => void;
  onChange: (text: string) => void;
  onDelete: () => void;
  placeholder?: string;
}

// 5 colors matching YearlyGoals
const COLORS = [
  { border: "border-amber-500/40", hoverBorder: "hover:border-amber-500/80", checkText: "group-hover/btn:text-amber-500" },
  { border: "border-teal-500/40", hoverBorder: "hover:border-teal-500/80", checkText: "group-hover/btn:text-teal-500" },
  { border: "border-blue-500/40", hoverBorder: "hover:border-blue-500/80", checkText: "group-hover/btn:text-blue-500" },
  { border: "border-purple-500/40", hoverBorder: "hover:border-purple-500/80", checkText: "group-hover/btn:text-purple-500" },
  { border: "border-rose-500/40", hoverBorder: "hover:border-rose-500/80", checkText: "group-hover/btn:text-rose-500" },
];

export function MonthlyGoalCard({
  id,
  text,
  completed,
  onToggle,
  onChange,
  onDelete,
  placeholder = "Focus for this month...",
}: MonthlyGoalCardProps) {
  // Stable random color based on ID
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % COLORS.length;
  const theme = COLORS[colorIndex];

  return (
    <div
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 min-h-[220px] shadow-sm",
        completed
          ? "bg-zinc-900/20 border-zinc-900 opacity-50 grayscale"
          : cn("bg-zinc-900/60", theme.border, theme.hoverBorder)
      )}
    >
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full flex-1 bg-transparent border-none outline-none resize-none text-base font-medium leading-relaxed overflow-y-auto break-words",
          "placeholder:text-zinc-700/70",
          completed ? "line-through text-zinc-500" : "text-zinc-200"
        )}
      />

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
        <button
          onClick={onToggle}
          className={cn(
            "group/btn flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
            completed
              ? "bg-zinc-600 border-zinc-600 text-zinc-950"
              : "border-zinc-700 hover:border-zinc-500 bg-transparent"
          )}
        >
          {completed ? (
             <Check className="w-4 h-4" strokeWidth={3} />
          ) : (
             <Check className={cn("w-4 h-4 opacity-0 transition-opacity group-hover/btn:opacity-100", theme.checkText)} strokeWidth={3} />
          )}
        </button>

        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800/80 transition-all rounded-lg"
          title="Delete goal"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
