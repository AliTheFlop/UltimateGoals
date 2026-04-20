"use client";

import { useData, MonthlyGoal } from "@/context/DataContext";
import { MonthlyGoalCard } from "@/components/MonthlyGoalCard";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useMemo } from "react";

export default function MonthlyGoalsPage() {
  const { monthlyGoals, setMonthlyGoals } = useData();
  const [date, setDate] = useState(new Date());

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const monthName = date.toLocaleString("default", { month: "long" });

  const navigateMonth = (direction: -1 | 1) => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + direction);
    setDate(newDate);
  };

  // Sort by order safely
  const displayedGoals = useMemo(() => {
    return [...monthlyGoals]
      .filter((g) => g.month === currentMonth && g.year === currentYear)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [monthlyGoals, currentMonth, currentYear]);

  // --- Drag and Drop State ---
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = index;
  };
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    dragOverItem.current = index;
  };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        const newDisplayed = [...displayedGoals];
        const draggedGoal = newDisplayed.splice(dragItem.current, 1)[0];
        newDisplayed.splice(dragOverItem.current, 0, draggedGoal);
        
        const updatedGoals = newDisplayed.map((goal, i) => ({ ...goal, order: i }));
        
        setMonthlyGoals(monthlyGoals.map(g => {
            const found = updatedGoals.find(ug => ug.id === g.id);
            return found ? found : g;
        }));
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const addGoal = () => {
    const newGoal: MonthlyGoal = {
      id: crypto.randomUUID(),
      text: "",
      month: currentMonth,
      year: currentYear,
      completed: false,
      order: displayedGoals.length,
    };
    setMonthlyGoals([...monthlyGoals, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<MonthlyGoal>) => {
    setMonthlyGoals(
      monthlyGoals.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const deleteGoal = (id: string) => {
    setMonthlyGoals(monthlyGoals.filter((g) => g.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-amber-500 tracking-wider uppercase">Monthly Focus</span>
          <div className="flex items-center gap-4 mt-2">
            <h1 className="text-xl md:text-4xl font-bold text-zinc-100 min-w-[200px] md:min-w-[250px]">
              {monthName} {currentYear}
            </h1>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
               <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronLeft className="w-5 h-5"/>
               </button>
               <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronRight className="w-5 h-5"/>
               </button>
            </div>
          </div>
          <p className="text-zinc-500 mt-2">
            What actually changes if this month goes well?
          </p>
        </div>
        <button
          onClick={addGoal}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Goal
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {displayedGoals.length === 0 && (
          <div className="col-span-full text-center py-32 border border-dashed border-zinc-800 rounded-2xl">
            <p className="text-zinc-600 text-lg">No focus set for {monthName} yet.</p>
            <button onClick={addGoal} className="text-amber-500 hover:text-amber-400 transition-colors mt-3 font-medium">Create one now</button>
          </div>
        )}
        
        {displayedGoals.map((goal, index) => (
          <MonthlyGoalCard
            key={goal.id}
            id={goal.id}
            text={goal.text}
            completed={goal.completed}
            onToggle={() => updateGoal(goal.id, { completed: !goal.completed })}
            onChange={(text) => updateGoal(goal.id, { text })}
            onDelete={() => deleteGoal(goal.id)}
            placeholder={`Focus for ${monthName}...`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
          />
        ))}
      </div>
    </div>
  );
}
