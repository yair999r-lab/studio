
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, Zap, Trophy } from "lucide-react";
import vocabData from "@/app/lib/vocabulary.json";
import { cn } from "@/lib/utils";

type ActiveBubble = {
  id: string;
  wordId: string;
  english: string;
  hebrew: string;
  x: number;
  y: number;
  speed: number;
  color: string;
};

export function ArcadeMode({ 
  onBack, 
  onMistake, 
  onScore 
}: { 
  onBack: () => void; 
  onMistake: (word: any) => void;
  onScore: (amount: number) => void;
}) {
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [hearts, setHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [bubbles, setBubbles] = useState<ActiveBubble[]>([]);
  const [level, setLevel] = useState(1);
  const [missedWords, setMissedWords] = useState<any[]>([]);

  const requestRef = useRef<number>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = ["bg-sky-500", "bg-indigo-500", "bg-purple-500", "bg-rose-500"];
  const allWords = vocabData.weeks.flatMap(w => w.words);

  const spawnBubble = useCallback(() => {
    if (gameState !== "playing") return;

    const word = allWords[Math.floor(Math.random() * allWords.length)];
    const x = 10 + Math.random() * 80; // Keep within 10-90% horizontal range
    // Speed increases with level. Base speed is small because it updates every frame (~60fps)
    const speed = 0.05 + (level * 0.02);
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newBubble: ActiveBubble = {
      id: Math.random().toString(36).substring(2, 9),
      wordId: word.id,
      english: word.english,
      hebrew: word.hebrew,
      x,
      y: -10, // Start just above the top
      speed,
      color
    };

    setBubbles(prev => [...prev, newBubble]);

    // Spawning frequency also increases with level
    const nextSpawnDelay = Math.max(800, 3000 - (level * 200));
    spawnTimerRef.current = setTimeout(spawnBubble, nextSpawnDelay);
  }, [gameState, level, allWords]);

  const updateGame = useCallback(() => {
    if (gameState !== "playing") return;

    setBubbles(prev => {
      const nextBubbles: ActiveBubble[] = [];
      let heartsToDeduct = 0;
      const newlyMissed: any[] = [];

      for (const b of prev) {
        const nextY = b.y + b.speed;
        
        // Check if bubble hit the "floor" (bottom boundary)
        if (nextY >= 100) { 
          heartsToDeduct++;
          newlyMissed.push({ english: b.english, hebrew: b.hebrew, id: b.wordId });
          onMistake({ id: b.wordId, english: b.english, hebrew: b.hebrew, category: 'arcade' });
        } else {
          nextBubbles.push({ ...b, y: nextY });
        }
      }

      if (heartsToDeduct > 0) {
        setHearts(h => {
          const newHearts = Math.max(0, h - heartsToDeduct);
          return newHearts;
        });
        setMissedWords(m => [...m, ...newlyMissed]);
      }

      return nextBubbles;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  }, [gameState, onMistake]);

  useEffect(() => {
    if (gameState === "playing") {
      requestRef.current = requestAnimationFrame(updateGame);
      spawnBubble();
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, [gameState, updateGame, spawnBubble]);

  useEffect(() => {
    if (hearts <= 0 && gameState === "playing") {
      setGameState("gameover");
    }
  }, [hearts, gameState]);

  useEffect(() => {
    // Level up every 10 pops
    if (score > 0 && score % 10 === 0) {
      setLevel(l => Math.min(10, l + 1));
    }
  }, [score]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = userInput.trim().toLowerCase();
    if (!cleanInput) return;

    // Check if typed Hebrew matches any active bubble's translation
    const targetIndex = bubbles.findIndex(b => b.hebrew === cleanInput || b.hebrew === userInput.trim());
    
    if (targetIndex !== -1) {
      const poppedBubble = bubbles[targetIndex];
      setBubbles(prev => prev.filter(b => b.id !== poppedBubble.id));
      setScore(s => s + 1);
      onScore(1);
    }
    setUserInput("");
  };

  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-[48px] p-12 shadow-2xl text-center border-b-8 border-slate-100">
          <div className="w-32 h-32 bg-sky-500 rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-white shadow-xl">
            <Zap className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Arcade Mode</h1>
          <p className="text-slate-500 mb-10 text-lg">Type the Hebrew translation to pop falling bubbles. Don&apos;t let them reach the bottom!</p>
          <Button onClick={() => setGameState("playing")} className="w-full chunky-button chunky-primary text-xl py-8">
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
        <div className="max-w-2xl w-full bg-white rounded-[48px] p-12 shadow-2xl border-t-8 border-rose-500 text-center">
          <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-6" />
          <h1 className="text-4xl font-headline font-bold text-slate-800 mb-8">Game Over!</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-sky-50 p-6 rounded-[32px] border-2 border-sky-100">
              <p className="text-4xl font-bold text-sky-600 mb-1">{score}</p>
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest">Score</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-[32px] border-2 border-indigo-100">
              <p className="text-4xl font-bold text-indigo-600 mb-1">{level}</p>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Level</p>
            </div>
          </div>

          <div className="text-left mb-10">
            <h3 className="font-bold text-slate-700 mb-4">Practice these missed words:</h3>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-4 bg-slate-50 rounded-2xl border">
              {missedWords.length > 0 ? Array.from(new Set(missedWords.map(w => w.english))).map(en => (
                <span key={en} className="bg-white border px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                  {en}
                </span>
              )) : <p className="text-slate-400 italic">None! You popped them all.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <Button onClick={() => { setGameState("ready"); setHearts(5); setScore(0); setBubbles([]); setLevel(1); setMissedWords([]); }} className="w-full chunky-button chunky-primary py-8 text-xl">
              PLAY AGAIN
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold">RETURN TO LOBBY</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-sky-400 overflow-hidden font-headline select-none">
      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-start z-30">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="bg-white/20 hover:bg-white/40 rounded-2xl text-white">
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

      {/* Game Stage */}
      <div ref={containerRef} className="absolute inset-0 z-10">
        {bubbles.map(b => (
          <div 
            key={b.id}
            className={cn(
              "absolute w-32 h-32 rounded-full border-4 border-white/50 shadow-2xl flex items-center justify-center p-4",
              b.color
            )}
            style={{ 
              left: `${b.x}%`, 
              top: `${b.y}%`,
              transform: `translate(-50%, -50%)`,
              // Linear physics - no CSS transitions to avoid "bouncing" or lag
              transition: 'none' 
            }}
          >
            <span className="text-white text-xl font-bold text-center leading-tight drop-shadow-md">{b.english}</span>
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center bg-gradient-to-t from-sky-600/50 to-transparent z-20">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl relative">
          <Input 
            autoFocus
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type Hebrew..."
            className="h-20 text-3xl rounded-[32px] border-4 border-white bg-white/95 shadow-2xl pr-36 text-center text-slate-800 focus-visible:ring-0"
            dir="rtl"
          />
          <Button type="submit" className="absolute right-3 top-3 bottom-3 rounded-[24px] chunky-primary px-10 text-xl">POP!</Button>
        </form>
      </div>
    </div>
  );
}
