"use client";

import { useData, YearlyGoal } from "@/context/DataContext";
import { Plus, Trash2, CheckCircle2, X, Settings, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function YearlyGoalsPage() {
  const { yearlyGoals, setYearlyGoals, planningYears, setPlanningYears } = useData();
  const currentYear = new Date().getFullYear();
  
  // Ensure we have years, sorted
  const activeYears = (planningYears.length > 0 ? planningYears : [currentYear, currentYear+1, currentYear+2]).sort((a,b) => a - b);
  
  const [selectedYear, setSelectedYear] = useState(activeYears[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Year Management State
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState("");

  // Form State
  const [smart, setSmart] = useState({
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: ""
  });

  const addGoal = () => {
    if (!smart.specific) return;
    const newGoal: YearlyGoal = {
      id: crypto.randomUUID(),
      year: selectedYear,
      ...smart,
      completed: false,
    };
    setYearlyGoals([...yearlyGoals, newGoal]);
    setIsAdding(false);
    setSmart({ specific: "", measurable: "", achievable: "", relevant: "", timeBound: "" });
  };

  const deleteGoal = (id: string) => {
    setYearlyGoals(yearlyGoals.filter(g => g.id !== id));
  };

  // Year Management
  const handleAddYear = () => {
      const yearToAdd = parseInt(newYearInput);
      if (isNaN(yearToAdd) || yearToAdd < 1900 || yearToAdd > 3000) return; // Simple validation
      
      if (!activeYears.includes(yearToAdd)) {
          const newYears = [...activeYears, yearToAdd].sort((a,b) => a - b);
          setPlanningYears(newYears);
          setSelectedYear(yearToAdd);
      } else {
          // Just switch to it if it exists
          setSelectedYear(yearToAdd);
      }
      setIsAddingYear(false);
      setNewYearInput("");
  };
  
  const removeYear = (yearToRemove: number) => {
      if (activeYears.length <= 1) return; 
      const newYears = activeYears.filter(y => y !== yearToRemove);
      setPlanningYears(newYears);
      if (selectedYear === yearToRemove) {
          setSelectedYear(newYears[0]);
      }
  };

  const filteredGoals = yearlyGoals.filter(g => g.year === selectedYear);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-amber-500 tracking-wider uppercase">Yearly Strategy</span>
          <h1 className="text-4xl font-bold mt-2 text-zinc-100">
             Future Goals
          </h1>
          <p className="text-zinc-500 mt-2">
            Plan your years using the S.M.A.R.T framework.
          </p>
        </div>
        
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add S.M.A.R.T Goal
        </button>
      </header>
      
      {/* Year Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 overflow-x-auto pb-1">
          {activeYears.map(year => (
              <div key={year} className="relative group/tab">
                  <button
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                        "px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                        selectedYear === year 
                            ? "border-amber-500 text-zinc-100" 
                            : "border-transparent text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                      {year}
                  </button>
                  {/* Delete Year Button */}
                  {activeYears.length > 1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeYear(year); }} 
                        className="absolute top-0 right-0 p-1 bg-zinc-900 text-zinc-700 hover:text-red-500 opacity-0 group-hover/tab:opacity-100 transition-opacity text-xs"
                        title="Remove Year"
                      >
                          <X className="w-3 h-3" />
                      </button>
                  )}
              </div>
          ))}
          
          {/* Add Year UI */}
          {!isAddingYear ? (
               <button 
                onClick={() => setIsAddingYear(true)}
                className="px-4 py-2 text-zinc-600 hover:text-amber-500 transition-colors"
                title="Add Year"
              >
                  <Plus className="w-4 h-4" />
              </button>
          ) : (
              <div className="flex items-center gap-1 pl-2 animate-in fade-in">
                  <input 
                      type="number" 
                      value={newYearInput}
                      onChange={e => setNewYearInput(e.target.value)}
                      placeholder="Year"
                      className="w-20 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 text-sm outline-none focus:border-amber-500"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleAddYear()}
                  />
                  <button onClick={handleAddYear} className="p-1 hover:text-green-400 text-zinc-400"><Check className="w-4 h-4"/></button>
                  <button onClick={() => setIsAddingYear(false)} className="p-1 hover:text-red-400 text-zinc-400"><X className="w-4 h-4"/></button>
              </div>
          )}
      </div>

      <div className="grid gap-6">
          {filteredGoals.length === 0 && (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-zinc-600">No goals set for {selectedYear}.</p>
                <button onClick={() => setIsAdding(true)} className="text-amber-500 hover:underline mt-2 text-sm">Define a S.M.A.R.T Goal</button>
              </div>
          )}

          {filteredGoals.map(goal => (
              <div key={goal.id} className="relative group bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                       <h3 className="text-xl font-bold text-zinc-200">{goal.specific}</h3>
                       <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity">
                           <Trash2 className="w-4 h-4" />
                       </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900">
                          <span className="text-teal-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Measurable</span>
                          <p className="text-zinc-400">{goal.measurable}</p>
                      </div>
                      <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900">
                          <span className="text-blue-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Achievable</span>
                          <p className="text-zinc-400">{goal.achievable}</p>
                      </div>
                      <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900">
                          <span className="text-purple-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Relevant</span>
                          <p className="text-zinc-400">{goal.relevant}</p>
                      </div>
                      <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900">
                          <span className="text-rose-500 font-bold uppercase text-[10px] tracking-wider block mb-1">Time-Bound</span>
                          <p className="text-zinc-400">{goal.timeBound}</p>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* Add Modal */}
      {isAdding && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-in fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-zinc-100">New Goal for {selectedYear}</h2>
                      <button onClick={() => setIsAdding(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-6 h-6"/></button>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-1">Specific</label>
                          <input 
                              placeholder="What exactly do you want to accomplish?"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 outline-none focus:border-amber-500"
                              value={smart.specific}
                              onChange={e => setSmart({...smart, specific: e.target.value})}
                          />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-teal-500/80 mb-1">Measurable</label>
                            <input 
                                placeholder="How will you measure success?"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 outline-none focus:border-teal-500/50"
                                value={smart.measurable}
                                onChange={e => setSmart({...smart, measurable: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-500/80 mb-1">Achievable</label>
                            <input 
                                placeholder="Is this realistic?"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 outline-none focus:border-blue-500/50"
                                value={smart.achievable}
                                onChange={e => setSmart({...smart, achievable: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-purple-500/80 mb-1">Relevant</label>
                            <input 
                                placeholder="Why is this important now?"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 outline-none focus:border-purple-500/50"
                                value={smart.relevant}
                                onChange={e => setSmart({...smart, relevant: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-rose-500/80 mb-1">Time-Bound</label>
                            <input 
                                placeholder="When will this be achieved?"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 outline-none focus:border-rose-500/50"
                                value={smart.timeBound}
                                onChange={e => setSmart({...smart, timeBound: e.target.value})}
                            />
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                      <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 font-medium">Cancel</button>
                      <button onClick={addGoal} className="px-5 py-2.5 rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold">Save Goal</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
