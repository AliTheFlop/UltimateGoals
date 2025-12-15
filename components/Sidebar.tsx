"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Target,
  Calendar,
  CalendarDays,
  List,
  Sun,
  BookOpen,
  FileText,
} from "lucide-react";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

// ... existing code ...

const navItems = [
  { href: "/ultimate-goal", label: "Ultimate Goal", icon: Target },
  { href: "/yearly", label: "Yearly Goals", icon: Calendar },
  { href: "/monthly", label: "Monthly Goals", icon: CalendarDays },
  { href: "/weekly", label: "Weekly Plan", icon: List },
  { href: "/daily", label: "Daily Plan", icon: Sun },
  //{ href: "/review", label: "Review", icon: BookOpen }, // can be part of daily? Or separate. Plan says Review Interface.
  { href: "/notes", label: "Notes", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-900 bg-zinc-950 p-6 hidden md:flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-200 bg-clip-text text-transparent">
          UltimateGoals
        </h1>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-900 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-amber-500" : "text-zinc-600")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto space-y-4">
        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-900">
           <p className="text-xs text-zinc-500 text-center">Focus on the essential.</p>
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-zinc-900/50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
