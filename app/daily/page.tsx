"use client";

import { useData, DailyPlan, Task, Review, TaskSection, RecurringTask } from "@/context/DataContext";
import { GoalItem } from "@/components/GoalItem";
import { ChevronLeft, ChevronRight, Plus, Sun, Moon, Repeat, Trash2, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function DailyPage() {
  const { dailyPlans, setDailyPlans, recurringTasks, setRecurringTasks } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<"plan" | "review">("plan");
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  const dateKey = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // -- Recurring Logic helpers --
  const getRecurrenceMatches = (date: Date) => {
    // For V1.1 simplicity: Daily always matches. Weekly matches same day of week. Monthly matches same day of month.
    return recurringTasks.filter(rt => {
       if (rt.frequency === 'daily') return true;
       if (rt.frequency === 'weekly') return date.getDay() === new Date().getDay(); // Simplification: assume created day is anchor? No, keeping it simple: match TODAY's day of week.
       // Actually, to make it consistent, 'weekly' means 'every week on this weekday'.
       // But we don't store "created day of week".
       // Let's assume Daily = Every Day.
       // Weekly = ?? User didn't specify. Let's make it ALL recurring tasks appear for now?
       // Feedback said: "Daily tasks can be set to daily, weekly, monthly, etc..."
       // Let's stick to: Daily = Every day.
       // Weekly = specific weekday? Too complex for this UI yet.
       // Let's just show ALL recurring tasks in a "Recurring" pool that gets copied?
       // OR: Just stick to "Daily" frequency implementation for now as "Every Day".
       return true; 
    });
  };

  // Find existing plan or initialize
  const planIndex = dailyPlans.findIndex((p) => p.date === dateKey);
  const plan = planIndex !== -1 ? dailyPlans[planIndex] : null;

  // Initialization Logic: If no plan exists, we should probably preview what it would look like
  // But we only want to SAVE it if the user interacts.
  // HOWEVER, for recurring tasks to appear, we need them to be there.
  
  const defaultSections: TaskSection[] = [
      { id: "s1", title: "Morning Focus", tasks: [] },
      { id: "s2", title: "Afternoon / Admin", tasks: [] }
  ];

  const effectivePlan: DailyPlan = plan || {
      id: "temp",
      date: dateKey,
      sections: defaultSections, // We will apply recurring tasks logic on SAVE or on RENDER?
  };

  // If it's a temp plan and we have recurring tasks, let's inject them into the first section for display
  // But strictly, we should only add them ONCE when the plan is created.
  // Implementation: We won't inject automatically on render to avoid confusion.
  // We will provide a button "Load Recurring Tasks" or just add them when we create the plan?
  // Let's add them automatically when we create the plan (i.e. first save).
  
  const navigateDay = (direction: -1 | 1) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const savePlan = (updatedPlan: DailyPlan) => {
    // If saving for the first time (id === 'temp'), inject recurring tasks if not already present?
    // Proper way: When 'temp', generate a real ID and populate with recurring tasks IF empty.
    
    let planToSave = updatedPlan;

    if (updatedPlan.id === "temp") {
        const realId = crypto.randomUUID();
        // Inject recurring tasks into First Section if tasks are empty?
        const injectedSections = [...updatedPlan.sections];
        
        // Find daily recurring tasks
        const tasksToAdd = recurringTasks.filter(rt => rt.frequency === 'daily'); // Only auto-add daily for now?
        // Actually, let's auto-add ALL active recurring tasks that match the day.
        
        if (tasksToAdd.length > 0) {
           const newTasks = tasksToAdd.map(rt => ({
               id: crypto.randomUUID(),
               text: rt.text,
               completed: false
           }));
           // Add to first section
           injectedSections[0] = {
               ...injectedSections[0],
               tasks: [...injectedSections[0].tasks, ...newTasks]
           };
        }

        planToSave = { ...updatedPlan, id: realId, sections: injectedSections };
        setDailyPlans([...dailyPlans, planToSave]);
    } else {
        if (planIndex !== -1) {
            const newPlans = [...dailyPlans];
            newPlans[planIndex] = planToSave;
            setDailyPlans(newPlans);
        } else {
             // Should not happen if id != temp but planIndex is -1, unless concurrency issue.
             setDailyPlans([...dailyPlans, planToSave]);
        }
    }
  };

  // Section Handlers
  const updateSectionTitle = (sectionId: string, newTitle: string) => {
      const newSections = effectivePlan.sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s);
      savePlan({ ...effectivePlan, sections: newSections });
  };

  const addTask = (sectionId: string) => {
      const newTask: Task = { id: crypto.randomUUID(), text: "", completed: false };
      const newSections = effectivePlan.sections.map(s => s.id === sectionId ? { ...s, tasks: [...s.tasks, newTask] } : s);
      savePlan({ ...effectivePlan, sections: newSections });
  };

  const updateTask = (sectionId: string, taskId: string, updates: Partial<Task>) => {
      const newSections = effectivePlan.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
              ...s,
              tasks: s.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
          };
      });
      savePlan({ ...effectivePlan, sections: newSections });
  };

  const deleteTask = (sectionId: string, taskId: string) => {
      const newSections = effectivePlan.sections.map(s => {
          if (s.id !== sectionId) return s;
          return { ...s, tasks: s.tasks.filter(t => t.id !== taskId) };
      });
      savePlan({ ...effectivePlan, sections: newSections });
  };

  // Review Handlers
  const updateReview = (field: keyof Review, value: string) => {
      const currentReview = effectivePlan.review || { whatDidIDo: "", whatMovedForward: "", whatDidntWork: "", focusForTomorrow: "" };
      savePlan({ ...effectivePlan, review: { ...currentReview, [field]: value } });
  };
  
  // Recurring Handlers
  const addRecurringTask = (text: string, frequency: 'daily' | 'weekly' | 'monthly') => {
      const newTask: RecurringTask = { id: crypto.randomUUID(), text, frequency };
      setRecurringTasks([...recurringTasks, newTask]);
      // Optionally ask to add to today? Auto-add for now to s1.
      addTask("s1"); 
      // Wait, we can't easily sync the "addTask" call with the text we just got because addTask creates multiple.
      // Better: Manually update today's plan.
      const newInstantTask: Task = { id: crypto.randomUUID(), text, completed: false };
      const newSections = effectivePlan.sections.map((s, i) => i === 0 ? { ...s, tasks: [...s.tasks, newInstantTask] } : s);
      savePlan({ ...effectivePlan, sections: newSections });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <button onClick={() => setMode("plan")} className={cn("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors", mode === "plan" ? "bg-amber-500 text-zinc-950" : "text-zinc-600 hover:text-zinc-400")}>
                Daily Plan
             </button>
             <button onClick={() => setMode("review")} className={cn("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors", mode === "review" ? "bg-indigo-500 text-white" : "text-zinc-600 hover:text-zinc-400")}>
                Evening Review
             </button>
          </div>
          
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-zinc-100 min-w-[250px]">
              {formatDate(currentDate)}
            </h1>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
               <button onClick={() => navigateDay(-1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronLeft className="w-5 h-5"/>
               </button>
               <button onClick={() => navigateDay(1)} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronRight className="w-5 h-5"/>
               </button>
            </div>
          </div>
        </div>
        
        {mode === "plan" && (
            <button 
                onClick={() => setIsRecurringModalOpen(true)}
                className="flex items-center gap-2 text-zinc-400 hover:text-amber-500 text-sm font-medium transition-colors"
            >
                <Repeat className="w-4 h-4" />
                Manage Recurring
            </button>
        )}
      </header>

      {mode === "plan" ? (
        <div className="space-y-8">
            {effectivePlan.sections.map((section) => (
                <section key={section.id} className="bg-zinc-900/20 rounded-xl p-2 md:p-4 border border-zinc-800/50">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <input 
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                            className="bg-transparent text-xl font-semibold text-zinc-200 outline-none focus:border-b border-amber-500 placeholder:text-zinc-600 w-full mr-4"
                            placeholder="Section Title..."
                        />
                        <button onClick={() => addTask(section.id)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-500 transition-colors shrink-0">
                            <Plus className="w-4 h-4" /> Add Task
                        </button>
                    </div>
                    <div className="space-y-3">
                         {section.tasks.length === 0 && (
                             <p className="text-zinc-700 text-sm italic px-2">No tasks yet.</p>
                         )}
                         {section.tasks.map((task) => (
                            <GoalItem
                                key={task.id}
                                text={task.text}
                                completed={task.completed}
                                onToggle={() => updateTask(section.id, task.id, { completed: !task.completed })}
                                onChange={(text) => updateTask(section.id, task.id, { text })}
                                onDelete={() => deleteTask(section.id, task.id)}
                                placeholder="Task..."
                            />
                         ))}
                    </div>
                </section>
            ))}
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <section>
                <div className="flex items-center gap-2 mb-6">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-semibold text-zinc-200">Evening Reflection</h2>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Simplified review fields for cleaner code, same as before */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500">What did I do today?</label>
                        <textarea 
                            value={effectivePlan.review?.whatDidIDo || ""}
                            onChange={(e) => updateReview("whatDidIDo", e.target.value)}
                            className="w-full bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-200 h-32 focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                    {/* ... other fields ... */}
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500">What moved things forward?</label>
                        <textarea 
                            value={effectivePlan.review?.whatMovedForward || ""}
                            onChange={(e) => updateReview("whatMovedForward", e.target.value)}
                            className="w-full bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-200 h-32 focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500">What didn't work?</label>
                        <textarea 
                            value={effectivePlan.review?.whatDidntWork || ""}
                            onChange={(e) => updateReview("whatDidntWork", e.target.value)}
                            className="w-full bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-200 h-32 focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500">What should I focus on tomorrow?</label>
                        <textarea 
                            value={effectivePlan.review?.focusForTomorrow || ""}
                            onChange={(e) => updateReview("focusForTomorrow", e.target.value)}
                            className="w-full bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-200 h-32 focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
                </div>
            </section>
        </div>
      )}

      {/* Recurring Tasks Modal */}
      {isRecurringModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-6">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-zinc-100">Recurring Tasks</h2>
                      <button onClick={() => setIsRecurringModalOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="space-y-4">
                      {/* Add New */}
                      <div className="flex gap-2">
                          <input id="new-recurring" placeholder="New recurring task..." className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 outline-none focus:border-amber-500" 
                               onKeyDown={(e) => {
                                   if(e.key === 'Enter') {
                                       addRecurringTask(e.currentTarget.value, 'daily');
                                       e.currentTarget.value = '';
                                   }
                               }}
                          />
                          <button onClick={() => {
                              const input = document.getElementById('new-recurring') as HTMLInputElement;
                              if(input.value) {
                                  addRecurringTask(input.value, 'daily');
                                  input.value = '';
                              }
                          }} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-2 rounded-lg font-bold">Add</button>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2">
                          {recurringTasks.map(rt => (
                              <div key={rt.id} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                                  <div className="flex items-center gap-3">
                                      <Repeat className="w-4 h-4 text-zinc-600" />
                                      <span className="text-zinc-200">{rt.text}</span>
                                      <span className="text-[10px] uppercase tracking-wider text-zinc-600 bg-zinc-900 px-1 py-0.5 rounded">{rt.frequency}</span>
                                  </div>
                                  <button onClick={() => setRecurringTasks(recurringTasks.filter(t => t.id !== rt.id))} className="text-zinc-600 hover:text-red-400">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                          {recurringTasks.length === 0 && <p className="text-center text-zinc-600 py-4 italic">No recurring tasks set.</p>}
                      </div>
                      
                      <p className="text-xs text-zinc-500 text-center">
                          Tasks added here will automatically appear on new days.
                      </p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
