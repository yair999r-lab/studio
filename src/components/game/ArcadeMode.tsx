
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Zap, Skull } from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import vocabData from "@/app/lib/vocabulary.json";
import { cn, shuffleArray } from "@/lib/utils";

type GameState = "ready" | "playing" | "gameover";

const BEAD_DIAMETER = 64; // Matches w-16
const BASE_SPEED = 0.8;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 600;

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
  const [wordChain, setWordChain] = useState<any[]>([]);
  const [headDistance, setHeadDistance] = useState(0);
  const [isPenalty, setIsPenalty] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  
  const pathRef = useRef<SVGPathElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const [pathLength, setPathLength] = useState(0);

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

  const generateOptions = useCallback((target: any) => {
    const currentPool = score >= 10 ? allUnlockedPool : todayPool;
    const distractors = currentPool
      .filter(w => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return shuffleArray([...distractors, target]);
  }, [allUnlockedPool, todayPool, score]);

  const addWordToChain = useCallback(() => {
    const currentPool = score >= 10 ? allUnlockedPool : todayPool;
    if (currentPool.length === 0) return null;
    const word = currentPool[Math.floor(Math.random() * currentPool.length)];
    return {
      instanceId: Math.random().toString(36).substr(2, 9),
      ...word,
      options: generateOptions(word)
    };
  }, [allUnlockedPool, todayPool, score, generateOptions]);

  const startGame = () => {
    const initialChain = Array.from({ length: 10 }, () => addWordToChain());
    setWordChain(initialChain);
    setScore(0);
    setLives(2);
    setHeadDistance(0);
    setGameState("playing");
  };

  // Setup path length
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [gameState]);

  // Game Loop
  const animate = useCallback(() => {
    if (gameState !== "playing") return;

    setHeadDistance(prev => {
      const speedMultiplier = 1 + Math.floor(score / 5) * 0.15;
      const nextDistance = prev + BASE_SPEED * speedMultiplier;

      // Fail condition: Lead bead reaches the end
      if (nextDistance >= pathLength && pathLength > 0) {
        setLives(l => {
          const nextLives = l - 1;
          if (nextLives <= 0) setGameState("gameover");
          return nextLives;
        });
        setFlashRed(true);
        setTimeout(() => setFlashRed(false), 300);
        
        // Remove leader and keep chain moving
        setWordChain(prevChain => {
          const newChain = [...prevChain];
          newChain.shift();
          newChain.push(addWordToChain());
          return newChain;
        });
        
        return nextDistance - BEAD_DIAMETER; // Prevent cascade jump
      }

      return nextDistance;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, score, pathLength, addWordToChain]);

  useEffect(() => {
    if (gameState === "playing") {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, animate]);

  const handleAnswer = (isCorrect: boolean) => {
    if (isPenalty || wordChain.length === 0) return;

    if (isCorrect) {
      setWordChain(prev => {
        const next = [...prev];
        next.shift(); // Remove leader
        next.push(addWordToChain()); // Add new tail to keep chain long
        return next;
      });
      // Zuma snap-forward: We DON'T decrement headDistance. 
      // The new index 0 immediately takes the position of the old index 0.
      setScore(s => {
        const nextScore = s + 1;
        onScore(1);
        return nextScore;
      });
    } else {
      setIsPenalty(true);
      setTimeout(() => setIsPenalty(false), 1000);
    }
  };

  const getPoint = (distance: number) => {
    if (!pathRef.current) return { x: -100, y: -100 };
    return pathRef.current.getPointAtLength(Math.max(0, distance));
  };

  if (!isReady) return null;

  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-headline relative">
        <Card className="max-w-xl w-full bg-white/10 backdrop-blur-xl border-white/20 rounded-[40px] p-12 text-center relative z-10 shadow-2xl">
          <div className="w-24 h-24 bg-primary rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-lg transform rotate-12">
            <Zap className="text-white w-12 h-12 fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">Word Chain</h1>
          <p className="text-slate-300 mb-12 text-lg leading-relaxed">
            Stop the chain before it reaches the exit!<br/>
            Speed increases every 5 points.
          </p>
          <div className="space-y-4">
            <Button onClick={startGame} className="w-full chunky-button chunky-primary h-20 text-2xl rounded-3xl">
              START DEFENSE
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold hover:text-white">
              Return to Lobby
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-headline">
        <Card className="max-w-xl w-full bg-white/10 backdrop-blur-xl border-white/20 rounded-[48px] p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Skull className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-10">Defense Failed</h1>
          <div className="bg-white/5 p-12 rounded-[40px] mb-12 border border-white/10 shadow-inner">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Total Score</p>
            <p className="text-8xl font-bold text-primary tracking-tighter">{score}</p>
          </div>
          <div className="space-y-4">
            <Button onClick={startGame} className="w-full chunky-button chunky-primary h-16 text-xl">
              TRY AGAIN
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold hover:text-white">
              LOBBY
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col bg-slate-950 overflow-hidden font-headline transition-colors duration-300",
      flashRed && "bg-rose-950"
    )}>
      {/* 1. TOP AREA: Game Board */}
      <div className="flex-1 relative overflow-hidden bg-slate-900/50">
        {/* HUD Overlay */}
        <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-start z-50 pointer-events-none">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="pointer-events-auto bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl text-white font-bold h-12 border border-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> EXIT
          </Button>

          <div className="flex flex-col items-end gap-4">
            <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex gap-3">
              {[...Array(2)].map((_, i) => (
                <Heart key={i} className={cn("w-8 h-8", i < lives ? "text-rose-500 fill-rose-500" : "text-white/5")} />
              ))}
            </div>
            <div className="bg-primary text-white px-8 py-3 rounded-2xl shadow-xl font-bold text-3xl border-b-4 border-indigo-800">
              {score}
            </div>
          </div>
        </div>

        {/* SVG Game Board */}
        <svg 
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet" 
          className="w-full h-full absolute inset-0 z-0"
        >
          {/* Neon Track S-Curve */}
          <path 
            ref={pathRef}
            id="snake-path"
            d="M -50,150 C 300,150 400,350 700,350 C 950,350 950,550 750,550 L 150,550" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="70" 
            strokeLinecap="round" 
          />
          <path 
            d="M -50,150 C 300,150 400,350 700,350 C 950,350 950,550 750,550 L 150,550" 
            fill="none" 
            stroke="#3f3f46" 
            strokeWidth="60" 
            strokeLinecap="round" 
          />
          
          {/* Exit Hole */}
          <g transform="translate(150, 550)">
            <circle r="50" fill="#09090b" stroke="#3f3f46" strokeWidth="4" />
            <circle r="40" fill="rgba(239, 68, 68, 0.1)" className="animate-pulse" />
          </g>
        </svg>

        {/* Beads (React Components mapped to SVG path) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {wordChain.map((bead, index) => {
            const distance = headDistance - (index * BEAD_DIAMETER);
            if (distance < -50 || distance > pathLength + 50) return null;
            
            const point = getPoint(distance);
            const isLeader = index === 0;
            
            return (
              <div 
                key={bead.instanceId}
                className={cn(
                  "absolute transition-opacity duration-300",
                  isLeader ? "z-30" : "z-20"
                )}
                style={{ 
                  left: point.x, 
                  top: point.y, 
                  transform: 'translate(-50%, -50%)',
                  opacity: distance < 0 ? 0 : 1
                }}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full border-4 flex items-center justify-center text-center p-2 shadow-2xl transition-all",
                  isLeader 
                    ? "bg-indigo-600 border-white shadow-[0_0_20px_rgba(255,255,255,0.6)] scale-110" 
                    : "bg-slate-700 border-slate-500 opacity-90"
                )}>
                  <span className="font-bold text-white text-[10px] leading-tight break-words">
                    {bead.english}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BOTTOM AREA: Controls */}
      <div className="h-[35vh] bg-slate-950/95 border-t border-white/10 p-6 flex flex-col justify-center items-center z-50">
        <div className="max-w-4xl w-full">
          {wordChain.length > 0 && headDistance > 0 ? (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-5">
              {wordChain[0].options.map((opt: any, i: number) => (
                <Button
                  key={i}
                  disabled={isPenalty}
                  onClick={() => handleAnswer(opt.id === wordChain[0].id)}
                  className={cn(
                    "h-16 sm:h-20 text-xl sm:text-2xl font-bold rounded-3xl transition-all border-none shadow-xl",
                    !isPenalty && "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.02] active:scale-95",
                    isPenalty && "opacity-20 grayscale cursor-not-allowed"
                  )}
                  dir="rtl"
                >
                  {opt.hebrew}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">
              Preparing Defense...
            </div>
          )}
          
          {isPenalty && (
            <div className="text-center mt-4">
              <span className="text-rose-400 text-sm font-bold uppercase tracking-widest animate-pulse">
                PENALTY: WAIT 1S
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
