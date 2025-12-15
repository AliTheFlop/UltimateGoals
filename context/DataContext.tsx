"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

  // Load from API on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Failed to fetch");
        const parsed = await res.json();
        
        // Ensure years are loaded or default
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
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchData();
  }, []);

  // Save to API on change (Debounced)
  useEffect(() => {
    if (!isLoaded) return;

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
      try {
        await fetch("/api/data", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(data)
        });
        console.log("Auto-saved to DB");
      } catch (e) {
        console.error("Failed to save", e);
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
