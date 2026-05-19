"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Heart, Zap, Trophy } from "lucide-react";
import vocabData from "@/app/lib/vocabulary.json";
import { cn, shuffleArray } from "@/lib/utils";

type ActiveBubble = {
  id: string;
  wordId: string;
  english: string;
  hebrew: string;
  x: number;
  color: string;
  duration: number;
};

export function ArcadeMode({ 
  onBack, 
  onScore 
}: { 
  onBack: () => void; 
  onScore: (amount: number) => void;
}) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([3]); // Default Week 3
  const [hearts, setHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [bubbles, setBubbles] = useState<ActiveBubble[]>([]);
  const [level, setLevel] = useState(1);
  const [spawnedCount, setSpawnedCount] = useState(0);
  const [clearedCount, setClearedCount] = useState(0);
  const [missedWords, setMissedWords] = useState<any[]>([]);
  const [wordPool, setWordPool] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const colors = ["bg-sky-500", "bg-indigo-500", "bg-purple-500", "bg-rose-500"];

  // Initialize Word Pool with selection and Fisher-Yates
  const initGame = () => {
    const pool = vocabData.weeks
      .filter(w => selectedWeeks.includes(w.week_id))
      .flatMap(w => w.words);
    
    if (pool.length === 0) return;
    setWordPool(shuffleArray(pool));
    setGameState("playing");
    setHearts(5);
    setScore(0);
    setBubbles([]);
    setLevel(1);
    setMissedWords([]);
    setSpawnedCount(0);
    setClearedCount(0);
  };

  const spawnOneBubble = useCallback(() => {
    if (gameState !== "playing" || spawnedCount >= 10 || wordPool.length === 0) return;

    // Pick a word from the shuffled pool
    const word = wordPool[spawnedCount % wordPool.length];
    const x = 10 + Math.random() * 80;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Slow start: 13s, gradually speeds up
    const duration = Math.max(5, 13 - (level - 1) * 1.5);

    const newBubble: ActiveBubble = {
      id: Math.random().toString(36).substring(2, 9),
      wordId: word.id,
      english: word.english,
      hebrew: word.hebrew,
      x,
      color,
      duration
    };

    setBubbles(prev => [...prev, newBubble]);
    setSpawnedCount(s => s + 1);
  }, [gameState, spawnedCount, level, wordPool]);

  useEffect(() => {
    if (gameState === "playing" && spawnedCount < 10) {
      const timer = setTimeout(spawnOneBubble, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, spawnedCount, spawnOneBubble]);

  useEffect(() => {
    if (clearedCount >= 10 && gameState === "playing") {
      setLevel(l => l + 1);
      setSpawnedCount(0);
      setClearedCount(0);
      setBubbles([]);
      // Reshuffle pool for next wave
      setWordPool(shuffleArray(wordPool));
    }
  }, [clearedCount, gameState, wordPool]);

  useEffect(() => {
    if (hearts <= 0 && gameState === "playing") {
      setGameState("gameover");
    }
  }, [hearts, gameState]);

  const handleMiss = (id: string) => {
    setBubbles(prev => {
      const missed = prev.find(b => b.id === id);
      if (missed) {
        setHearts(h => Math.max(0, h - 1));
        setMissedWords(m => [...m, missed]);
        setClearedCount(c => c + 1);
      }
      return prev.filter(b => b.id !== id);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = userInput.trim().toLowerCase();
    if (!cleanInput) return;

    const targetIndex = bubbles.findIndex(b => b.hebrew === cleanInput || b.hebrew === userInput.trim());
    
    if (targetIndex !== -1) {
      const target = bubbles[targetIndex];
      setBubbles(prev => prev.filter(b => b.id !== target.id));
      setScore(s => s + 1);
      onScore(1);
      setClearedCount(c => c + 1);
      setUserInput("");
    } else {
      setUserInput("");
    }
  };

  const toggleWeek = (id: number) => {
    setSelectedWeeks(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-[40px] p-10 shadow-2xl text-center border-b-8 border-slate-100">
          <div className="w-20 h-20 bg-sky-500 rounded-[28px] mx-auto mb-6 flex items-center justify-center border-4 border-white shadow-xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-slate-800 mb-2">Arcade Mode</h1>
          <p className="text-slate-500 mb-8 text-sm">Select weeks and type Hebrew to pop falling words.</p>
          
          <div className="bg-slate-50 p-6 rounded-3xl mb-8 border-2 border-slate-100 text-left">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Choose Practice Weeks</p>
            <div className="space-y-3">
              {vocabData.weeks.map(w => (
                <div key={w.week_id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white rounded-xl transition-colors" onClick={() => toggleWeek(w.week_id)}>
                  <Checkbox checked={selectedWeeks.includes(w.week_id)} />
                  <span className="font-bold text-slate-700">Week {w.week_id}: {w.title}</span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            disabled={selectedWeeks.length === 0}
            onClick={initGame} 
            className="w-full chunky-button chunky-primary text-xl py-8"
          >
            START GAME
          </Button>
          <Button variant="ghost" onClick={onBack} className="mt-4 text-slate-400 font-bold">Return to Lobby</Button>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-[40px] p-12 shadow-2xl border-t-8 border-rose-500 text-center">
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h1 className="text-4xl font-headline font-bold text-slate-800 mb-8">Game Over!</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-sky-50 p-6 rounded-[32px] border-2 border-sky-100">
              <p className="text-4xl font-bold text-sky-600 mb-1">{score}</p>
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest">Score</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-[32px] border-2 border-indigo-100">
              <p className="text-4xl font-bold text-indigo-600 mb-1">{level}</p>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Final Level</p>
            </div>
          </div>

          <div className="text-left mb-10">
            <h3 className="font-bold text-slate-700 mb-4">Words to remember:</h3>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-2xl border">
              {missedWords.length > 0 ? Array.from(new Set(missedWords.map(w => w.english))).map(en => (
                <span key={en} className="bg-white border px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                  {en}
                </span>
              )) : <p className="text-slate-400 italic">None! You popped them all.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <Button onClick={() => setGameState("ready")} className="w-full chunky-button chunky-primary py-8 text-xl">
              TRY AGAIN
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold">RETURN TO LOBBY</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-sky-400 overflow-hidden font-headline select-none">
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-30 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Button variant="ghost" onClick={onBack} className="bg-white/20 hover:bg-white/40 rounded-2xl text-white font-bold">
            <ArrowLeft className="w-5 h-5 mr-2" /> EXIT
          </Button>
          <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-2xl shadow-lg border-b-4 border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase">Lv</span>
              <span className="text-sky-600 font-bold text-xl">{level}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-[24px] shadow-lg border-b-4 border-slate-200 flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Heart key={i} className={cn("w-6 h-6", i < hearts ? "text-rose-500 fill-rose-500" : "text-slate-200")} />
            ))}
          </div>
          <div className="bg-amber-400 text-white px-8 py-2 rounded-2xl shadow-lg border-b-4 border-amber-600 font-bold text-2xl">
            {score}
          </div>
        </div>
      </div>

      <div className="bubble-container absolute inset-0 z-10 pointer-events-none">
        {bubbles.map(b => (
          <div 
            key={b.id}
            onAnimationEnd={() => handleMiss(b.id)}
            className={cn("bubble w-32 h-32", b.color)}
            style={{ 
              left: `${b.x}%`, 
              animationDuration: `${b.duration}s`,
              transform: `translateX(-50%)`
            }}
          >
            <span className="text-white text-xl font-bold text-center leading-tight drop-shadow-md">{b.english}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center bg-gradient-to-t from-sky-600/50 to-transparent z-20">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl relative">
          <Input 
            autoFocus
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type Hebrew..."
            className="h-20 text-3xl rounded-[32px] border-4 border-white bg-white/95 shadow-2xl pr-36 text-center text-slate-800 focus-visible:ring-0 font-bold"
            dir="rtl"
            onBlur={() => inputRef.current?.focus()}
          />
          <Button type="submit" className="absolute right-3 top-3 bottom-3 rounded-[24px] chunky-primary px-10 text-xl">POP!</Button>
        </form>
      </div>
    </div>
  );
}
