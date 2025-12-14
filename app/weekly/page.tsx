"use client";

import { useData, WeeklyPlan, Task } from "@/context/DataContext";
import { GoalItem } from "@/components/GoalItem";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState, useMemo } from "react";

// Helper to get Monday of the current week
function getStartOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function WeeklyPlanningPage() {
  const { weeklyPlans, setWeeklyPlans } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekKey = weekStart.toISOString().split("T")[0]; // YYYY-MM-DD

  // Find existing plan or use default empty state (don't save until edit?)
  // Actually easier to just find.
  const planIndex = weeklyPlans.findIndex((p) => p.weekStart === weekKey);
  const plan = planIndex !== -1 ? weeklyPlans[planIndex] : null;

  const navigateWeek = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const savePlan = (updatedPlan: WeeklyPlan) => {
    if (planIndex !== -1) {
      const newPlans = [...weeklyPlans];
      newPlans[planIndex] = updatedPlan;
      setWeeklyPlans(newPlans);
    } else {
      setWeeklyPlans([...weeklyPlans, updatedPlan]);
    }
  };

  const updateBigGoal = (text: string) => {
    const newPlan = plan || {
      id: crypto.randomUUID(),
      weekStart: weekKey,
      bigGoal: "",
      tasks: [],
    };
    savePlan({ ...newPlan, bigGoal: text });
  };

  const addTask = () => {
    const newPlan = plan || {
      id: crypto.randomUUID(),
      weekStart: weekKey,
      bigGoal: "",
      tasks: [],
    };
    const newTask: Task = {
      id: crypto.randomUUID(),
      text: "",
      completed: false,
    };
    savePlan({ ...newPlan, tasks: [...newPlan.tasks, newTask] });
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    if (!plan) return;
    const newTasks = plan.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );
    savePlan({ ...plan, tasks: newTasks });
  };

  const deleteTask = (taskId: string) => {
    if (!plan) return;
    const newTasks = plan.tasks.filter((t) => t.id !== taskId);
    savePlan({ ...plan, tasks: newTasks });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-amber-500 tracking-wider uppercase">Weekly Plan</span>
          <div className="flex items-center gap-4 mt-2">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 min-w-[300px]">
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </h1>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
               <button onClick={() => navigateWeek(-1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronLeft className="w-5 h-5"/>
               </button>
               <button onClick={() => navigateWeek(1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronRight className="w-5 h-5"/>
               </button>
            </div>
          </div>
          <p className="text-zinc-500 mt-2">
            One Big Goal + 3-4 Key Tasks. Keep it simple.
          </p>
        </div>
      </header>

      <div className="space-y-8">
        {/* ONE BIG GOAL */}
        <section className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50">
            <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                One Big Goal
            </h3>
            <textarea
                value={plan?.bigGoal || ""}
                onChange={(e) => updateBigGoal(e.target.value)}
                placeholder="The single most important thing this week..."
                className="w-full bg-transparent text-2xl font-bold text-zinc-100 placeholder:text-zinc-700 outline-none resize-none"
                rows={2}
            />
        </section>

        {/* TASKS */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-300">Supporting Tasks</h3>
                <button
                    onClick={addTask}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-500 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>
            
            <div className="space-y-3">
                {plan?.tasks.length === 0 && (
                     <p className="text-zinc-600 text-sm italic">Add tasks that help you achieve the Big Goal.</p>
                )}
                {plan?.tasks.map((task) => (
                    <GoalItem
                        key={task.id}
                        text={task.text}
                        completed={task.completed}
                        onToggle={() => updateTask(task.id, { completed: !task.completed })}
                        onChange={(text) => updateTask(task.id, { text })}
                        onDelete={() => deleteTask(task.id)}
                        placeholder="Task..."
                    />
                ))}
            </div>
        </section>
      </div>
    </div>
  );
}
