"use client";

import { useData, YearlyGoal } from "@/context/DataContext";
import { GoalItem } from "@/components/GoalItem";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function YearlyGoalsPage() {
  const { yearlyGoals, setYearlyGoals } = useData();
  const currentYear = new Date().getFullYear();

  const addGoal = () => {
    const newGoal: YearlyGoal = {
      id: crypto.randomUUID(),
      text: "",
      year: currentYear,
      completed: false,
    };
    setYearlyGoals([...yearlyGoals, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<YearlyGoal>) => {
    setYearlyGoals(
      yearlyGoals.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const deleteGoal = (id: string) => {
    setYearlyGoals(yearlyGoals.filter((g) => g.id !== id));
  };

  // Filter for current year if I implement year switching later, for now just show all or strict filter?
  // Let's filter by current year to strictly follow logic, though context holds all.
  const displayedGoals = yearlyGoals.filter(g => g.year === currentYear);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-end justify-between">
        <div>
          <span className="text-sm font-medium text-amber-500 tracking-wider uppercase">Yearly Focus</span>
          <h1 className="text-4xl font-bold mt-2 text-zinc-100">
            {currentYear} Goals
          </h1>
          <p className="text-zinc-500 mt-2">
            Specific, measurable outcomes for this year.
          </p>
        </div>
        <button
          onClick={addGoal}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </header>

      <div className="space-y-4">
        {displayedGoals.length === 0 && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-600">No goals set for {currentYear} yet.</p>
            <button onClick={addGoal} className="text-amber-500 hover:underline mt-2 text-sm">Create one now</button>
          </div>
        )}
        
        {displayedGoals.map((goal) => (
          <GoalItem
            key={goal.id}
            text={goal.text}
            completed={goal.completed}
            onToggle={() => updateGoal(goal.id, { completed: !goal.completed })}
            onChange={(text) => updateGoal(goal.id, { text })}
            onDelete={() => deleteGoal(goal.id)}
            placeholder="I will achieve..."
          />
        ))}
      </div>
    </div>
  );
}
