
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Zap, Trophy, Skull } from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import vocabData from "@/app/lib/vocabulary.json";
import { cn, shuffleArray } from "@/lib/utils";

type GameState = "ready" | "playing" | "gameover";

export function ArcadeMode({ 
  onBack, 
  onScore 
}: { 
  onBack: () => void; 
  onScore: (amount: number) => void;
}) {
  const { filteredVocab, isReady } = useStudyLogic();
  const [gameState, setGameState] = useState<GameState>("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(2);
  const [yPos, setYPos] = useState(0); // 0 to 100 percentage
  const [activeWord, setActiveWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [isPenalty, setIsPenalty] = useState(false);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [flashRed, setFlashRed] = useState(false);
  const [speed, setSpeed] = useState(0.15); // Percentage per frame

  const gameLoopRef = useRef<number | null>(null);

  // Pool management
  const todayPool = useMemo(() => {
    return filteredVocab.weeks.flatMap(w => w.words);
  }, [filteredVocab]);

  const allUnlockedPool = useMemo(() => {
    const maxWeekId = Math.max(...vocabData.weeks.map(w => w.week_id));
    const pastWords = vocabData.weeks
      .filter(w => w.week_id < maxWeekId)
      .flatMap(w => w.words);
    return [...pastWords, ...todayPool];
  }, [todayPool]);

  const spawnSnake = useCallback(() => {
    // Phase logic
    const currentPool = score >= 10 ? allUnlockedPool : todayPool;
    if (currentPool.length === 0) return;

    const target = currentPool[Math.floor(Math.random() * currentPool.length)];
    
    // Distractors from the same pool
    const distractors = currentPool
      .filter(w => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    const combined = shuffleArray([...distractors, target]);
    
    setActiveWord(target);
    setOptions(combined);
    setYPos(-10); // Start slightly above view
    setWrongIndex(null);
    setIsPenalty(false);
  }, [allUnlockedPool, todayPool, score]);

  const initGame = () => {
    setScore(0);
    setLives(2);
    setSpeed(0.15);
    setGameState("playing");
    spawnSnake();
  };

  // The Game Loop
  useEffect(() => {
    if (gameState !== "playing" || !activeWord) return;

    const frame = () => {
      setYPos(prev => {
        const next = prev + speed;
        if (next >= 100) {
          // Snake hit the bottom
          handleMiss();
          return -10;
        }
        return next;
      });
      gameLoopRef.current = requestAnimationFrame(frame);
    };

    gameLoopRef.current = requestAnimationFrame(frame);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, activeWord, speed]);

  const handleMiss = () => {
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setGameState("gameover");
      }
      return next;
    });
    setFlashRed(true);
    setTimeout(() => setFlashRed(false), 300);
    spawnSnake();
  };

  const handleAnswer = (index: number, isCorrect: boolean) => {
    if (isPenalty || isCorrect === null) return;

    if (isCorrect) {
      setScore(prev => {
        const next = prev + 1;
        // Progression: Speed up every 5 points
        if (next % 5 === 0) {
          setSpeed(s => s + 0.05);
        }
        onScore(1);
        return next;
      });
      spawnSnake();
    } else {
      // Wrong Click: 1s Penalty
      setWrongIndex(index);
      setIsPenalty(true);
      setTimeout(() => {
        setIsPenalty(false);
        setWrongIndex(null);
      }, 1000);
    }
  };

  if (!isReady) return null;

  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full bg-white/95 backdrop-blur-md rounded-[40px] p-12 shadow-2xl border-none text-center">
          <div className="w-24 h-24 bg-emerald-500 rounded-[32px] mx-auto mb-8 flex items-center justify-center border-4 border-white shadow-xl rotate-12">
             <Zap className="text-white w-12 h-12 fill-white" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4 tracking-tight">Arcade Mode</h1>
          <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed">
            Stop the snake before it hits the bottom!<br/>
            Speed increases every 5 points.
          </p>

          <div className="space-y-6">
            <Button 
              onClick={initGame} 
              className="w-full chunky-button chunky-primary text-2xl py-10 rounded-[28px]"
            >
              START GAME
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold hover:text-primary py-4">
              Return to Lobby
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-6">
        <Card className="max-w-xl w-full bg-white/95 backdrop-blur-md rounded-[48px] p-12 shadow-2xl border-none text-center">
          <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Skull className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-slate-800 mb-8">Game Over</h1>
          
          <div className="bg-slate-50 p-10 rounded-[40px] mb-10 shadow-inner border border-slate-100">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Final Score</p>
            <p className="text-7xl font-bold text-indigo-600 tracking-tighter">{score}</p>
          </div>

          <div className="space-y-4">
            <Button onClick={initGame} className="w-full chunky-button chunky-primary text-xl py-8">
              TRY AGAIN
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold py-4">
              RETURN TO LOBBY
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 bg-slate-900 overflow-hidden font-headline transition-colors duration-300",
      flashRed && "bg-rose-950"
    )}>
      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-center z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl text-white font-bold h-12"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> EXIT
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-2xl border border-white/20 flex gap-2">
            {[...Array(2)].map((_, i) => (
              <Heart key={i} className={cn("w-7 h-7 transition-all duration-300", i < lives ? "text-rose-500 fill-rose-500" : "text-white/10")} />
            ))}
          </div>
          <div className="bg-amber-400 text-white px-8 py-3 rounded-2xl shadow-xl border-b-4 border-amber-600 font-bold text-3xl">
            {score}
          </div>
        </div>
      </div>

      {/* Play Area */}
      <div className="relative h-full w-full max-w-2xl mx-auto flex flex-col justify-end pb-32">
        {/* The Falling Snake */}
        {activeWord && (
          <div 
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-75"
            style={{ top: `${yPos}%` }}
          >
            <div className="bg-white px-8 py-4 rounded-[28px] shadow-2xl border-4 border-sky-400 flex items-center gap-4 whitespace-nowrap">
              <span className="text-3xl">🐍</span>
              <span className="text-3xl font-bold text-slate-800">{activeWord.english}</span>
            </div>
          </div>
        )}

        {/* Answer Buttons */}
        <div className="relative z-20 grid grid-cols-1 gap-4 px-6">
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, i) => (
              <Button
                key={i}
                disabled={isPenalty}
                onClick={() => handleAnswer(i, opt.id === activeWord?.id)}
                className={cn(
                  "chunky-button h-20 text-2xl font-bold rounded-3xl transition-all duration-300",
                  !isPenalty && "bg-white text-slate-800 border-slate-200 hover:scale-105 active:scale-95",
                  isPenalty && "opacity-50 grayscale cursor-not-allowed",
                  isPenalty && wrongIndex === i && "bg-rose-500 text-white border-rose-700 opacity-100 grayscale-0 animate-shake"
                )}
                dir="rtl"
              >
                {opt.hebrew}
              </Button>
            ))}
          </div>
          {isPenalty && (
            <div className="text-center text-rose-400 font-bold animate-pulse uppercase tracking-widest mt-2">
              Wait... 1s Penalty!
            </div>
          )}
        </div>
      </div>

      {/* Bottom Danger Zone */}
      <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-rose-500/50 to-transparent pointer-events-none" />
      
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.15s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
