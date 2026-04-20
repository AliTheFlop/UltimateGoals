"use client";

import { useData, DailyPlan, Task, Review, TaskSection, RecurringTask } from "@/context/DataContext";
import { TaskCard } from "@/components/TaskCard";
import { TaskModal } from "@/components/TaskModal";
import { ChevronLeft, ChevronRight, Plus, Sun, Moon, GripVertical, Clock, CalendarClock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn, getLocalDateString } from "@/lib/utils";

function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export default function DailyPage() {
    const { dailyPlans, setDailyPlans, recurringTasks, setRecurringTasks } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mode, setMode] = useState<"plan" | "review">("plan");
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

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
            const newTasks = [...allTasks];
            const draggedTask = newTasks.splice(dragItem.current, 1)[0];
            newTasks.splice(dragOverItem.current, 0, draggedTask);
            saveTasks(newTasks);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const dateKey = getLocalDateString(currentDate); // YYYY-MM-DD

    // -- Plan & Initialization --
    const planIndex = dailyPlans.findIndex((p) => p.date === dateKey);
    const plan = planIndex !== -1 ? dailyPlans[planIndex] : null;

    // Single Section Enforcer: We treat ANY existing sections as sources, but we prefer "s1"
    const defaultSections: TaskSection[] = [
        { id: "s1", title: "Tasks", tasks: [] }
    ];

    // If plan exists but has multiple sections (migration scenario), we will flatten them on next save.
    // For rendering, we will flatten them on the fly to show one list.
    const allTasks = plan ? plan.sections.flatMap(s => s.tasks) : [];

    // Create a synthetic "effective plan" for rendering
    const effectivePlan: DailyPlan = plan || {
        id: "temp",
        date: dateKey,
        sections: defaultSections,
    };

    const savePlan = (updatedPlan: DailyPlan) => {
        let planToSave = updatedPlan;

        // Auto-inject logic (only if NEW plan)
        if (updatedPlan.id === "temp") {
            const realId = crypto.randomUUID();
            // Check for daily recurring tasks
            const dueToday = recurringTasks.filter(rt => {
                if (rt.frequency === 'daily') return true;
                if (rt.frequency === 'weekly') return new Date().getDay() === currentDate.getDay();
                // Monthly: checks date of month (simple)
                if (rt.frequency === 'monthly') return new Date().getDate() === currentDate.getDate();
                return false;
            });

            let initialTasks = [...updatedPlan.sections[0].tasks];

            if (dueToday.length > 0) {
                const newTasks = dueToday.map(rt => ({
                    id: crypto.randomUUID(),
                    text: rt.text,
                    completed: false,
                    frequency: rt.frequency,
                    notes: "" // Init notes
                }));
                initialTasks = [...initialTasks, ...newTasks];
            }

            // Ensure strictly one section
            planToSave = {
                ...updatedPlan,
                id: realId,
                sections: [{ id: "s1", title: "Tasks", tasks: initialTasks }]
            };
            setDailyPlans([...dailyPlans, planToSave]);
        } else {
            // Update existing
            if (planIndex !== -1) {
                const newPlans = [...dailyPlans];
                newPlans[planIndex] = planToSave;
                setDailyPlans(newPlans);
            } else {
                setDailyPlans([...dailyPlans, planToSave]);
            }
        }
    };

    // -- Task Management (Single List) --

    const saveTasks = (newTasks: Task[]) => {
        // Always save into a single section "s1"
        const newSections = [{ id: "s1", title: "Tasks", tasks: newTasks }];
        savePlan({ ...effectivePlan, sections: newSections });
    };

    const addTask = () => {
        const newTaskId = crypto.randomUUID();
        const newTask: Task = { id: newTaskId, text: "", completed: false, notes: "" };
        saveTasks([...allTasks, newTask]);
        setEditingTaskId(newTaskId);
    };

    const updateTask = (taskId: string, updates: Partial<Task>) => {
        const newTasks = allTasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
        saveTasks(newTasks);
    };

    const deleteTask = (taskId: string) => {
        const newTasks = allTasks.filter(t => t.id !== taskId);
        saveTasks(newTasks);
    };

    // -- Recurring Logic --
    const handleFrequencyChange = (taskId: string, newFreq: "daily" | "weekly" | "monthly" | undefined) => {
        // 1. Update local task
        const task = allTasks.find(t => t.id === taskId);
        if (!task) return;

        const newTasks = allTasks.map(t => t.id === taskId ? { ...t, frequency: newFreq as any } : t);
        saveTasks(newTasks);

        // 2. Sync with Global Recurring List
        // If adding frequency: Create/Update recurring task
        // If removing frequency: Remove recurring task
        // We match by TEXT for simplicity or we could try to track IDs but tasks are instances.

        const existingRecurringIndex = recurringTasks.findIndex(rt => rt.text === task.text); // Weak matching but standard for simple todo apps

        let newRecurringList = [...recurringTasks];

        if (newFreq) {
            if (existingRecurringIndex >= 0) {
                // Update existing
                newRecurringList[existingRecurringIndex] = { ...newRecurringList[existingRecurringIndex], frequency: newFreq };
            } else {
                // Create new
                newRecurringList.push({
                    id: crypto.randomUUID(),
                    text: task.text,
                    frequency: newFreq,
                    time: ""
                });
            }
        } else {
            // Remove if it exists (and matches text)
            if (existingRecurringIndex >= 0) {
                newRecurringList = newRecurringList.filter((_, i) => i !== existingRecurringIndex);
            }
        }
        setRecurringTasks(newRecurringList);
    };


    // -- Review Helpers --
    const updateReview = (field: keyof Review, value: string) => {
        const currentReview = effectivePlan.review || { whatDidIDo: "", whatMovedForward: "", whatDidntWork: "", focusForTomorrow: "" };
        savePlan({ ...effectivePlan, review: { ...currentReview, [field]: value } });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative max-w-4xl mx-auto">
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
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => {
                                const d = new Date(currentDate); d.setDate(currentDate.getDate() + 1); setCurrentDate(d);
                            }} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {mode === "plan" ? (
                <div className="bg-zinc-900/10 rounded-3xl border border-zinc-800/30 p-4 md:p-8 min-h-[500px] flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-zinc-200">Tasks</h2>
                        <button
                            onClick={addTask}
                            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add Task</span>
                        </button>
                    </div>

                    <div className="space-y-3 flex-1">
                        {allTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 opacity-50">
                                <p className="text-lg font-medium">No tasks for today</p>
                                <p className="text-sm">Click "Add Task" to start planning</p>
                            </div>
                        )}
                        {allTasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                text={task.text}
                                completed={task.completed}
                                isDaily={task.frequency === "daily"}
                                hasNotes={!!task.notes}
                                onToggle={(e) => updateTask(task.id, { completed: !task.completed })}
                                onClick={() => setEditingTaskId(task.id)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                            />
                        ))}

                        <TaskModal 
                            isOpen={!!editingTaskId}
                            task={editingTaskId ? allTasks.find(t => t.id === editingTaskId) || null : null}
                            onClose={() => setEditingTaskId(null)}
                            onSave={(updates) => {
                                if (!editingTaskId) return;
                                updateTask(editingTaskId, updates);
                                if (updates.frequency !== undefined) {
                                    handleFrequencyChange(editingTaskId, updates.frequency as "daily" | undefined);
                                }
                            }}
                            onDelete={() => {
                                if (editingTaskId) {
                                    handleFrequencyChange(editingTaskId, undefined);
                                    deleteTask(editingTaskId);
                                }
                            }}
                        />

                        <div className="pt-4 border-t border-zinc-800/50 mt-4 opacity-50 hover:opacity-100 transition-opacity flex justify-center">
                            <button onClick={addTask} className="text-zinc-600 hover:text-amber-500 flex items-center gap-2 text-sm font-medium">
                                <Plus className="w-4 h-4" /> Add another task
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <section className="bg-zinc-900/10 border border-zinc-800/30 rounded-3xl p-6 md:p-8">
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
        </div>
    );
}
