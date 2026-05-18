
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, Ghost, Zap } from "lucide-react";
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
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover" | "paused">("ready");
  const [hearts, setHearts] = useState(5);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [bubbles, setBubbles] = useState<ActiveBubble[]>([]);
  const [level, setLevel] = useState(1);
  const [missedWords, setMissedWords] = useState<any[]>([]);
  const [secondChanceUsed, setSecondChanceUsed] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const requestRef = useRef<number>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const colors = ["bg-sky-400", "bg-indigo-400", "bg-purple-400", "bg-blue-400"];
  const allWords = vocabData.weeks.flatMap(w => w.words);

  const spawnBubble = useCallback(() => {
    if (gameState !== "playing") return;

    const word = allWords[Math.floor(Math.random() * allWords.length)];
    const x = Math.random() * 80 + 10; // 10% to 90%
    const speed = 0.5 + (level * 0.2);
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newBubble: ActiveBubble = {
      id: Math.random().toString(36).substr(2, 9),
      wordId: word.id,
      english: word.english,
      hebrew: word.hebrew,
      x,
      y: -10,
      speed,
      color
    };

    setBubbles(prev => [...prev, newBubble]);

    // Dynamic spawn rate
    const interval = Math.max(1000, 3000 - (level * 200));
    spawnTimerRef.current = setTimeout(spawnBubble, interval);
  }, [gameState, level]);

  const updateGame = useCallback(() => {
    if (gameState !== "playing") return;

    setBubbles(prev => {
      const nextBubbles: ActiveBubble[] = [];
      let heartsLost = 0;
      const missed: any[] = [];

      for (const b of prev) {
        const nextY = b.y + b.speed;
        if (nextY > 95) { // Hit floor
          heartsLost++;
          missed.push({ english: b.english, hebrew: b.hebrew, id: b.wordId });
          onMistake({ id: b.wordId, english: b.english, hebrew: b.hebrew });
        } else {
          nextBubbles.push({ ...b, y: nextY });
        }
      }

      if (heartsLost > 0) {
        setHearts(h => Math.max(0, h - heartsLost));
        setCombo(0);
        setMissedWords(m => [...m, ...missed]);
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

  // Handle Score Bumps
  useEffect(() => {
    const totalWords = score;
    if (totalWords > 0 && totalWords % 10 === 0) {
      setLevel(l => l + 1);
      setAlert(totalWords % 20 === 0 ? "INCOMING!" : "SPEED UP!");
      setTimeout(() => setAlert(null), 2000);
    }
  }, [score]);

  // Handle Combo Heart Regen
  useEffect(() => {
    if (combo > 0 && combo % 5 === 0) {
      setHearts(h => Math.min(10, h + 1));
    }
    if (combo > maxCombo) setMaxCombo(combo);
  }, [combo, maxCombo]);

  // Handle Second Chance
  useEffect(() => {
    if (hearts === 0 && gameState === "playing") {
      if (!secondChanceUsed) {
        setGameState("paused");
        setSecondChanceUsed(true);
        setBubbles([]);
      } else {
        setGameState("gameover");
      }
    }
  }, [hearts, gameState, secondChanceUsed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const targetIdx = bubbles.findIndex(b => b.hebrew === userInput.trim());
    if (targetIdx !== -1) {
      const bubble = bubbles[targetIdx];
      setBubbles(prev => prev.filter(b => b.id !== bubble.id));
      setScore(s => s + 1);
      onScore(1);
      setCombo(c => c + 1);
      // Play pop effect could go here
    } else {
      setCombo(0);
    }
    setUserInput("");
  };

  if (gameState === "ready") {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white rounded-[48px] p-12 shadow-2xl text-center border-b-8 border-sky-100">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-sky-400 rounded-full animate-ping opacity-20"></div>
            <div className="relative bg-sky-500 rounded-full w-full h-full flex items-center justify-center border-4 border-white shadow-lg">
              <Zap className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Arcade Mode</h1>
          <p className="text-slate-500 mb-10 text-lg">Type the Hebrew translation of the falling bubbles to pop them. Don&apos;t let them hit the ground!</p>
          <Button onClick={() => setGameState("playing")} className="w-full chunky-button chunky-primary text-xl py-8">
            START GAME
          </Button>
          <Button variant="ghost" onClick={onBack} className="mt-4 text-slate-400">Return to Lobby</Button>
        </div>
      </div>
    );
  }

  if (gameState === "paused") {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl max-w-md text-center border-b-8 border-primary">
          <Ghost className="w-20 h-20 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-headline font-bold mb-4">Second Chance!</h2>
          <p className="text-slate-500 mb-10 text-lg">Hearts reset to 5. Keep going, you can do this!</p>
          <Button onClick={() => { setHearts(5); setGameState("playing"); }} className="w-full chunky-button chunky-primary py-8 text-xl">
            RESUME
          </Button>
        </div>
      </div>
    );
  }

  if (gameState === "gameover") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-[48px] p-12 shadow-2xl border-t-8 border-orange-500 text-center">
          <h1 className="text-4xl font-headline font-bold text-slate-800 mb-8">Game Over!</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-sky-50 p-6 rounded-[32px] border-2 border-sky-100">
              <p className="text-4xl font-bold text-sky-600 mb-1">{score}</p>
              <p className="text-xs font-bold text-sky-400 uppercase tracking-widest">Total Pop</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-[32px] border-2 border-indigo-100">
              <p className="text-4xl font-bold text-indigo-600 mb-1">{maxCombo}</p>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Max Combo</p>
            </div>
          </div>

          <div className="text-left mb-10">
            <h3 className="font-bold text-slate-700 mb-4 border-b pb-2">Words you missed:</h3>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl">
              {missedWords.length > 0 ? Array.from(new Set(missedWords.map(w => w.english))).map(en => (
                <span key={en} className="bg-white border px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                  {en}
                </span>
              )) : <p className="text-slate-400 italic">None! Perfectly done.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <Button onClick={() => { setGameState("ready"); setHearts(5); setScore(0); setCombo(0); setMissedWords([]); setSecondChanceUsed(false); setLevel(1); }} className="w-full chunky-button chunky-primary py-8 text-xl">
              PLAY AGAIN
            </Button>
            <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold">RETURN TO LOBBY</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-400 relative overflow-hidden font-headline">
      {/* HUD */}
      <div className="absolute top-0 inset-x-0 p-8 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={onBack} className="pointer-events-auto bg-white/20 hover:bg-white/40 rounded-2xl text-white">
            <ArrowLeft className="w-6 h-6 mr-2" /> EXIT
          </Button>
          <div className="bg-white/90 backdrop-blur px-6 py-2 rounded-2xl shadow-lg border-b-4 border-white">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Level</span>
              <span className="text-sky-600 font-bold text-xl">{level}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-[24px] shadow-lg border-b-4 border-white flex gap-2">
            {[...Array(10)].map((_, i) => (
              <Heart key={i} className={cn("w-6 h-6", i < hearts ? "text-rose-500 fill-rose-500" : "text-slate-200")} />
            ))}
          </div>
          <div className="flex gap-4">
             <div className="bg-amber-400 text-white px-6 py-2 rounded-2xl shadow-lg border-b-4 border-amber-600 font-bold text-xl">
              {score}
            </div>
            {combo > 1 && (
              <div className="bg-emerald-400 text-white px-6 py-2 rounded-2xl shadow-lg border-b-4 border-emerald-600 font-bold text-xl animate-bounce">
                x{combo} COMBO
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level Alerts */}
      {alert && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <h1 className="text-8xl font-black text-white italic drop-shadow-2xl animate-pulse uppercase">
            {alert}
          </h1>
        </div>
      )}

      {/* Game Stage */}
      <div ref={gameContainerRef} className="w-full h-full absolute inset-0 pt-32">
        {bubbles.map(b => (
          <div 
            key={b.id}
            className={cn(
              "absolute w-32 h-32 rounded-full border-4 border-white/40 shadow-xl flex flex-col items-center justify-center p-4 transition-all duration-300 bubble-float",
              b.color
            )}
            style={{ 
              left: `${b.x}%`, 
              top: `${b.y}%`,
              transform: `translate(-50%, -50%)`
            }}
          >
            <span className="text-white text-xl font-bold text-center leading-tight">{b.english}</span>
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Input Stage */}
      <div className="absolute bottom-0 inset-x-0 p-12 flex justify-center bg-gradient-to-t from-sky-500 to-transparent">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl relative">
          <Input 
            autoFocus
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Translate any word on screen..."
            className="h-20 text-3xl rounded-[32px] border-4 border-white bg-white/90 shadow-2xl pr-32 text-center text-slate-800"
            dir="rtl"
          />
          <Button type="submit" className="absolute right-3 top-3 bottom-3 rounded-[24px] chunky-primary px-8">POP!</Button>
        </form>
      </div>
    </div>
  );
}
