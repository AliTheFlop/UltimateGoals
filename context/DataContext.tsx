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

  // Save to API on change (Debounced)
  useEffect(() => {
    if (!isLoaded || status !== "authenticated") return;

    if (isFirstAfterLoad.current) {
      isFirstAfterLoad.current = false;
      return;
    }

    // Data has changed, set to pending immediately
    setSaveStatus("pending");

    const data = {
      planningYears,
      ultimateGoal,
      yearlyGoals,
      monthlyGoals,
      weeklyPlans,
      dailyPlans,
      recurringTasks,
      notes,
    };

    const timeoutId = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        console.log("Auto-saved to DB");
        setSaveStatus("idle");
      } catch (e) {
        console.error("Failed to save", e);
        setSaveStatus("error");
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [planningYears, ultimateGoal, yearlyGoals, monthlyGoals, weeklyPlans, dailyPlans, recurringTasks, notes, isLoaded]);

  if (!isLoaded) {
    return null;
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
