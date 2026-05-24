
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Zap, Skull } from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import vocabData from "@/app/lib/vocabulary.json";
import { cn, shuffleArray } from "@/lib/utils";

type GameState = "ready" | "playing" | "gameover";

const BEAD_DIAMETER = 88; 
const BASE_SPEED = 0.5; 
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
    const initialChain = Array.from({ length: 15 }, () => addWordToChain());
    setWordChain(initialChain);
    setScore(0);
    setLives(2);
    setHeadDistance(0);
    setGameState("playing");
  };

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [gameState]);

  const animate = useCallback(() => {
    if (gameState !== "playing") return;

    setHeadDistance(prev => {
      const speedMultiplier = 1 + Math.floor(score / 5) * 0.15;
      const nextDistance = prev + BASE_SPEED * speedMultiplier;

      if (pathLength > 0 && nextDistance >= pathLength) {
        if (lives > 1) {
          setLives(l => l - 1);
          setFlashRed(true);
          setTimeout(() => setFlashRed(false), 300);
          setWordChain(Array.from({ length: 15 }, () => addWordToChain()));
          return 0; 
        } else {
          setLives(0);
          setGameState("gameover");
          return nextDistance;
        }
      }

      return nextDistance;
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, score, pathLength, addWordToChain, lives]);

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
        next.shift();
        next.push(addWordToChain());
        return next;
      });
      
      setScore(s => {
        onScore(1);
        return s + 1;
      });
    } else {
      setIsPenalty(true);
      setTimeout(() => setIsPenalty(false), 1000);
    }
  };

  const getPoint = (distance: number) => {
    if (!pathRef.current) return { x: -100, y: -100 };
    try {
        return pathRef.current.getPointAtLength(Math.max(0, distance));
    } catch (e) {
        return { x: -100, y: -100 };
    }
  };

  if (!isReady) return null;

  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-headline relative">
        <Card className="max-w-xl w-full bg-indigo-950/20 backdrop-blur-xl border-white/10 rounded-[40px] p-12 text-center relative z-10 shadow-2xl">
          <div className="w-24 h-24 bg-primary rounded-[32px] mx-auto mb-8 flex items-center justify-center shadow-lg transform rotate-12">
            <Zap className="text-white w-12 h-12 fill-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 uppercase tracking-tight">Word Defense</h1>
          <p className="text-slate-400 mb-12 text-lg leading-relaxed">
            Protect the portal from the lexical chain. <br/> Identify the leader to break the cycle.
          </p>
          <div className="space-y-4">
            <Button onClick={startGame} className="w-full chunky-button chunky-primary h-20 text-2xl rounded-3xl">
              START GAME
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-500 font-bold hover:text-white">
              Lobby
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-headline">
        <Card className="max-w-xl w-full bg-indigo-950/20 backdrop-blur-xl border-white/10 rounded-[48px] p-12 text-center shadow-2xl">
          <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Skull className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-10">Defense Failed</h1>
          <div className="bg-white/5 p-12 rounded-[40px] mb-12 border border-white/5 shadow-inner">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Final Score</p>
            <p className="text-8xl font-bold text-indigo-400 tracking-tighter">{score}</p>
          </div>
          <div className="space-y-4">
            <Button onClick={startGame} className="w-full chunky-button chunky-primary h-16 text-xl">
              TRY AGAIN
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-500 font-bold hover:text-white">
              Exit
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 flex flex-col bg-slate-900 overflow-hidden font-headline transition-colors duration-300",
      flashRed && "bg-rose-950/50"
    )}>
      <div className="flex-1 w-full min-h-[70vh] relative flex items-center justify-center overflow-hidden">
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
            <div className="bg-indigo-600 text-white px-8 py-3 rounded-2xl shadow-xl font-bold text-3xl border-b-4 border-indigo-800">
              {score}
            </div>
          </div>
        </div>

        <svg 
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet" 
          className="w-full h-full absolute inset-0 z-0"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <path 
            ref={pathRef}
            d="M -50, 150 L 700, 150 Q 900, 150 900, 300 Q 900, 450 700, 450 L 150, 450" 
            fill="none" 
            stroke="#1e1b4b" 
            strokeWidth="100" 
            strokeLinecap="round" 
          />
          <path 
            d="M -50, 150 L 700, 150 Q 900, 150 900, 300 Q 900, 450 700, 450 L 150, 450" 
            fill="none" 
            stroke="#8b5cf6" 
            strokeWidth="6" 
            strokeLinecap="round" 
            className="opacity-40"
          />
          
          <g className="beads-group">
            {wordChain.map((bead, index) => {
              const distance = headDistance - (index * BEAD_DIAMETER);
              if (distance < -50 || (pathLength > 0 && distance > pathLength + 50)) return null;
              
              const point = getPoint(distance);
              const isLeader = index === 0;

              return (
                <g 
                  key={bead.instanceId} 
                  transform={`translate(${point.x}, ${point.y})`}
                  className="transition-opacity duration-300"
                  style={{ opacity: distance < 0 ? 0 : 1 }}
                >
                  <circle 
                    r="44" 
                    fill={isLeader ? "#4f46e5" : "#1e293b"} 
                    stroke={isLeader ? "white" : "#4338ca"} 
                    strokeWidth={isLeader ? "6" : "2"}
                    filter={isLeader ? "url(#glow)" : undefined}
                    className={cn(isLeader && "animate-pulse")}
                  />
                  <foreignObject x="-44" y="-44" width="88" height="88">
                    <div className="w-full h-full flex items-center justify-center p-2 text-center text-white">
                      <span className="text-sm font-bold leading-tight break-words uppercase pointer-events-none select-none">
                        {bead.english}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </g>

          <g transform="translate(150, 450)">
            <circle r="55" fill="#020617" />
            <circle r="44" fill="none" stroke="#4338ca" strokeWidth="2" strokeDasharray="5,5" className="animate-spin" style={{ animationDuration: '10s' }} />
          </g>
        </svg>
      </div>

      <div className="shrink-0 py-6 px-4 bg-slate-950 border-t border-white/5 flex flex-col justify-center items-center z-50 h-[30vh] overflow-hidden">
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
                    !isPenalty && "bg-white/5 text-white hover:bg-indigo-600 hover:scale-[1.02] active:scale-95",
                    isPenalty && "opacity-20 grayscale cursor-not-allowed"
                  )}
                  dir="rtl"
                >
                  {opt.hebrew}
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <span className="text-indigo-400 font-bold uppercase tracking-widest animate-pulse">
                Establishing Nexus...
              </span>
            </div>
          )}
          
          <div className="h-10 flex items-center justify-center mt-4">
            {isPenalty && (
              <span className="text-rose-400 text-sm font-bold uppercase tracking-widest animate-pulse">
                SYSTEM PENALTY ACTIVE
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
