"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/use-game-state";
import { StudyRoom } from "@/components/game/StudyRoom";
import { TrainingGround } from "@/components/game/TrainingGround";
import { ArcadeMode } from "@/components/game/ArcadeMode";
import { Onboarding } from "@/components/game/Onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Sword, Zap, BrainCircuit, Coins, Lock, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type GameZone = "lobby" | "study" | "training" | "arcade" | "mistakes";

export default function Home() {
  const [currentZone, setCurrentZone] = useState<GameZone>("lobby");
  const { 
    score, 
    mistakes, 
    isFirstTime, 
    addScore, 
    addMistake, 
    resolveMistake, 
    completeOnboarding,
    loaded 
  } = useGameState();

  if (!loaded) return null;

  if (currentZone === "study") return <StudyRoom onBack={() => setCurrentZone("lobby")} />;
  if (currentZone === "training") return (
    <TrainingGround 
      onBack={() => setCurrentZone("lobby")} 
      onCorrect={(id) => addScore(10)}
      onWrong={(word) => addMistake(word)}
    />
  );
  if (currentZone === "arcade") return (
    <ArcadeMode 
      onBack={() => setCurrentZone("lobby")} 
      onScore={(amt) => addScore(amt * 5)}
    />
  );
  if (currentZone === "mistakes") return (
    <TrainingGround 
      mistakePool={mistakes}
      onBack={() => setCurrentZone("lobby")}
      onCorrect={(id) => resolveMistake(id, true)}
      onWrong={(id) => resolveMistake(id, false)}
    />
  );

  const hasEnoughMistakes = mistakes.length >= 10;

  return (
    <div className="min-h-screen bg-[#f8faff] font-body overflow-hidden relative flex flex-col">
      {/* Decorative Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/30 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none"></div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 relative z-10 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-[20px] flex items-center justify-center shadow-[0_8px_16px_rgba(59,130,246,0.3)]">
               <Zap className="text-white w-8 h-8 fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-slate-800 tracking-tight leading-tight">LexiLeap</h1>
              <p className="text-slate-400 text-sm font-medium">Elevate your English mastery</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white pl-3 pr-8 py-3 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] border border-white">
            <div className="bg-amber-400 w-10 h-10 rounded-2xl flex items-center justify-center">
              <Coins className="text-white w-6 h-6 fill-white/20" />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Score</p>
              <p className="text-2xl font-headline font-bold text-slate-800 leading-none">{score.toLocaleString()}</p>
            </div>
          </div>
        </header>

        {/* Zone Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="group flex flex-col rounded-[32px] p-8 border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] bg-white">
            <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-sky-500" />
            </div>
            <h3 className="text-xl font-headline font-bold text-slate-800 mb-2">Study Room</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 flex-1">
              Flip cards and build your basic vocabulary. Essential for beginners.
            </p>
            <Button 
              onClick={() => setCurrentZone("study")}
              className="w-full chunky-button chunky-primary text-sm tracking-wide h-12 rounded-2xl"
            >
              ENTER ROOM
            </Button>
          </Card>

          <Card className="group flex flex-col rounded-[32px] p-8 border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] bg-white">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Sword className="w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-xl font-headline font-bold text-slate-800 mb-2">Training Ground</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 flex-1">
              Interactive quizzes across 3 difficulty tiers to solidify your learning.
            </p>
            <Button 
              onClick={() => setCurrentZone("training")}
              className="w-full chunky-button chunky-primary text-sm tracking-wide h-12 rounded-2xl"
            >
              START DRILLS
            </Button>
          </Card>

          <Card className="group flex flex-col rounded-[32px] p-8 border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] bg-white">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-xl font-headline font-bold text-slate-800 mb-2">Arcade Mode</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 flex-1">
              Test your reflexes and speed. Pop word bubbles and maintain your combo!
            </p>
            <Button 
              onClick={() => setCurrentZone("arcade")}
              className="w-full chunky-button chunky-primary text-sm tracking-wide h-12 rounded-2xl"
            >
              PLAY GAME
            </Button>
          </Card>
        </div>

        {/* Mistakes Section */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-2xl">
            <button 
              disabled={!hasEnoughMistakes}
              onClick={() => setCurrentZone("mistakes")}
              className={cn(
                "w-full chunky-button border-b-8 flex items-center justify-center gap-4 py-8 text-xl font-headline transition-all",
                hasEnoughMistakes ? "chunky-primary" : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60"
              )}
            >
              <BrainCircuit className={cn("w-8 h-8", hasEnoughMistakes ? "text-white" : "text-slate-400")} />
              PRACTICE MISTAKES
              {hasEnoughMistakes && (
                <span className="absolute -top-3 -right-3 bg-rose-500 text-white text-[10px] px-2.5 py-1 rounded-full border-2 border-white shadow-lg font-bold tracking-tighter uppercase">
                  READY!
                </span>
              )}
            </button>
          </div>
          <p className="mt-6 text-slate-400 text-sm font-medium flex items-center gap-2">
            {!hasEnoughMistakes && <Lock className="w-3.5 h-3.5" />}
            {hasEnoughMistakes && <Info className="w-3.5 h-3.5" />}
            {hasEnoughMistakes ? "Practice your weakest words!" : `Collect at least ${10 - mistakes.length} more mistakes to unlock`}
          </p>
        </div>
      </main>

      <Onboarding isOpen={isFirstTime} onClose={completeOnboarding} />

      <footer className="py-12 text-center text-slate-300 text-xs font-medium">
        <p>© 2024 LexiLeap. Your English Journey Starts Here.</p>
      </footer>
    </div>
  );
}
