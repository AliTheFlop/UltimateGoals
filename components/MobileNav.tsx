"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Target,
  Calendar,
  CalendarDays,
  List,
  Sun,
  FileText,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/ultimate-goal", label: "Ultimate Goal", icon: Target },
  { href: "/yearly", label: "Yearly Goals", icon: Calendar },
  { href: "/monthly", label: "Monthly Goals", icon: CalendarDays },
  { href: "/weekly", label: "Weekly Plan", icon: List },
  { href: "/daily", label: "Daily Plan", icon: Sun },
  { href: "/notes", label: "Notes", icon: FileText },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-zinc-900 bg-zinc-950/90 px-4 backdrop-blur-lg md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors",
              isActive
                ? "text-amber-500"
                : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"
            )}
            title={item.label}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
          </Link>
        );
      })}
       <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center justify-center gap-1 rounded-lg p-2 text-zinc-500 hover:bg-zinc-900/50 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Exit</span>
        </button>
    </nav>
  );
}
