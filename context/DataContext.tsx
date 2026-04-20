"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";

// --- Types ---

export interface YearlyGoal {
  id: string;
  year: number;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  completed: boolean;
}

export interface MonthlyGoal {
  id: string;
  text: string;
  month: number; // 0-11
  year: number;
  completed: boolean;
  order?: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  frequency?: RecurrenceFrequency; // Optional tag for recurring tasks
  notes?: string;
}

export interface WeeklyPlan {
  id: string;
  weekStart: string; // ISO date string
  bigGoal: string;
  tasks: Task[];
}

export interface Review {
  whatDidIDo: string;
  whatMovedForward: string;
  whatDidntWork: string;
  focusForTomorrow: string;
}

export interface TaskSection {
  id: string;
  title: string;
  tasks: Task[];
}

export interface DailyPlan {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  sections: TaskSection[];
  review?: Review;
}

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringTask {
  id: string;
  text: string;
  frequency: RecurrenceFrequency;
  time?: string; // HH:MM
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export type SaveStatus = "idle" | "pending" | "saving" | "error";

interface DataContextType {
  planningYears: number[];
  setPlanningYears: (years: number[]) => void;
  ultimateGoal: string;
  setUltimateGoal: (goal: string) => void;
  yearlyGoals: YearlyGoal[];
  setYearlyGoals: (goals: YearlyGoal[]) => void;
  monthlyGoals: MonthlyGoal[];
  setMonthlyGoals: (goals: MonthlyGoal[]) => void;
  weeklyPlans: WeeklyPlan[];
  setWeeklyPlans: (plans: WeeklyPlan[]) => void;
  dailyPlans: DailyPlan[];
  setDailyPlans: (plans: DailyPlan[]) => void;
  recurringTasks: RecurringTask[];
  setRecurringTasks: (tasks: RecurringTask[]) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  saveStatus: SaveStatus;
}

// --- Context ---

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

// --- Provider ---

const STORAGE_KEY = "ultimate_goals_data_v1.3";

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Initial state
  const [planningYears, setPlanningYears] = useState<number[]>([]);
  const [ultimateGoal, setUltimateGoal] = useState<string>("");
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const isFirstAfterLoad = useRef(true);
  const lastSyncedDataRef = useRef<any>(null);

  const { status } = useSession();

  // Load from API on Auth Success
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      // Allow app to render (login page) but with empty data
      setSaveStatus("idle");
      setIsLoaded(true);
      return;
    }

    // Status is authenticated
    async function fetchData() {
      try {
        const res = await fetch("/api/data");

        let parsed: any = {};
        let shouldUseLocalStorage = false;

        if (res.ok) {
          parsed = await res.json();

          // CHECK EMPTY DB SCENARIO: 
          const dbIsEmpty =
            (!parsed.yearlyGoals || parsed.yearlyGoals.length === 0) &&
            (!parsed.weeklyPlans || parsed.weeklyPlans.length === 0) &&
            (!parsed.dailyPlans || parsed.dailyPlans.length === 0);

          const localSaved = localStorage.getItem(STORAGE_KEY);
          if (dbIsEmpty && localSaved) {
            console.log("Database empty. Recovering from LocalStorage...");
            try {
              parsed = JSON.parse(localSaved);
              shouldUseLocalStorage = true;
              // Since we just loaded from LocalStorage (dirty state), we might want to trigger save immediately?
              // But let's just let the normal save logic handle changes if any.
              // Actually, if we recover, we have data. Ideally we save it back to DB.
              // We'll mark it as loaded, which triggers the 'useEffect' below because values changed. 
              // Wait, values set here won't trigger change if we set them before isLoaded is true?
              // No, dependency array will see change. But isLoaded false prevents save.
              // Then isLoaded true. Effect runs.
            } catch (e) {
              console.error("Local recovery failed", e);
            }
          }
        } else {
          console.error("API Fetch failed", res.status);
          setIsLoaded(true);
          return;
        }

        if (parsed.planningYears && parsed.planningYears.length > 0) {
          setPlanningYears(parsed.planningYears);
        } else {
          const currentYear = new Date().getFullYear();
          setPlanningYears([currentYear, currentYear + 1, currentYear + 2]);
        }

        setUltimateGoal(parsed.ultimateGoal || "");
        setYearlyGoals(parsed.yearlyGoals || []);
        setMonthlyGoals(parsed.monthlyGoals || []);
        setWeeklyPlans(parsed.weeklyPlans || []);
        setDailyPlans(parsed.dailyPlans || []);
        setRecurringTasks(parsed.recurringTasks || []);
        setNotes(parsed.notes || []);

        // Store baseline for diffing overrides
        lastSyncedDataRef.current = {
            planningYears: parsed.planningYears || [],
            ultimateGoal: parsed.ultimateGoal || "",
            yearlyGoals: parsed.yearlyGoals || [],
            monthlyGoals: parsed.monthlyGoals || [],
            weeklyPlans: parsed.weeklyPlans || [],
            dailyPlans: parsed.dailyPlans || [],
            recurringTasks: parsed.recurringTasks || [],
            notes: parsed.notes || [],
        };

        setIsLoaded(true);
      } catch (e) {
        console.error("Failed to load data", e);
        setIsLoaded(true);
      }
    }
    fetchData();
  }, [status]);

  // Protection against closing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus !== "idle") {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires this
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // -- Auto-Save Logic (Sequential Queue) --
  const isSaving = useRef(false);
  const pendingSave = useRef(false);

  // Keep refs to latest data so the async saver always grabs current state
  const dataRef = useRef({
    planningYears, ultimateGoal, yearlyGoals, monthlyGoals,
    weeklyPlans, dailyPlans, recurringTasks, notes
  });

  useEffect(() => {
    dataRef.current = {
      planningYears, ultimateGoal, yearlyGoals, monthlyGoals,
      weeklyPlans, dailyPlans, recurringTasks, notes
    };
  }, [planningYears, ultimateGoal, yearlyGoals, monthlyGoals, weeklyPlans, dailyPlans, recurringTasks, notes]);

  // Helper to diff collections for micro-payloads
  const getCollectionDiff = (current: any[], last: any[]) => {
      const lastMap = new Map((last || []).map(x => [x.id, x]));
      const currentMap = new Map((current || []).map(x => [x.id, x]));

      const updates: any[] = [];
      const deletes: string[] = [];

      // Find updates (new or modified)
      for (const [id, item] of currentMap.entries()) {
          const lastItem = lastMap.get(id);
          if (!lastItem || JSON.stringify(item) !== JSON.stringify(lastItem)) {
              updates.push(item);
          }
      }

      // Find deletes
      for (const id of lastMap.keys()) {
          if (!currentMap.has(id)) {
              deletes.push(id);
          }
      }

      return { updates, deletes };
  };

  // The simplified saver function
  const executeSave = async () => {
    if (isSaving.current) {
      pendingSave.current = true;
      return;
    }

    isSaving.current = true;
    pendingSave.current = false;
    setSaveStatus("saving");

    try {
      const current = dataRef.current;
      const last = lastSyncedDataRef.current || current;

      const payload = {
         isDiff: true,
         settings: {
            ultimateGoal: current.ultimateGoal,
            planningYears: current.planningYears
         },
         updates: {} as Record<string, any[]>,
         deletes: {} as Record<string, string[]>
      };

      const collections = ['yearlyGoals', 'monthlyGoals', 'weeklyPlans', 'dailyPlans', 'recurringTasks', 'notes'];
      
      let hasChanges = false;
      for (const key of collections) {
          const diff = getCollectionDiff((current as any)[key], (last as any)[key] || []);
          payload.updates[key] = diff.updates;
          payload.deletes[key] = diff.deletes;
          if (diff.updates.length > 0 || diff.deletes.length > 0) hasChanges = true;
      }
      
      if (current.ultimateGoal !== last.ultimateGoal || JSON.stringify(current.planningYears) !== JSON.stringify(last.planningYears)) {
          hasChanges = true;
      }

      if (!hasChanges) {
          setSaveStatus("idle");
          isSaving.current = false;
          return;
      }

      // To debug payload size during dev:
      const payloadString = JSON.stringify(payload);
      console.log(`Uploading Diff Payload: ${(new Blob([payloadString]).size / 1024).toFixed(2)} KB`);

      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payloadString
      });

      console.log("Auto-saved diff to DB");
      lastSyncedDataRef.current = JSON.parse(JSON.stringify(current)); // Update baseline
      setSaveStatus("idle");
    } catch (e) {
      console.error("Failed to save", e);
      setSaveStatus("error");
    } finally {
      isSaving.current = false;
      // If changes happened while we were saving, go again immediately
      if (pendingSave.current) {
        // Small delay to prevent tight loop if error
        setTimeout(executeSave, 500);
      }
    }
  };

  // Debounced trigger
  useEffect(() => {
    if (!isLoaded || status !== "authenticated") return;

    if (isFirstAfterLoad.current) {
      isFirstAfterLoad.current = false;
      return;
    }

    setSaveStatus("pending");

    // If we are already saving, marking pendingSave=true (inside executeSave logic conceptually) 
    // is enough, but we want the debounce to still apply so we don't spam 'pendingSave' checks.
    // Actually, we just want to call executeSave() after 2s of silence.
    // If executeSave finds isSaving=true, it sets pending=true.

    const timeoutId = setTimeout(() => {
      executeSave();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [planningYears, ultimateGoal, yearlyGoals, monthlyGoals, weeklyPlans, dailyPlans, recurringTasks, notes, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-zinc-950">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <div className="text-zinc-500 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Workspace</div>
      </div>
    );
  }

  return (
    <DataContext.Provider
      value={{
        planningYears,
        setPlanningYears,
        ultimateGoal,
        setUltimateGoal,
        yearlyGoals,
        setYearlyGoals,
        monthlyGoals,
        setMonthlyGoals,
        weeklyPlans,
        setWeeklyPlans,
        dailyPlans,
        setDailyPlans,
        recurringTasks,
        setRecurringTasks,
        notes,
        setNotes,
        saveStatus,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
