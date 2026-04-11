"use client";

import { X, Trash2, Repeat } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Task } from "@/context/DataContext";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSave: (updates: Partial<Task>) => void;
  onDelete: () => void;
}

export function TaskModal({ isOpen, onClose, task, onSave, onDelete }: TaskModalProps) {
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [isDaily, setIsDaily] = useState(false);
  const [shake, setShake] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setText(task.text || "");
      setNotes(task.notes || "");
      setIsDaily(task.frequency === "daily");
      setShowWarning(false);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    onSave({
      text,
      notes,
      frequency: isDaily ? "daily" : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  const handleBackgroundClick = () => {
    const hasChanges = 
      text !== (task.text || "") || 
      notes !== (task.notes || "") || 
      isDaily !== (task.frequency === "daily");

    if (hasChanges) {
      setShake(true);
      setShowWarning(true);
      setTimeout(() => setShake(false), 200); // Duration matches CSS keyframes
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      onClick={handleBackgroundClick}
    >
      <div 
        className={cn(
          "bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 flex flex-col gap-6 shadow-xl relative",
          shake && "animate-shake"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-100">Edit Task</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-5">
          {/* Main Task Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Task Name</label>
            <textarea
              autoFocus
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What do you need to do?"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 outline-none focus:border-amber-500/50 resize-none text-lg leading-snug placeholder:text-zinc-700"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Details & Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details or links needed..."
              className="w-full bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 text-zinc-300 outline-none focus:border-indigo-500/50 resize-none text-sm placeholder:text-zinc-700 font-mono"
            />
          </div>

          {/* Settings Row */}
          <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800/50 rounded-xl mt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Repeat className="w-4 h-4" />
              </div>
              <span className="font-medium text-zinc-300">Daily Routine</span>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              onClick={() => setIsDaily(!isDaily)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isDaily ? "bg-amber-500" : "bg-zinc-700/50"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isDaily ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {showWarning && (
          <div className="text-amber-500 text-xs font-bold uppercase tracking-wider text-center animate-pulse -mt-4">
            ⚠️ You have unsaved changes
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-800">
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
