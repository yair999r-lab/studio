
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
  const [speed, setSpeed] = useState(0.0005); // Progress per frame
  
  const gameLoopRef = useRef<number | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const spawnInterval = 3000; // MS between spawns

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
    lastSpawnTime.current = Date.now();
  };

  // Main Game Loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const update = () => {
      setBeads(prevBeads => {
        let newLives = lives;
        const updated = prevBeads.map(b => ({
          ...b,
          progress: b.progress + speed
        })).filter(b => {
          if (b.progress >= 1) {
            // Bead reached the end
            setLives(l => {
              const next = l - 1;
              if (next <= 0) setGameState("gameover");
              return next;
            });
            setFlashRed(true);
            setTimeout(() => setFlashRed(false), 300);
            return false;
          }
          return true;
        });

        // Spawning logic
        const now = Date.now();
        const timeSinceLast = now - lastSpawnTime.current;
        const adjustedInterval = Math.max(1500, spawnInterval - (score * 50));

        if (timeSinceLast > adjustedInterval || updated.length === 0) {
          const newBead = createBead();
          if (newBead) {
            lastSpawnTime.current = now;
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
  }, [gameState, speed, score, createBead, lives]);

  const handleAnswer = (beadId: string, isCorrect: boolean) => {
    if (isPenalty) return;

    if (isCorrect) {
      setBeads(prev => prev.filter(b => b.id !== beadId));
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

  // SVG Path calculation
  const getCoordinates = (progress: number) => {
    if (!pathRef.current) return { x: 0, y: 0 };
    const length = pathRef.current.getTotalLength();
    const point = pathRef.current.getPointAtLength(length * progress);
    return { x: point.x, y: point.y };
  };

  if (!isReady) return null;

  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-headline overflow-hidden relative">
         <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" viewBox="0 0 1000 1000">
               <path d="M -100 200 Q 300 100 500 400 T 1100 500" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 10" />
            </svg>
         </div>
        <Card className="max-w-xl w-full bg-white/10 backdrop-blur-xl border-white/20 rounded-[40px] p-12 text-center relative z-10 shadow-2xl">
          <div className="w-24 h-24 bg-primary rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-lg transform rotate-12">
            <Zap className="text-white w-12 h-12 fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">Word Chain</h1>
          <p className="text-slate-300 mb-12 text-lg leading-relaxed">
            Stop the words before they reach the hole!<br/>
            Speed increases as you master more words.
          </p>
          <div className="space-y-4">
            <Button onClick={startGame} className="w-full chunky-button chunky-primary h-20 text-2xl rounded-3xl transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer">
              DEFEND NOW
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold hover:text-white transition-colors">
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
            <Button onClick={startGame} className="w-full chunky-button chunky-primary h-16 text-xl transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer">
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
      "fixed inset-0 bg-slate-950 overflow-hidden font-headline transition-colors duration-300",
      flashRed && "bg-rose-950"
    )}>
      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-start z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl text-white font-bold h-12 border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> EXIT
          </Button>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex gap-3 shadow-xl">
            {[...Array(2)].map((_, i) => (
              <Heart key={i} className={cn("w-8 h-8 transition-all duration-500", i < lives ? "text-rose-500 fill-rose-500 scale-110" : "text-white/5 grayscale")} />
            ))}
          </div>
          <div className="bg-primary text-white px-10 py-4 rounded-3xl shadow-2xl border-b-4 border-indigo-800 font-bold text-4xl">
            {score}
          </div>
        </div>
      </div>

      {/* The Zuma Arena */}
      <div className="absolute inset-0 z-10">
        <svg width="100%" height="100%" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" className="opacity-100">
          {/* Solid Track Path */}
          <path 
            ref={pathRef}
            id="gamePath"
            d="M 50 150 C 400 50, 600 250, 300 350 S 100 550, 400 650 S 900 650, 950 400" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="80" 
            strokeLinecap="round"
          />
          {/* Inner Decorative Stroke */}
          <path 
            d="M 50 150 C 400 50, 600 250, 300 350 S 100 550, 400 650 S 900 650, 950 400" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth="70" 
            strokeLinecap="round"
          />
          
          {/* The Exit Hole */}
          <circle cx="950" cy="400" r="45" fill="#000" stroke="#ef4444" strokeWidth="4" className="animate-pulse" />
          <circle cx="950" cy="400" r="20" fill="#ef4444" opacity="0.3" className="animate-ping" />
        </svg>

        {/* Snake Head (Sitting at path origin M 50 150) */}
        <div className="absolute top-[150px] left-[50px] -translate-x-1/2 -translate-y-1/2 z-40">
           <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-transform hover:scale-110">
              <span className="text-6xl select-none">🐍</span>
           </div>
        </div>

        {/* Active Beads */}
        {beads.map((bead) => {
          const coords = getCoordinates(bead.progress);
          const isFront = bead.id === beads[0]?.id;
          return (
            <div 
              key={bead.id}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 z-20",
                isFront ? "z-30 scale-100" : "scale-90 opacity-80"
              )}
              style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
            >
              <div className={cn(
                "w-24 h-24 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.4)] border-4 flex items-center justify-center text-center p-2 transition-all duration-300",
                isFront 
                  ? "bg-gradient-to-br from-primary to-indigo-600 border-white scale-110" 
                  : "bg-gradient-to-br from-slate-700 to-slate-800 border-slate-500"
              )}>
                <span className={cn(
                  "font-bold leading-tight break-words transition-all duration-300",
                  isFront ? "text-white text-base" : "text-slate-400 text-sm"
                )}>
                  {bead.word.english}
                </span>
              </div>
              {isFront && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                   <Zap className="w-8 h-8 text-primary fill-primary animate-bounce shadow-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Answer Console */}
      <div className="absolute bottom-12 inset-x-0 z-50 px-8 max-w-4xl mx-auto">
        {beads.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {beads[0].options.map((opt, i) => (
              <Button
                key={i}
                disabled={isPenalty}
                onClick={() => handleAnswer(beads[0].id, opt.id === beads[0].word.id)}
                className={cn(
                  "h-20 text-2xl font-bold rounded-[28px] transition-all duration-300 border-none shadow-xl",
                  !isPenalty && "bg-white/10 text-white backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:scale-[1.02] active:scale-95 cursor-pointer",
                  isPenalty && "opacity-20 grayscale cursor-not-allowed"
                )}
                dir="rtl"
              >
                {opt.hebrew}
              </Button>
            ))}
          </div>
        )}
        {isPenalty && (
          <div className="text-center mt-6 animate-pulse">
            <span className="bg-rose-500/20 text-rose-400 px-6 py-2 rounded-full border border-rose-500/30 text-sm font-bold uppercase tracking-widest">
              Wait... 1s Penalty!
            </span>
          </div>
        )}
      </div>

      {/* Danger Zone Glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
}
