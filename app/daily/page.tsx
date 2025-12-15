"use client";

import { useData, DailyPlan, Task, Review, TaskSection, RecurringTask } from "@/context/DataContext";
import { GoalItem } from "@/components/GoalItem";
import { ChevronLeft, ChevronRight, Plus, Sun, Moon, Repeat, Trash2, X, GripVertical, Clock, CalendarClock } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function DailyPage() {
  const { dailyPlans, setDailyPlans, recurringTasks, setRecurringTasks } = useData();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mode, setMode] = useState<"plan" | "review">("plan");
  
  // Recurrence Modal State
  const [schedulingTask, setSchedulingTask] = useState<{sectionId: string, task: Task} | null>(null);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'daily'|'weekly'|'monthly'|'yearly'>('daily');
  const [recurrenceTime, setRecurrenceTime] = useState('');

  const dateKey = currentDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // -- Plan & Initialization --
  const planIndex = dailyPlans.findIndex((p) => p.date === dateKey);
  const plan = planIndex !== -1 ? dailyPlans[planIndex] : null;

  const defaultSections: TaskSection[] = [
      { id: "s1", title: "General", tasks: [] },
      { id: "s2", title: "Today", tasks: [] }
  ];

  const effectivePlan: DailyPlan = plan || {
      id: "temp",
      date: dateKey,
      sections: defaultSections,
  };

  const savePlan = (updatedPlan: DailyPlan) => {
    let planToSave = updatedPlan;
    if (updatedPlan.id === "temp") {
        const realId = crypto.randomUUID();
        // Check for daily recurring tasks to auto-inject ONLY on creation
        const injectedSections = [...updatedPlan.sections];
        const dueToday = recurringTasks.filter(rt => {
           // Simple logic: If daily, always due. If weekly, due if same weekday.
           // Future: Check 'lastGenerated' date to prevent dups. For now, simple match.
           if (rt.frequency === 'daily') return true;
           if (rt.frequency === 'weekly') return new Date().getDay() === currentDate.getDay();
           // Monthly/Yearly simplified
           return false; 
        });

        if (dueToday.length > 0) {
            const newTasks = dueToday.map(rt => ({
                id: crypto.randomUUID(),
                text: rt.text,
                completed: false,
                frequency: rt.frequency
            }));
            // Add to "General" (s1)
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
             setDailyPlans([...dailyPlans, planToSave]);
        }
    }
  };

  // -- Task Management --

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
  
  const updateSectionTitle = (sectionId: string, newTitle: string) => {
      const newSections = effectivePlan.sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s);
      savePlan({ ...effectivePlan, sections: newSections });
  };

  // -- Drag & Drop --
  // We need to track what is being dragged: { sectionId, taskId }
  const [draggedItem, setDraggedItem] = useState<{sectionId: string, taskId: string} | null>(null);

  const handleDragStart = (e: React.DragEvent, sectionId: string, taskId: string) => {
      setDraggedItem({ sectionId, taskId });
      // e.dataTransfer.effectAllowed = 'move';
      // e.dataTransfer.setData('text/plain', JSON.stringify({ sectionId, taskId })); // Fallback
  };

  const handleDragOver = (e: React.DragEvent, targetSectionId: string) => {
      e.preventDefault();
      // Allow drop
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
      e.preventDefault();
      if (!draggedItem) return;

      const { sectionId: sourceSectionId, taskId } = draggedItem;
      if (sourceSectionId === targetSectionId) return; // No change (unless reordering within list, which we can add later)
      
      // Find task
      const sourceSection = effectivePlan.sections.find(s => s.id === sourceSectionId);
      const taskToMove = sourceSection?.tasks.find(t => t.id === taskId);
      if (!taskToMove) return;

      // Remove from source
      const newSourceSection = {
          ...sourceSection!,
          tasks: sourceSection!.tasks.filter(t => t.id !== taskId)
      };

      // Add to target
      const targetSection = effectivePlan.sections.find(s => s.id === targetSectionId);
      const newTargetSection = {
          ...targetSection!,
          tasks: [...targetSection!.tasks, taskToMove]
      };

      const newSections = effectivePlan.sections.map(s => {
          if (s.id === sourceSectionId) return newSourceSection;
          if (s.id === targetSectionId) return newTargetSection;
          return s;
      });

      savePlan({ ...effectivePlan, sections: newSections });
      setDraggedItem(null);
  };

  // -- Recurrence Scheduling --
  
  const handleScheduleSave = () => {
      if (!schedulingTask) return;
      const { task } = schedulingTask;
      if (!task.text.trim()) return;

      const newRecurring: RecurringTask = {
          id: crypto.randomUUID(),
          text: task.text,
          frequency: recurrenceFreq,
          time: recurrenceTime
      };
      setRecurringTasks([...recurringTasks, newRecurring]);
      
      // Update the current task instance to show the tag immediately
      const { sectionId } = schedulingTask;
      const updatedSections = effectivePlan.sections.map(s => {
          if (s.id !== sectionId) return s;
          return {
              ...s,
              tasks: s.tasks.map(t => t.id === task.id ? { ...t, frequency: recurrenceFreq } : t)
          };
      });
      savePlan({ ...effectivePlan, sections: updatedSections });

      setSchedulingTask(null);
      setRecurrenceFreq('daily');
      setRecurrenceTime('');
  };

  // -- Review Helpers --
  const updateReview = (field: keyof Review, value: string) => {
      const currentReview = effectivePlan.review || { whatDidIDo: "", whatMovedForward: "", whatDidntWork: "", focusForTomorrow: "" };
      savePlan({ ...effectivePlan, review: { ...currentReview, [field]: value } });
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
            <h1 className="text-xl md:text-3xl font-bold text-zinc-100 min-w-[200px] md:min-w-[250px]">
              {formatDate(currentDate)}
            </h1>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
               <button onClick={() => {
                   const d = new Date(currentDate); d.setDate(currentDate.getDate() - 1); setCurrentDate(d);
               }} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronLeft className="w-5 h-5"/>
               </button>
               <button onClick={() => {
                   const d = new Date(currentDate); d.setDate(currentDate.getDate() + 1); setCurrentDate(d);
               }} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                  <ChevronRight className="w-5 h-5"/>
               </button>
            </div>
          </div>
        </div>
      </header>

      {mode === "plan" ? (
        <div className="grid md:grid-cols-2 gap-8">
            {effectivePlan.sections.map((section) => (
                <section 
                    key={section.id} 
                    className={cn(
                        "bg-zinc-900/20 rounded-xl p-4 border border-zinc-800/50 min-h-[300px] flex flex-col transition-colors",
                         draggedItem && draggedItem.sectionId !== section.id ? "bg-zinc-900/40 border-dashed border-zinc-700" : ""
                    )}
                    onDragOver={(e) => handleDragOver(e, section.id)}
                    onDrop={(e) => handleDrop(e, section.id)}
                >
                    <div className="flex items-center justify-between mb-4">
                        <input 
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                            className="bg-transparent text-lg md:text-xl font-semibold text-zinc-200 outline-none focus:border-b border-amber-500 placeholder:text-zinc-600 w-full mr-4"
                            placeholder="Section Title..."
                        />
                        <button onClick={() => addTask(section.id)} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-500 transition-colors shrink-0">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <div className="space-y-3 flex-1">
                         {section.tasks.length === 0 && (
                             <p className="text-zinc-700 text-sm italic py-4 text-center select-none">
                                {draggedItem ? "Drop here" : "No tasks"}
                             </p>
                         )}
                         {section.tasks.map((task) => (
                            <div 
                                key={task.id} 
                                draggable
                                onDragStart={(e) => handleDragStart(e, section.id, task.id)}
                                className="group flex items-start gap-2 bg-zinc-950/50 p-2 rounded-lg border border-transparent hover:border-zinc-800 transition-colors cursor-move"
                            >
                                <GripVertical className="w-4 h-4 text-zinc-700 mt-1 opacity-20 group-hover:opacity-100" />
                                <div className="flex-1">
                                    <GoalItem
                                        text={task.text}
                                        completed={task.completed}
                                        frequency={task.frequency}
                                        onToggle={() => updateTask(section.id, task.id, { completed: !task.completed })}
                                        onChange={(text) => updateTask(section.id, task.id, { text })}
                                        onDelete={() => deleteTask(section.id, task.id)}
                                        placeholder="Task..."
                                        // Custom render for extra actions
                                        extraActions={
                                            <button 
                                                title="Make Recurring"
                                                onClick={() => setSchedulingTask({ sectionId: section.id, task })}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-blue-400 transition-opacity"
                                            >
                                                <CalendarClock className="w-4 h-4" />
                                            </button>
                                        }
                                    />
                                </div>
                            </div>
                         ))}
                    </div>
                </section>
            ))}
        </div>
      ) : (
        // Review Mode (Same as V1.2)
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <section>
                <div className="flex items-center gap-2 mb-6">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-xl font-semibold text-zinc-200">Evening Reflection</h2>
                </div>
                
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500">What did I do today?</label>
                        <textarea 
                            value={effectivePlan.review?.whatDidIDo || ""}
                            onChange={(e) => updateReview("whatDidIDo", e.target.value)}
                            className="w-full bg-zinc-900 p-4 rounded-lg border border-zinc-800 text-zinc-200 h-32 focus:border-indigo-500 outline-none resize-none"
                        />
                    </div>
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

      {/* Recurrence Modal */}
      {schedulingTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-100">Schedule Task</h2>
                        <p className="text-zinc-500 text-sm mt-1 line-clamp-1">{schedulingTask.task.text}</p>
                    </div>
                    <button onClick={() => setSchedulingTask(null)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Frequency</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['daily', 'weekly', 'monthly', 'yearly'].map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setRecurrenceFreq(f as any)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg text-sm font-medium capitalize border transition-colors",
                                        recurrenceFreq === f 
                                            ? "bg-amber-500 text-zinc-950 border-amber-500" 
                                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700"
                                    )}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Time (Optional)</label>
                        <input 
                            type="time" 
                            value={recurrenceTime}
                            onChange={(e) => setRecurrenceTime(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 outline-none focus:border-amber-500"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button onClick={handleScheduleSave} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg w-full">
                        Make Recurring
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
