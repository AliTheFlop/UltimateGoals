"use client";

import { Check, Trash2, X, StickyNote, Repeat } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface GoalItemProps {
  text: string;
  completed: boolean;
  notes?: string;
  frequency?: string;
  onToggle: () => void;
  onChange: (text: string) => void;
  onNotesChange?: (notes: string) => void;
  onFrequencyChange?: (freq: "daily" | "weekly" | "monthly") => void;
  onDelete: () => void;
  placeholder?: string;
}

export function GoalItem({
  text,
  completed,
  notes = "",
  frequency,
  onToggle,
  onChange,
  onNotesChange,
  onFrequencyChange,
  onDelete,
  placeholder = "Enter goal...",
}: GoalItemProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize task text
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [text]);

  // Auto-resize notes
  useEffect(() => {
    if (showNotes && notesRef.current) {
      notesRef.current.style.height = "auto";
      notesRef.current.style.height = notesRef.current.scrollHeight + "px";
    }
  }, [notes, showNotes]);

  return (
    <div
      className={cn(
        "group flex flex-col gap-2 p-3 md:p-4 rounded-xl border transition-all duration-200 relative",
        completed
          ? "bg-zinc-900/20 border-zinc-900 opacity-50"
          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60"
      )}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <button
          onClick={onToggle}
          className={cn(
            "flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-1",
            completed
              ? "bg-amber-500 border-amber-500 text-zinc-950"
              : "border-zinc-600 hover:border-amber-500/50"
          )}
        >
          {completed && <Check className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              onChange(e.target.value);
              // Immediate resize
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "flex-1 bg-transparent border-none outline-none text-base md:text-lg placeholder:text-zinc-700 w-full resize-none overflow-hidden break-words min-h-[28px]",
              completed ? "line-through text-zinc-500" : "text-zinc-200"
            )}
          />
          {/* Snippet View */}
          {!showNotes && notes && (
            <div onClick={() => setShowNotes(true)} className="cursor-pointer text-xs text-zinc-500 line-clamp-1 hover:text-zinc-400">
              <StickyNote className="w-3 h-3 inline mr-1 -mt-0.5" />
              {notes}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 self-start">
          {/* Frequency Toggle */}
          <div className="relative group/freq">
            <button
              title="Frequency"
              className={cn(
                "p-2 transition-colors rounded hover:bg-zinc-800",
                frequency ? "text-amber-500" : "text-zinc-600 opacity-0 group-hover:opacity-100"
              )}
            >
              <Repeat className="w-4 h-4" />
              {frequency && <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-amber-500 text-zinc-950 px-1 rounded-sm uppercase">{frequency[0]}</span>}
            </button>
            {/* Simple Hover Dropdown for Frequency */}
            <div className="absolute right-0 top-full mt-1 hidden group-hover/freq:block hover:block z-20 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl p-1">
              {(['daily', 'weekly', 'monthly'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => onFrequencyChange?.(frequency === f ? undefined : f as any)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-xs rounded uppercase font-bold",
                    frequency === f ? "bg-amber-500/20 text-amber-500" : "text-zinc-400 hover:bg-zinc-800"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={cn(
              "p-2 transition-colors rounded hover:bg-zinc-800",
              notes ? "text-indigo-400" : "text-zinc-600 opacity-0 group-hover:opacity-100"
            )}
            title="Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-opacity rounded hover:bg-zinc-800"
            title="Delete goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Notes Editor */}
      {showNotes && (
        <div className="pl-9 pr-2 animate-in slide-in-from-top-2 duration-200">
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder="Add notes..."
            className="w-full bg-zinc-900/50 rounded-lg p-3 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none border border-zinc-800/50 focus:border-indigo-500/50 resize-none overflow-hidden min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
}
