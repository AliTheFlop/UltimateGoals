"use client";

import { Check, Repeat, StickyNote, GripVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  text: string;
  completed: boolean;
  isDaily: boolean;
  hasNotes: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
}

export function TaskCard({
  text,
  completed,
  isDaily,
  hasNotes,
  onToggle,
  onClick,
  draggable,
  onDragStart,
  onDragEnter,
  onDragEnd,
  onDragOver,
}: TaskCardProps) {
  const [dragEnabled, setDragEnabled] = useState(false);

  return (
    <div
      onClick={onClick}
      draggable={draggable && dragEnabled}
      onDragStart={(e) => {
          if (onDragStart) onDragStart(e);
      }}
      onDragEnter={onDragEnter}
      onDragEnd={(e) => {
          if (onDragEnd) onDragEnd(e);
          setDragEnabled(false);
      }}
      onDragOver={onDragOver}
      className={cn(
        "group flex flex-col gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer shadow-sm relative",
        completed
          ? "bg-zinc-900/20 border-zinc-900 opacity-50 grayscale"
          : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div 
          className="mt-0.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity cursor-grab text-zinc-500 hover:text-amber-500"
          onMouseEnter={() => setDragEnabled(true)}
          onMouseLeave={() => setDragEnabled(false)}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 pointer-events-none" />
        </div>

        {/* Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevents opening modal when clicking checkbox
            onToggle(e);
          }}
          className={cn(
            "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5",
            completed
              ? "bg-amber-500 border-amber-500 text-zinc-950"
              : "border-zinc-600 hover:border-amber-500/50 bg-transparent"
          )}
        >
          {completed && <Check className="w-4 h-4" strokeWidth={3} />}
        </button>

        {/* Task Text & Indicators */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <p
            className={cn(
              "text-lg font-medium outline-none break-words leading-snug",
              completed ? "line-through text-zinc-500" : "text-zinc-200"
            )}
          >
            {text || "Untitled Task"}
          </p>

          {/* Indicators Row */}
          {(isDaily || hasNotes) && (
            <div className="flex items-center gap-3">
              {isDaily && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded-md uppercase tracking-wide">
                  <Repeat className="w-3 h-3" />
                  Daily
                </div>
              )}
              {hasNotes && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  <StickyNote className="w-3 h-3" />
                  Notes
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
