"use client";

import { useData } from "@/context/DataContext";
import { useEffect, useState, useRef } from "react";

export default function UltimateGoalPage() {
  const { ultimateGoal, setUltimateGoal } = useData();
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with context on load
  useEffect(() => {
    setValue(ultimateGoal);
  }, [ultimateGoal]);

  // Handle Input
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setUltimateGoal(newValue);
    adjustHeight();
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <span className="text-sm font-medium text-amber-500 tracking-wider uppercase">The Destination</span>
        <h1 className="text-2xl md:text-5xl font-bold mt-2 text-zinc-100">
          Your Ultimate Goal
        </h1>
        <p className="text-zinc-500 mt-4 text-base md:text-lg max-w-2xl">
          What is the one big outcome you want your life to move toward over the next three years?
          This defines everything else.
        </p>
      </header>

      <section className="relative group">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder="In 3 years, I want to be..."
          className="w-full bg-zinc-900/30 text-lg md:text-3xl font-serif leading-relaxed text-zinc-200 placeholder:text-zinc-700 border-l-4 border-amber-500/20 focus:border-amber-500 outline-none p-4 md:p-8 min-h-[300px] resize-none rounded-r-lg transition-all duration-300 focus:bg-zinc-900/50"
          spellCheck={false}
        />
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-zinc-600">Auto-saving</span>
        </div>
      </section>
      
      <div className="pt-12 border-t border-zinc-900">
        <h3 className="text-zinc-500 font-medium mb-4">Why this matters</h3>
        <p className="text-zinc-600 max-w-xl">
            This goal acts as your North Star. When you plan your year, month, or week, ask yourself: 
            "Does this help me get closer to this goal?"
        </p>
      </div>
    </div>
  );
}
