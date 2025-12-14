"use client";

import { useData } from "@/context/DataContext";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation"; // useParams is from next/navigation in App router? Actually next/navigation has useParams.
import { useState, useEffect, use } from "react"; // React 19 / Next 15+ use

// Next.js 16/15 params are async in standard page props, but client components using useParams hook usually works differently.
// Let's stick to using useParams() from 'next/navigation' which is standard Client Component pattern.

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrapping params if it is passed as prop in newer Next.js versions, but for client component we can just use hooks usually?
  // Actually in Next 15, params prop is a Promise. Let's unwrap it.
  const { id } = use(params);
  
  const { notes, setNotes } = useData();
  const router = useRouter();
  
  const noteIndex = notes.findIndex(n => n.id === id);
  const note = notes[noteIndex];

  // If note not found (e.g. refresh on new session, or invalid ID), redirect?
  // Since data is in localstorage, refresh might preserve it if context loads fast enough.
  // But context loading is async (useEffect). 
  // We need to handle "loading" state better or just return null until loaded. 
  // But context handles loading state internally (returns null if !isLoaded).
  
  useEffect(() => {
     // If we are loaded and note is missing, go back.
     if (typeof window !== 'undefined' && notes.length > 0 && !note) {
         // Maybe it was just deleted?
         // Or maybe we are just navigating?
         // router.push('/notes');
     }
  }, [note, notes]);

  const updateTitle = (newTitle: string) => {
      const newNotes = [...notes];
      if (noteIndex !== -1) {
          newNotes[noteIndex] = { ...newNotes[noteIndex], title: newTitle };
          setNotes(newNotes);
      }
  };

  const updateContent = (newContent: string) => {
      const newNotes = [...notes];
      if (noteIndex !== -1) {
          newNotes[noteIndex] = { ...newNotes[noteIndex], content: newContent };
          setNotes(newNotes);
      }
  };

  if (!note) return (
      <div className="flex items-center justify-center h-[50vh] text-zinc-500">
          Loading note...
      </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <header className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <button 
           onClick={() => router.back()}
           className="flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors"
        >
            <ChevronLeft className="w-5 h-5" />
            Back to Notes
        </button>
        <span className="text-xs font-mono text-zinc-700">
            {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString()}
        </span>
      </header>
      
      <div className="space-y-6">
          <input 
             value={note.title}
             onChange={(e) => updateTitle(e.target.value)}
             placeholder="Note Title"
             className="w-full bg-transparent text-4xl font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
          />
          <textarea 
             value={note.content}
             onChange={(e) => updateContent(e.target.value)}
             placeholder="Start writing..."
             className="w-full h-[60vh] bg-transparent text-lg text-zinc-300 placeholder:text-zinc-800 outline-none resize-none leading-relaxed"
          />
      </div>
    </div>
  );
}
