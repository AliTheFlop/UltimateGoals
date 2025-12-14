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

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";

export interface RecurringTask {
  id: string;
  text: string;
  frequency: RecurrenceFrequency;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface DataContextType {
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

const STORAGE_KEY = "ultimate_goals_data_v1.2";

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Initial state
  const [ultimateGoal, setUltimateGoal] = useState<string>("");
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoal[]>([]);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUltimateGoal(parsed.ultimateGoal || "");
        setYearlyGoals(parsed.yearlyGoals || []);
        setMonthlyGoals(parsed.monthlyGoals || []);
        setWeeklyPlans(parsed.weeklyPlans || []);
        setDailyPlans(parsed.dailyPlans || []);
        setRecurringTasks(parsed.recurringTasks || []);
        setNotes(parsed.notes || []);
      } catch (e) {
        console.error("Failed to parse data", e);
      }
    } else {
         // Attempt Migration from v1 or v1.1
         // Prioritize v1.0 ultimate goal restoration if available because v1.1 broke it into array
         const v1 = localStorage.getItem("ultimate_goals_data_v1");
         if (v1) {
             try {
                 const parsedV1 = JSON.parse(v1);
                 if (parsedV1.ultimateGoal) setUltimateGoal(parsedV1.ultimateGoal);
             } catch(e) {}
         }
         
         // Try to migrate notes/daily from v1.1
         const v1_1 = localStorage.getItem("ultimate_goals_data_v1.1");
         if (v1_1) {
             try {
                 const parsed = JSON.parse(v1_1);
                 setNotes(parsed.notes || []);
                 setDailyPlans(parsed.dailyPlans || []);
                 setRecurringTasks(parsed.recurringTasks || []);
                 setWeeklyPlans(parsed.weeklyPlans || []);
                 // Yearly goals incompatible, skip.
             } catch (e) {}
         }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    const data = {
      ultimateGoal,
      yearlyGoals,
      monthlyGoals,
      weeklyPlans,
      dailyPlans,
      recurringTasks,
      notes,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [ultimateGoal, yearlyGoals, monthlyGoals, weeklyPlans, dailyPlans, recurringTasks, notes, isLoaded]);

  if (!isLoaded) {
    return null;
  }

  return (
    <DataContext.Provider
      value={{
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
