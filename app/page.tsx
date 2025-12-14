"use client";

import { useData } from "@/context/DataContext";
import Link from "next/link";
import { ArrowRight, Target, List, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function getStartOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function Home() {
  const { ultimateGoal, weeklyPlans, dailyPlans } = useData();
  const [greeting, setGreeting] = useState("Hello");
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Get current data
  const weekStart = getStartOfWeek(date).toISOString().split("T")[0];
  const todayKey = date.toISOString().split("T")[0];

  const currentWeekPlan = weeklyPlans.find((p) => p.weekStart === weekStart);
  const currentDailyPlan = dailyPlans.find((p) => p.date === todayKey);

  // Daily Stats
  const dailyTotal = currentDailyPlan?.sections.reduce((acc, s) => acc + s.tasks.length, 0) || 0;
  const dailyDone = currentDailyPlan?.sections.reduce((acc, s) => acc + s.tasks.filter(t => t.completed).length, 0) || 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-100">
            {greeting}.
        </h1>
        <p className="text-xl text-zinc-500">
            Here is where you stand today.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* ULTIMATE GOAL CARD */}
        <Link href="/ultimate-goal" className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <Target className="w-6 h-6 text-amber-500" />
                <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-amber-500 transition-colors" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">3-Year Vision</h3>
            <p className={ultimateGoal ? "text-lg text-zinc-200 line-clamp-3" : "text-zinc-600 italic"}>
                {ultimateGoal || "Define your destination..."}
            </p>
        </Link>

        {/* WEEKLY FOCUS CARD */}
        <Link href="/weekly" className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <List className="w-6 h-6 text-blue-500" />
                <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">This Week's Focus</h3>
            <p className="text-xl font-bold text-zinc-100 mb-2">
                {currentWeekPlan?.bigGoal || "No Big Goal set."}
            </p>
             <div className="text-sm text-zinc-500">
                {currentWeekPlan?.tasks.filter(t => t.completed).length || 0} / {currentWeekPlan?.tasks.length || 0} tasks done
             </div>
        </Link>
        
        {/* DAILY OVERVIEW CARD */}
        <Link href="/daily" className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors md:col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between mb-4">
                <Sun className="w-6 h-6 text-emerald-500" />
                <ArrowRight className="w-5 h-5 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
            </div>
            <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Today's Plan</h3>
            <div className="space-y-4">
                {(!currentDailyPlan) ? (
                    <p className="text-zinc-600 italic">Plan your day...</p>
                ) : (
                    <div>
                        <div className="text-3xl font-bold text-zinc-200">{dailyDone} <span className="text-zinc-600 text-lg">/ {dailyTotal}</span></div>
                        <p className="text-zinc-500 text-sm">Tasks completed</p>
                    </div>
                )}
                {currentDailyPlan?.sections.slice(0, 2).map(s => s.tasks.length > 0 && (
                    <div key={s.id} className="text-xs text-zinc-500 border-l-2 border-zinc-800 pl-2">
                        <span className="block font-medium text-zinc-400">{s.title}</span>
                        {s.tasks.length} tasks
                    </div>
                ))}
            </div>
        </Link>
      </div>

       <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center">
            <p className="text-zinc-500 italic max-w-lg mx-auto">
               "Productivity is not about getting more things done; it is about getting the right things done."
            </p>
       </div>
    </div>
  );
}
