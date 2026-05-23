
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Zap, Skull } from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import vocabData from "@/app/lib/vocabulary.json";
import { cn, shuffleArray } from "@/lib/utils";

type GameState = "ready" | "playing" | "gameover";

interface Bead {
  id: string;
  word: any;
  progress: number; // 0 to 1
  options: any[];
}

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
  const [beads, setBeads] = useState<Bead[]>([]);
  const [isPenalty, setIsPenalty] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [speed, setSpeed] = useState(0.0008);
  
  const gameLoopRef = useRef<number | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

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

  const createBead = useCallback(() => {
    const currentPool = score >= 10 ? allUnlockedPool : todayPool;
    if (currentPool.length === 0) return null;

    const target = currentPool[Math.floor(Math.random() * currentPool.length)];
    const distractors = currentPool
      .filter(w => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      word: target,
      progress: 0,
      options: shuffleArray([...distractors, target])
    };
  }, [allUnlockedPool, todayPool, score]);

  const startGame = () => {
    setScore(0);
    setLives(2);
    setSpeed(0.0008);
    setBeads([]);
    setGameState("playing");
  };

  // Main Game Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const update = () => {
      setBeads(prevBeads => {
        // 1. Update progress for all beads
        const updated = prevBeads.map(b => ({
          ...b,
          progress: b.progress + speed
        }));

        // 2. Check for loss condition: ONLY when the leader hits progress 1.0
        if (updated.length > 0 && updated[0].progress >= 1) {
          updated.shift();
          setLives(l => {
            const next = l - 1;
            if (next <= 0) {
              setGameState("gameover");
            }
            return next;
          });
          setFlashRed(true);
          setTimeout(() => setFlashRed(false), 300);
        }

        // 3. Spawning logic: Tightly packed based on bead diameter
        // Bead diameter is ~80px, total path length is ~1200px. Threshold = 80/1200 = 0.066
        const spawnThreshold = 0.07; 
        const lastBead = updated[updated.length - 1];

        if (!lastBead || lastBead.progress > spawnThreshold) {
          const newBead = createBead();
          if (newBead) {
            updated.push(newBead);
          }
        }

        return updated;
      });

      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, speed, createBead]);

  const handleAnswer = (beadId: string, isCorrect: boolean) => {
    if (isPenalty || beads.length === 0) return;

    // Only allow answering the Leader bead
    if (beadId !== beads[0].id) return;

    if (isCorrect) {
      setBeads(prev => prev.slice(1));
      setScore(s => {
        const next = s + 1;
        if (next % 5 === 0) setSpeed(prev => prev + 0.0001);
        onScore(1);
        return next;
      });
    } else {
      setIsPenalty(true);
      setTimeout(() => setIsPenalty(false), 1000);
    }
  };

  const getCoordinates = (progress: number) => {
    if (!pathRef.current) return { x: 0, y: 0 };
    const length = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(length * Math.min(progress, 1));
    return { x: point.x, y: point.y };
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
          viewBox="0 0 1000 600" 
          preserveAspectRatio="xMidYMid meet" 
          className="w-full h-full absolute inset-0 z-0"
        >
          {/* Neon Track */}
          <path 
            ref={pathRef}
            d="M 100,100 C 400,100 400,300 700,300 C 900,300 900,500 700,500 L 200,500" 
            fill="none" 
            stroke="#27272a" 
            strokeWidth="80" 
            strokeLinecap="round" 
          />
          <path 
            d="M 100,100 C 400,100 400,300 700,300 C 900,300 900,500 700,500 L 200,500" 
            fill="none" 
            stroke="#3f3f46" 
            strokeWidth="70" 
            strokeLinecap="round" 
          />
          <path 
            d="M 100,100 C 400,100 400,300 700,300 C 900,300 900,500 700,500 L 200,500" 
            fill="none" 
            stroke="rgba(129, 140, 248, 0.2)" 
            strokeWidth="82" 
            strokeLinecap="round" 
          />
          
          {/* Exit Hole */}
          <g transform="translate(200, 500)">
            <circle r="55" fill="#09090b" stroke="#3f3f46" strokeWidth="4" />
            <circle r="45" fill="rgba(239, 68, 68, 0.1)" className="animate-pulse" />
          </g>

          {/* Snake Head */}
          <g transform="translate(100, 100)">
            <circle r="60" fill="#10b981" className="opacity-20 blur-xl" />
            <text x="-35" y="30" fontSize="80" className="select-none">🐍</text>
          </g>
        </svg>

        {/* Beads (React Components synced to SVG) */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {beads.map((bead, index) => {
            const coords = getCoordinates(bead.progress);
            const isLeader = index === 0;
            
            // Adjust coordinates based on the SVG-to-screen scale manually isn't needed if we use absolute container that matches svg aspect ratio
            // But better to use SVG foreignObject or just scaling. Let's use simple scaling for 1000x600 viewBox
            return (
              <div 
                key={bead.id}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75",
                  isLeader ? "z-30" : "z-20"
                )}
                style={{ 
                  left: `${(coords.x / 1000) * 100}%`, 
                  top: `${(coords.y / 600) * 100}%` 
                }}
              >
                <div className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 flex items-center justify-center text-center p-2 shadow-2xl transition-all",
                  isLeader 
                    ? "bg-indigo-600 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] scale-110" 
                    : "bg-slate-700 border-slate-500 opacity-90"
                )}>
                  <span className="font-bold text-white text-[10px] sm:text-xs leading-tight break-words">
                    {bead.word.english}
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
          {beads.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-bottom-5">
              {beads[0].options.map((opt, i) => (
                <Button
                  key={i}
                  disabled={isPenalty}
                  onClick={() => handleAnswer(beads[0].id, opt.id === beads[0].word.id)}
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
