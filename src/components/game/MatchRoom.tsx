
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Trophy, 
  Lock, 
  CheckCircle2, 
  Calendar, 
  Sparkles,
  Zap,
  Clock,
  LayoutGrid,
  BrainCircuit
} from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import { cn, shuffleArray } from "@/lib/utils";
import Image from "next/image";

type GamePhase = "selector" | "active" | "summary";
type TabSection = "daily" | "mastery";

type MatchPair = {
  id: string;
  english: string;
  hebrew: string;
  imageUrl: string;
};

export function MatchRoom({ onBack }: { onBack: () => void }) {
  const { filteredVocab, isReady } = useStudyLogic();
  const [phase, setPhase] = useState<GamePhase>("selector");
  const [activeTab, setActiveTab] = useState<TabSection>("daily");
  const [selectedMode, setSelectedMode] = useState<{ id: number; isMastery: boolean } | null>(null);
  
  // Gameplay State
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: "correct" | "wrong" } | null>(null);
  const [mistakes, setMistakes] = useState(0);

  // 1. Curriculum Logic (Sun=0, Mon=1, Tue=2, Wed=3, Thu=4...)
  const today = new Date().getDay();
  const isMasteryVisible = today >= 3; // Visible starting Wednesday

  const dailyDays = useMemo(() => [
    { id: 0, label: "Day 1", sub: "Sunday", dayOfWeek: 0 },
    { id: 1, label: "Day 2", sub: "Monday", dayOfWeek: 1 },
    { id: 2, label: "Day 3", sub: "Tuesday", dayOfWeek: 2 },
    { id: 3, label: "Day 4", sub: "Wednesday", dayOfWeek: 3 },
  ], []);

  // 2. Word Chunking
  const allWordsForSession = useMemo(() => {
    if (!selectedMode || !isReady) return [];
    
    const week = filteredVocab.weeks[filteredVocab.weeks.length - 1];
    if (!week) return [];

    if (selectedMode.isMastery) {
      // Mastery Hub loads all 40 words of the current week
      return week.words; 
    } else {
      // Daily Focus loads strictly its 10 unique words
      const start = selectedMode.id * 10;
      return week.words.slice(start, start + 10);
    }
  }, [selectedMode, isReady, filteredVocab]);

  const chunks = useMemo(() => {
    const pairs: MatchPair[] = allWordsForSession.map(w => ({
      id: w.id,
      english: w.english,
      hebrew: w.hebrew,
      imageUrl: `https://picsum.photos/seed/${w.id}/400/400`
    }));
    
    const result = [];
    for (let i = 0; i < pairs.length; i += 5) {
      result.push(pairs.slice(i, i + 5));
    }
    return result;
  }, [allWordsForSession]);

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
            setTimeout(() => setCurrentChunkIndex(i => i + 1), 800);
        } else {
            setTimeout(() => setPhase("summary"), 1000);
        }
    }
  }, [matchedIds, currentChunk.length, currentChunkIndex, chunks.length]);

  const startMode = (id: number, isMastery: boolean) => {
    setSelectedMode({ id, isMastery });
    setCurrentChunkIndex(0);
    setMatchedIds(new Set());
    setMistakes(0);
    setPhase("active");
  };

  if (!isReady) return null;

  if (phase === "selector") {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl h-14 w-14 bg-white shadow-sm hover:scale-110 active:scale-95 transition-all">
              <ArrowLeft className="w-8 h-8 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-4xl font-headline font-bold text-slate-800">Curriculum Matching</h1>
              <p className="text-slate-500 font-medium">Daily Focus & Mastery Challenges</p>
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabSection)} className="w-full">
            <TabsList className="grid grid-cols-2 bg-slate-200/50 p-1 rounded-3xl h-16 mb-12">
              <TabsTrigger value="daily" className="rounded-2xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">
                DAILY FOCUS
              </TabsTrigger>
              <TabsTrigger value="mastery" className="rounded-2xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                MASTERY HUB
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[400px]">
              {activeTab === "daily" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {dailyDays.map((day) => {
                    const isLocked = day.dayOfWeek > today;
                    const isToday = day.dayOfWeek === today;

                    return (
                      <Card 
                        key={day.id}
                        onClick={() => !isLocked && startMode(day.id, false)}
                        className={cn(
                          "relative group p-8 rounded-[40px] border-none shadow-xl transition-all duration-300",
                          !isLocked ? "cursor-pointer hover:scale-105 bg-white" : "bg-slate-100 opacity-80 cursor-not-allowed",
                          isToday && "ring-4 ring-primary ring-offset-4"
                        )}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                          {isLocked ? <Lock className="w-7 h-7 text-slate-300" /> : <Calendar className="w-7 h-7 text-primary" />}
                        </div>
                        <h3 className="text-2xl font-headline font-bold mb-1 text-slate-800">{day.label}</h3>
                        <p className="text-sm font-medium text-slate-400 mb-8">{day.sub}</p>
                        
                        <Button disabled={isLocked} className="w-full chunky-button chunky-primary rounded-2xl h-12 text-xs">
                          {isLocked ? "LOCKED" : "START SESSION"}
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  {!isMasteryVisible ? (
                    <Card className="p-12 text-center rounded-[48px] bg-slate-100 border-dashed border-2 border-slate-300 opacity-60">
                      <Lock className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                      <h3 className="text-2xl font-headline font-bold text-slate-400 mb-2">Mastery Hub Locked</h3>
                      <p className="text-slate-400">Unlock early on Wednesday to practice for the weekly exam.</p>
                    </Card>
                  ) : (
                    <Card 
                      onClick={() => startMode(4, true)}
                      className="group cursor-pointer overflow-hidden p-12 text-center rounded-[48px] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl transition-all hover:scale-105"
                    >
                      <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                        <Trophy className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-headline font-bold mb-2">Weekly Mastery</h3>
                      <p className="text-white/70 mb-10">Challenge yourself with all 40 words from this week. Prepares you for the final exam.</p>
                      <Button className="w-full h-16 bg-white text-indigo-600 font-bold text-xl rounded-3xl hover:bg-white/90">
                        START CHALLENGE
                      </Button>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col items-center font-headline">
        <div className="max-w-5xl w-full">
          <header className="flex items-center gap-8 mb-12">
            <Button variant="ghost" onClick={() => setPhase("selector")} className="bg-white/5 text-white hover:bg-white/10 rounded-2xl h-12 border border-white/10">
              <ArrowLeft className="w-5 h-5 mr-2" /> EXIT
            </Button>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                 <span className="text-indigo-400 font-bold uppercase tracking-widest text-xs">
                   Wave {currentChunkIndex + 1} / {chunks.length}
                 </span>
                 <span className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Mastery Challenge</span>
              </div>
              <Progress value={(matchedIds.size / allWordsForSession.length) * 100} className="h-3 bg-white/5" />
            </div>
            <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
               <span className="text-white/40 text-xs uppercase font-bold mr-3">Mistakes</span>
               <span className="text-rose-400 font-bold text-xl">{mistakes}</span>
            </div>
          </header>

          {/* Stabilized Grid Container */}
          <main className="grid grid-cols-2 gap-12 min-h-[580px]">
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
                      "relative w-full h-24 sm:h-28 rounded-[28px] overflow-hidden border-4 transition-all duration-300 bg-slate-900 shadow-xl",
                      isMatched ? "opacity-0 scale-90 pointer-events-none translate-y-4" : "hover:scale-[1.02] hover:shadow-2xl",
                      isSelected ? "border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.6)]" : "border-white/5",
                      isWrong && "border-rose-500 animate-shake",
                      isCorrect && "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.6)]"
                    )}
                  >
                    <Image 
                      src={item.imageUrl} 
                      alt={item.english}
                      fill
                      className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-4">
                       <span className="text-white font-bold text-xs uppercase tracking-widest">{item.english}</span>
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
                      "w-full h-24 sm:h-28 rounded-[28px] flex items-center justify-center text-4xl font-bold transition-all duration-300 border-4 shadow-xl",
                      isMatched ? "opacity-0 scale-90 pointer-events-none translate-y-4" : "hover:scale-[1.02] bg-white/5 hover:bg-white/10",
                      isSelected ? "border-indigo-500 text-indigo-400 bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.4)]" : "border-white/5 text-white/80",
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
      <Card className="max-w-xl w-full p-12 rounded-[64px] text-center bg-white shadow-2xl border-none">
        <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Trophy className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Mastery Achieved!</h1>
        <p className="text-slate-500 text-lg mb-10">You've successfully matched all pairs for this session.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
           <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Words</p>
              <p className="text-3xl font-bold text-slate-800">{allWordsForSession.length}</p>
           </div>
           <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Accuracy</p>
              <p className={cn("text-3xl font-bold", mistakes === 0 ? "text-emerald-500" : "text-amber-500")}>
                {Math.round(((allWordsForSession.length) / (allWordsForSession.length + mistakes)) * 100)}%
              </p>
           </div>
        </div>

        <Button onClick={() => setPhase("selector")} className="w-full chunky-button chunky-primary h-16 text-xl rounded-2xl">
          CONTINUE
        </Button>
      </Card>
    </div>
  );
}
