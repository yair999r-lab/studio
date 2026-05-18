
"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/use-game-state";
import { StudyRoom } from "@/components/game/StudyRoom";
import { TrainingGround } from "@/components/game/TrainingGround";
import { ArcadeMode } from "@/components/game/ArcadeMode";
import { MistakesReview } from "@/components/game/MistakesReview";
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
      onCorrect={() => addScore(10)}
      onWrong={(word) => addMistake(word)}
    />
  );
  if (currentZone === "arcade") return (
    <ArcadeMode 
      onBack={() => setCurrentZone("lobby")} 
      onMistake={(word) => addMistake(word)}
      onScore={(amt) => addScore(amt * 5)}
    />
  );
  if (currentZone === "mistakes") return (
    <MistakesReview 
      mistakePool={mistakes} 
      onBack={() => setCurrentZone("lobby")}
      onCorrect={(id) => resolveMistake(id, true)}
      onWrong={(id) => resolveMistake(id, false)}
    />
  );

  return (
    <div className="min-h-screen bg-background font-headline overflow-hidden relative">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        <header className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center shadow-lg border-b-4 border-blue-700">
               <Zap className="text-white w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800 tracking-tight">LexiLeap</h1>
              <p className="text-slate-500 font-medium">Elevate your English mastery</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white px-8 py-4 rounded-[32px] shadow-xl border-b-8 border-slate-100">
            <div className="bg-amber-400 p-2 rounded-xl">
              <Coins className="text-white w-6 h-6" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Score</p>
              <p className="text-2xl font-bold text-slate-800">{score.toLocaleString()}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Study Room */}
          <Card 
            onClick={() => setCurrentZone("study")}
            className="group cursor-pointer rounded-[48px] p-8 border-2 border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white"
          >
            <div className="w-16 h-16 bg-sky-100 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-sky-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Study Room</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Flip cards and build your base vocabulary. Essential for beginners.</p>
            <Button className="w-full chunky-button chunky-secondary text-lg">ENTER ROOM</Button>
          </Card>

          {/* Training Ground */}
          <Card 
             onClick={() => setCurrentZone("training")}
             className="group cursor-pointer rounded-[48px] p-8 border-2 border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white"
          >
            <div className="w-16 h-16 bg-primary/10 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sword className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Training Ground</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Interactive quizzes across 3 difficulty tiers to solidify your learning.</p>
            <Button className="w-full chunky-button chunky-primary text-lg">START DRILLS</Button>
          </Card>

          {/* Arcade Mode */}
          <Card 
            onClick={() => setCurrentZone("arcade")}
            className="group cursor-pointer rounded-[48px] p-8 border-2 border-slate-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Arcade Mode</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">Test your reflexes and speed. Pop word bubbles and maintain your combo!</p>
            <Button className="w-full chunky-button chunky-success text-lg">PLAY GAME</Button>
          </Card>
        </div>

        <div className="mt-16 flex flex-col items-center">
          <button 
            disabled={mistakes.length < 10}
            onClick={() => setCurrentZone("mistakes")}
            className={cn(
              "w-full max-w-2xl chunky-button border-b-8 flex items-center justify-center gap-4 py-8 text-2xl relative transition-opacity",
              mistakes.length >= 10 ? "chunky-primary" : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            )}
          >
            <BrainCircuit className={cn("w-10 h-10", mistakes.length >= 10 ? "text-white" : "text-slate-300")} />
            {mistakes.length >= 10 ? "PRACTICE MISTAKES" : "LOCKED: PRACTICE MISTAKES"}
            {mistakes.length < 10 && (
              <span className="absolute -top-4 -right-4 bg-slate-800 text-white text-xs px-3 py-1 rounded-full border-2 border-white shadow-lg flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3" /> {mistakes.length} / 10
              </span>
            )}
            {mistakes.length >= 10 && (
              <span className="absolute -top-4 -right-4 bg-rose-500 text-white text-xs px-3 py-1 rounded-full border-2 border-white shadow-lg flex items-center gap-1 font-bold animate-bounce">
                READY!
              </span>
            )}
          </button>
          <p className="mt-6 text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4" /> Collect at least 10 words in your Mistake Bank to unlock AI Practice
          </p>
        </div>
      </main>

      <Onboarding isOpen={isFirstTime} onClose={completeOnboarding} />

      <footer className="mt-auto py-12 text-center text-slate-400 text-sm">
        <p>© 2024 LexiLeap. Your English Journey Starts Here.</p>
      </footer>
    </div>
  );
}
