"use client";

import { useData, Note } from "@/context/DataContext";
import { Plus, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotesPage() {
  const { notes, setNotes } = useData();
  const router = useRouter();

  const addNote = () => {
    const id = crypto.randomUUID();
    const newNote: Note = {
      id,
      title: "",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setNotes([newNote, ...notes]);
    router.push(`/notes/${id}`);
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-end justify-between">
        <div>
          <span className="text-sm font-medium text-amber-500 tracking-wider uppercase">Thoughts</span>
          <h1 className="text-4xl font-bold mt-2 text-zinc-100">
            Notes & Ideas
          </h1>
        </div>
        <button
          onClick={addNote}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg font-medium transition-colors border border-zinc-700"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </header>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {notes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-40 md:pt-0">
             <p className="text-zinc-700 italic">Capture your thoughts...</p>
          </div>
        )}
        
        {notes.map((note) => (
          <Link 
            key={note.id} 
            href={`/notes/${note.id}`}
            className="break-inside-avoid block group relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-amber-500/50 hover:-translate-y-1 transition-all duration-300"
          >
            <h3 className="text-lg font-bold text-zinc-200 mb-2 line-clamp-1">{note.title || "Untitled Note"}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed line-clamp-4 min-h-[4em] whitespace-pre-wrap">
                {note.content || "No content..."}
            </p>
            
            <button
               onClick={(e) => deleteNote(e, note.id)}
               className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-zinc-600 hover:text-red-400 transition-opacity bg-zinc-900/50 rounded-full"
            >
                <Trash2 className="w-4 h-4"/>
            </button>
            <div className="text-[10px] text-zinc-700 mt-4 font-mono">
                {new Date(note.createdAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
