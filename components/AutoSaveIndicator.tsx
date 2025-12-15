"use client";

import { useData } from "@/context/DataContext";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function AutoSaveIndicator() {
  const { saveStatus } = useData();
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" briefly after going to idle from saving
  useEffect(() => {
    if (saveStatus === "idle") {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    } else {
      setShowSaved(false);
    }
  }, [saveStatus]);

  if (saveStatus === "idle" && !showSaved) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl transition-all duration-300">
      {saveStatus === "pending" && (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-xs font-medium text-zinc-400">Changed...</span>
        </>
      )}

      {saveStatus === "saving" && (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
          <span className="text-xs font-medium text-zinc-300">Auto-saving...</span>
        </>
      )}

      {saveStatus === "error" && (
        <>
          <AlertCircle className="w-3 h-3 text-red-500" />
          <span className="text-xs font-medium text-red-400">Save Failed</span>
        </>
      )}

      {saveStatus === "idle" && showSaved && (
        <>
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span className="text-xs font-medium text-zinc-400">Saved</span>
        </>
      )}
    </div>
  );
}
