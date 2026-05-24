
"use client";

import { useState } from "react";
import { useGameState } from "@/hooks/use-game-state";
import { StudyRoom } from "@/components/game/StudyRoom";
import { TrainingGround } from "@/components/game/TrainingGround";
import { ArcadeMode } from "@/components/game/ArcadeMode";
import { StoryMode } from "@/components/game/StoryMode";
import { MatchRoom } from "@/components/game/MatchRoom";
import { Onboarding } from "@/components/game/Onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Zap, BrainCircuit, Coins, BookText, GraduationCap, Trophy, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GameZone = "lobby" | "vocab" | "training" | "arcade" | "mistakes" | "story" | "match";
type MainTab = "study" | "games";

export default function Home() {
  const [currentZone, setCurrentZone] = useState<GameZone>("lobby");
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("study");
  
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

  // Zone rendering
  if (currentZone === "vocab") return <StudyRoom onBack={() => setCurrentZone("lobby")} />;
  if (currentZone === "story") return <StoryMode onBack={() => setCurrentZone("lobby")} />;
  if (currentZone === "match") return <MatchRoom onBack={() => setCurrentZone("lobby")} />;
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

  const hasEnoughMistakes = mistakes.length >= 5;

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden font-body flex flex-col">
      {/* Decorative Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <style>{`
          @keyframes floatAndFade {
            0% { opacity: 0; transform: scale(0.8) translateY(30px); }
            50% { opacity: 0.5; transform: scale(1.2) translateY(-20px); }
            100% { opacity: 0; transform: scale(0.8) translateY(30px); }
          }
          .blob-1 { animation: floatAndFade 8s ease-in-out infinite; }
          .blob-2 { animation: floatAndFade 12s ease-in-out infinite; animation-delay: 3s; }
          .blob-3 { animation: floatAndFade 10s ease-in-out infinite; animation-delay: 6s; }
        `}</style>
        <div className="blob-1 absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400 rounded-full blur-[100px]"></div>
        <div className="blob-2 absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-400 rounded-full blur-[100px]"></div>
        <div className="blob-3 absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-400 rounded-full blur-[100px]"></div>
      </div>

      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-[22px] flex items-center justify-center shadow-lg transition-all duration-300 hover:rotate-6">
               <Zap className="text-white w-8 h-8 fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-slate-800 tracking-tight">LexiLeap</h1>
              <p className="text-slate-400 text-sm font-medium">English Mastery</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border border-white">
            <Coins className="text-amber-500 w-5 h-5 fill-amber-500/20" />
            <span className="text-xl font-headline font-bold text-slate-800">{score.toLocaleString()}</span>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex justify-center mb-12">
          <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as MainTab)} className="w-full max-w-md">
            <TabsList className="grid grid-cols-2 bg-white/50 backdrop-blur shadow-inner p-1 rounded-2xl h-14 border border-white/50">
              <TabsTrigger 
                value="study" 
                className="rounded-xl font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                Study Room
              </TabsTrigger>
              <TabsTrigger 
                value="games" 
                className="rounded-xl font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg"
              >
                Arcade Games
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeMainTab === "study" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group relative flex flex-col rounded-[32px] p-8 border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen className="w-7 h-7 text-sky-600" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-slate-800 mb-2">Word Bank</h3>
                <p className="text-slate-500 text-sm mb-8">Browse the full dictionary with smart search.</p>
                <Button onClick={() => setCurrentZone("vocab")} className="mt-auto chunky-button chunky-primary h-14 rounded-2xl">
                  Open Bank
                </Button>
              </Card>

              <Card className="group relative flex flex-col rounded-[32px] p-8 border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                  <GraduationCap className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-slate-800 mb-2">Daily Quiz</h3>
                <p className="text-slate-500 text-sm mb-8">Test your knowledge with randomized drills.</p>
                <Button onClick={() => setCurrentZone("training")} className="mt-auto chunky-button chunky-primary h-14 rounded-2xl">
                  Start Quiz
                </Button>
              </Card>

              <Card className="group relative flex flex-col rounded-[32px] p-8 border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                  <BookText className="w-7 h-7 text-amber-600" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-slate-800 mb-2">Story Room</h3>
                <p className="text-slate-500 text-sm mb-8">Read "The Great Auction" and take the exam.</p>
                <Button onClick={() => setCurrentZone("story")} className="mt-auto chunky-button chunky-primary h-14 rounded-2xl">
                  Read Story
                </Button>
              </Card>

              <Card className="group relative flex flex-col rounded-[32px] p-8 border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
                  <BrainCircuit className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-slate-800 mb-2">Review</h3>
                <p className="text-slate-500 text-sm mb-8">Targeted practice for your weakest words.</p>
                <Button 
                  disabled={!hasEnoughMistakes}
                  onClick={() => setCurrentZone("mistakes")}
                  className={cn(
                    "mt-auto chunky-button h-14 rounded-2xl",
                    hasEnoughMistakes ? "chunky-primary" : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                  )}
                >
                  {hasEnoughMistakes ? "Review Now" : `Needs ${5 - mistakes.length} more`}
                </Button>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="group relative flex flex-col rounded-[40px] p-10 border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl text-center items-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-[28px] flex items-center justify-center mb-8">
                  <Zap className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-headline font-bold text-slate-800 mb-4">Arcade Mode</h3>
                <p className="text-slate-500 mb-10">Fast-paced reflexive vocabulary challenge.</p>
                <Button onClick={() => setCurrentZone("arcade")} className="w-full chunky-button chunky-primary h-16 rounded-[28px] text-xl">
                  Play Now
                </Button>
              </Card>

              <Card className="group relative flex flex-col rounded-[40px] p-10 border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl text-center items-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-[28px] flex items-center justify-center mb-8">
                  <Gamepad2 className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-3xl font-headline font-bold text-slate-800 mb-4">Match Room</h3>
                <p className="text-slate-500 mb-10">Interactive image-to-word matching curriculum.</p>
                <Button onClick={() => setCurrentZone("match")} className="w-full chunky-button chunky-primary h-16 rounded-[28px] text-xl">
                  Enter Room
                </Button>
              </Card>

              <Card className="group relative flex flex-col rounded-[40px] p-10 border-none shadow-xl bg-white/80 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:shadow-2xl text-center items-center opacity-75">
                <div className="w-20 h-20 bg-slate-100 rounded-[28px] flex items-center justify-center mb-8">
                  <Trophy className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-3xl font-headline font-bold text-slate-800 mb-4">Coming Soon</h3>
                <p className="text-slate-500 mb-10">New multiplayer modes are in development.</p>
                <Button disabled className="w-full chunky-button bg-slate-200 text-slate-400 border-slate-300 h-16 rounded-[28px] text-xl">
                  Locked
                </Button>
              </Card>
            </div>
          )}
        </div>

        <footer className="mt-auto py-12 text-center text-slate-300 text-xs font-medium">
          <p>© 2024 LexiLeap. English Mastery Made Simple.</p>
        </footer>
      </main>

      <Onboarding isOpen={isFirstTime} onClose={completeOnboarding} />
    </div>
  );
}
