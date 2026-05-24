
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Trophy, 
  Lock, 
  CheckCircle2, 
  Calendar, 
  Sparkles,
  Gamepad2,
  Clock
} from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import { cn, shuffleArray } from "@/lib/utils";
import Image from "next/image";

type GamePhase = "selector" | "active" | "summary";

type MatchPair = {
  id: string;
  english: string;
  hebrew: string;
  imageUrl: string;
};

export function MatchRoom({ onBack }: { onBack: () => void }) {
  const { filteredVocab, isReady } = useStudyLogic();
  const [phase, setPhase] = useState<GamePhase>("selector");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  
  // Gameplay State
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: "correct" | "wrong" } | null>(null);
  const [mistakes, setMistakes] = useState(0);

  // 1. Curriculum Locking Logic
  const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  
  const curriculumDays = useMemo(() => [
    { id: 1, label: "Day 1", sub: "Sunday", dayOfWeek: 0, isTest: false },
    { id: 2, label: "Day 2", sub: "Monday", dayOfWeek: 1, isTest: false },
    { id: 3, label: "Day 3", sub: "Tuesday", dayOfWeek: 2, isTest: false },
    { id: 4, label: "Day 4", sub: "Wednesday", dayOfWeek: 3, isTest: false },
    { id: 5, label: "Day 5", sub: "Weekly Test", dayOfWeek: 4, isTest: true },
    { id: 6, label: "Day 6", sub: "Weekend Rev", dayOfWeek: 5, isTest: false },
    { id: 7, label: "Day 7", sub: "Weekend Rev", dayOfWeek: 6, isTest: false },
  ], []);

  const isDayUnlocked = (dayOfWeek: number) => {
    // Current day or past days are unlocked
    if (dayOfWeek <= today) return true;
    // SPECIAL RULE: If today is Wednesday (3), unlock Thursday's Test (4) early
    if (today === 3 && dayOfWeek === 4) return true;
    return false;
  };

  // 2. Word Chunking (Wave System)
  const allWordsForDay = useMemo(() => {
    if (selectedDayIndex === null || !isReady) return [];
    
    // For Day 5 (Test), we fetch words from the entire week
    if (selectedDayIndex === 4) {
        return filteredVocab.weeks[filteredVocab.weeks.length - 1]?.words || [];
    }

    // Otherwise, fetch words for that specific day chunk
    const week = filteredVocab.weeks[filteredVocab.weeks.length - 1];
    if (!week) return [];

    // Daily logic matches the slice in useStudyLogic
    const start = selectedDayIndex * 10;
    return week.words.slice(start, start + 10);
  }, [selectedDayIndex, isReady, filteredVocab]);

  const chunks = useMemo(() => {
    const pairs: MatchPair[] = allWordsForDay.map(w => ({
      id: w.id,
      english: w.english,
      hebrew: w.hebrew,
      imageUrl: `https://picsum.photos/seed/${w.id}/200/200` // Using picsum as fallback for robustness
    }));
    
    const result = [];
    for (let i = 0; i < pairs.length; i += 5) {
      result.push(pairs.slice(i, i + 5));
    }
    return result;
  }, [allWordsForDay]);

  const currentChunk = chunks[currentChunkIndex] || [];
  
  const leftColumn = useMemo(() => shuffleArray([...currentChunk]), [currentChunk]);
  const rightColumn = useMemo(() => shuffleArray([...currentChunk]), [currentChunk]);

  // 3. Match Mechanics
  useEffect(() => {
    if (selectedLeft && selectedRight) {
      if (selectedLeft === selectedRight) {
        setFeedback({ id: selectedLeft, type: "correct" });
        setTimeout(() => {
          setMatchedIds(prev => new Set([...prev, selectedLeft]));
          setSelectedLeft(null);
          setSelectedRight(null);
          setFeedback(null);
        }, 600);
      } else {
        setFeedback({ id: "mismatch", type: "wrong" });
        setMistakes(m => m + 1);
        setTimeout(() => {
          setSelectedLeft(null);
          setSelectedRight(null);
          setFeedback(null);
        }, 800);
      }
    }
  }, [selectedLeft, selectedRight]);

  // Wave Progression
  useEffect(() => {
    if (currentChunk.length > 0 && matchedIds.size > 0 && matchedIds.size === (currentChunkIndex + 1) * 5) {
        if (currentChunkIndex + 1 < chunks.length) {
            setTimeout(() => setCurrentChunkIndex(i => i + 1), 500);
        } else {
            setTimeout(() => setPhase("summary"), 800);
        }
    }
  }, [matchedIds, currentChunk.length, currentChunkIndex, chunks.length]);

  const startDay = (idx: number) => {
    setSelectedDayIndex(idx);
    setCurrentChunkIndex(0);
    setMatchedIds(new Set());
    setMistakes(0);
    setPhase("active");
  };

  if (!isReady) return null;

  if (phase === "selector") {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <div className="max-w-6xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl h-14 w-14 bg-white shadow-sm">
              <ArrowLeft className="w-8 h-8 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-4xl font-headline font-bold text-slate-800">Match Room</h1>
              <p className="text-slate-500 font-medium">Curriculum Practice & Tests</p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {curriculumDays.map((day, idx) => {
              const unlocked = isDayUnlocked(day.dayOfWeek);
              const isToday = day.dayOfWeek === today;

              return (
                <Card 
                  key={day.id}
                  onClick={() => unlocked && startDay(idx)}
                  className={cn(
                    "relative overflow-hidden group p-8 rounded-[40px] border-none shadow-xl transition-all duration-300",
                    unlocked ? "cursor-pointer hover:scale-105 hover:shadow-2xl bg-white" : "bg-slate-100 opacity-80 cursor-not-allowed",
                    day.isTest && unlocked && "bg-gradient-to-br from-indigo-500 to-purple-600 text-white",
                    isToday && unlocked && !day.isTest && "ring-4 ring-primary ring-offset-4"
                  )}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center",
                      day.isTest ? "bg-white/20" : "bg-slate-50"
                    )}>
                      {unlocked ? <Calendar className={cn("w-7 h-7", day.isTest ? "text-white" : "text-primary")} /> : <Lock className="w-7 h-7 text-slate-300" />}
                    </div>
                    {isToday && unlocked && (
                      <span className="bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Today</span>
                    )}
                    {today === 3 && day.dayOfWeek === 4 && (
                      <span className="bg-amber-400 text-slate-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">Early Access</span>
                    )}
                  </div>
                  
                  <h3 className={cn("text-2xl font-headline font-bold mb-1", day.isTest && "text-white")}>{day.label}</h3>
                  <p className={cn("text-sm font-medium", day.isTest ? "text-white/70" : "text-slate-400")}>{day.sub}</p>
                  
                  {!unlocked && (
                    <div className="mt-8 flex items-center gap-2 text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">Locked</span>
                    </div>
                  )}
                  {unlocked && (
                    <div className="mt-8">
                       <Button variant={day.isTest ? "secondary" : "default"} className="w-full chunky-button rounded-2xl h-12 shadow-sm">
                         {day.isTest ? "START TEST" : "PRACTICE"}
                       </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center font-headline">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-8 mb-12">
            <Button variant="ghost" onClick={() => setPhase("selector")} className="bg-white/5 text-white hover:bg-white/10 rounded-2xl h-12">
              <ArrowLeft className="w-5 h-5 mr-2" /> EXIT
            </Button>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-indigo-400 font-bold uppercase tracking-widest text-sm">
                   Wave {currentChunkIndex + 1} / {chunks.length}
                 </span>
                 <span className="text-white/40 text-xs font-medium">Matching words...</span>
              </div>
              <Progress value={(matchedIds.size / allWordsForDay.length) * 100} className="h-3 bg-white/5" />
            </div>
            <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
               <span className="text-rose-400 font-bold">{mistakes}</span>
               <span className="text-white/30 text-xs uppercase font-bold">Mistakes</span>
            </div>
          </header>

          <main className="grid grid-cols-2 gap-12">
            {/* Left Column: Images */}
            <div className="space-y-4">
              {leftColumn.map((item) => {
                const isMatched = matchedIds.has(item.id);
                const isSelected = selectedLeft === item.id;
                const isWrong = feedback?.type === "wrong" && isSelected;
                const isCorrect = feedback?.type === "correct" && isSelected;

                return (
                  <button
                    key={item.id}
                    disabled={isMatched || (feedback?.type === "wrong")}
                    onClick={() => setSelectedLeft(item.id)}
                    className={cn(
                      "relative w-full h-32 rounded-[28px] overflow-hidden border-4 transition-all duration-300",
                      isMatched ? "opacity-0 scale-90 pointer-events-none" : "hover:scale-[1.02]",
                      isSelected ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]" : "border-white/5",
                      isWrong && "border-rose-500 animate-shake",
                      isCorrect && "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    )}
                  >
                    <Image 
                      src={item.imageUrl} 
                      alt={item.english}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                       <span className="text-white font-bold text-sm uppercase tracking-widest">{item.english}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Translations */}
            <div className="space-y-4">
              {rightColumn.map((item) => {
                const isMatched = matchedIds.has(item.id);
                const isSelected = selectedRight === item.id;
                const isWrong = feedback?.type === "wrong" && isSelected;
                const isCorrect = feedback?.type === "correct" && isSelected;

                return (
                  <button
                    key={item.id}
                    disabled={isMatched || (feedback?.type === "wrong")}
                    onClick={() => setSelectedRight(item.id)}
                    className={cn(
                      "w-full h-32 rounded-[28px] flex items-center justify-center text-4xl font-bold transition-all duration-300 border-4",
                      isMatched ? "opacity-0 scale-90 pointer-events-none" : "hover:scale-[1.02] bg-white/5",
                      isSelected ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]" : "border-white/5 text-white/80",
                      isWrong && "border-rose-500 text-rose-400 bg-rose-500/10 animate-shake",
                      isCorrect && "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                    )}
                    dir="rtl"
                  >
                    {item.hebrew}
                  </button>
                );
              })}
            </div>
          </main>
        </div>

        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .animate-shake { animation: shake 0.2s ease-in-out 4; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-8">
      <Card className="max-w-xl w-full p-12 rounded-[48px] text-center bg-white shadow-2xl border-none">
        <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Trophy className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Day Completed!</h1>
        <p className="text-slate-500 text-lg mb-10">You've successfully matched all word pairs for today.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
           <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Words</p>
              <p className="text-3xl font-bold text-slate-800">{allWordsForDay.length}</p>
           </div>
           <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Mistakes</p>
              <p className="text-3xl font-bold text-rose-500">{mistakes}</p>
           </div>
        </div>

        <Button onClick={() => setPhase("selector")} className="w-full chunky-button chunky-primary h-16 text-xl rounded-2xl">
          BACK TO SELECTOR
        </Button>
      </Card>
    </div>
  );
}
