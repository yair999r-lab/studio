
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  ChevronRight, 
  GraduationCap, 
  Trophy,
  MessageSquareText,
  CheckCircle2,
  XCircle,
  Lock,
  Calendar
} from "lucide-react";
import vocabData from "@/app/lib/vocabulary.json";
import storyData from "@/app/lib/story.json";
import { cn } from "@/lib/utils";

type StoryPhase = "selector" | "read" | "vocab_qa" | "comp_qa" | "summary";

export function StoryMode({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<StoryPhase>("selector");
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [score, setScore] = useState(0);

  const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
  const days = [
    { id: 1, label: "Day 1", sub: "Sunday", dayOfWeek: 0 },
    { id: 2, label: "Day 2", sub: "Monday", dayOfWeek: 1 },
    { id: 3, label: "Day 3", sub: "Tuesday", dayOfWeek: 2 },
    { id: 4, label: "Day 4", sub: "Wednesday", dayOfWeek: 3 },
  ];

  const activeStory = useMemo(() => {
    if (!selectedDayId || !storyData?.stories) return null;
    return storyData.stories.find((s: any) => s.day_id === selectedDayId);
  }, [selectedDayId]);

  const vocabMap = useMemo(() => {
    const map = new Map<string, string>();
    const vocab: any = vocabData;
    if (!vocab?.weeks) return map;
    vocab.weeks.forEach((week: any) => {
      week.words?.forEach((word: any) => {
        map.set(word.english.toLowerCase(), word.hebrew);
      });
    });
    return map;
  }, []);

  const highlightText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((part, i) => {
      const cleanWord = part.toLowerCase().replace(/[.,!?;:()"]/g, "").trim();
      const translation = vocabMap.get(cleanWord);
      if (translation) {
        return (
          <TooltipProvider key={i}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="font-bold text-primary underline decoration-primary/30 decoration-2 underline-offset-4 cursor-help bg-primary/5 px-0.5 rounded transition-all">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-none p-3 rounded-xl shadow-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Translation</p>
                <p className="text-lg font-bold" dir="rtl">{translation}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return part;
    });
  };

  const handleAnswer = (idx: number, isCorrect: boolean) => {
    if (isAnswering) return;
    setSelectedAnswer(idx);
    setIsAnswering(true);
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      setIsAnswering(false);
      setSelectedAnswer(null);
      const questions = phase === "vocab_qa" ? activeStory.vocabulary_questions : activeStory.comprehension_questions;
      if (currentQIndex + 1 < questions.length) {
        setCurrentQIndex(i => i + 1);
      } else if (phase === "vocab_qa") {
        setPhase("comp_qa");
        setCurrentQIndex(0);
      } else {
        setPhase("summary");
      }
    }, 1200);
  };

  if (phase === "selector") {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl h-14 w-14 bg-white shadow-sm hover:scale-110 active:scale-95 transition-all">
              <ArrowLeft className="w-8 h-8 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-4xl font-headline font-bold text-slate-800">Story Room</h1>
              <p className="text-slate-500 font-medium">Daily Immersive Reading</p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {days.map((day) => {
              const isLocked = day.dayOfWeek > today;
              return (
                <Card 
                  key={day.id}
                  onClick={() => !isLocked && (setSelectedDayId(day.id), setPhase("read"))}
                  className={cn(
                    "relative group p-8 rounded-[40px] border-none shadow-xl transition-all duration-300",
                    !isLocked ? "cursor-pointer hover:scale-105 bg-white" : "bg-slate-100 opacity-80 cursor-not-allowed"
                  )}
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6">
                    {isLocked ? <Lock className="w-7 h-7 text-slate-300" /> : <Calendar className="w-7 h-7 text-primary" />}
                  </div>
                  <h3 className="text-2xl font-headline font-bold mb-1 text-slate-800">{day.label}</h3>
                  <p className="text-sm font-medium text-slate-400 mb-8">{day.sub}</p>
                  <Button disabled={isLocked} className="w-full chunky-button chunky-primary rounded-2xl h-12 text-xs">
                    {isLocked ? "LOCKED" : "READ NOW"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "read") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={() => setPhase("selector")} className="rounded-2xl h-12 w-12 bg-white/80 shadow-md">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Button>
            <h1 className="text-3xl font-headline font-bold text-slate-800">{activeStory?.title}</h1>
          </header>

          <Card className="p-12 rounded-[40px] border border-white/50 shadow-2xl bg-white/95 backdrop-blur-md mb-12">
            <div className="space-y-6">
              {activeStory?.paragraphs.map((para: string, i: number) => (
                <p key={i} className="text-xl leading-relaxed text-slate-700 font-medium tracking-tight">
                  {highlightText(para)}
                </p>
              ))}
            </div>
          </Card>

          <div className="flex justify-center">
            <Button onClick={() => setPhase("vocab_qa")} className="chunky-button chunky-primary px-16 py-8 text-xl">
              START VOCAB DRILL <ChevronRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestions = phase === "vocab_qa" ? activeStory?.vocabulary_questions : activeStory?.comprehension_questions;
  const q = currentQuestions?.[currentQIndex];

  if (phase === "vocab_qa" || phase === "comp_qa") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <header className="mb-12 text-center">
            <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2 block">
              {phase === "vocab_qa" ? "Vocabulary Context" : "Story Comprehension"}
            </span>
            <Progress value={((currentQIndex + 1) / currentQuestions.length) * 100} className="h-4 bg-white/50" />
          </header>

          <Card className="p-12 rounded-[40px] shadow-2xl bg-white/95">
            <h2 className="text-3xl font-headline font-bold text-slate-800 mb-12 text-center">
              {q.question}
            </h2>
            <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
              {q.options.map((opt: string, i: number) => {
                const isCorrect = i === q.correct_index;
                const isSelected = selectedAnswer === i;
                return (
                  <button
                    key={i}
                    disabled={isAnswering}
                    onClick={() => handleAnswer(i, isCorrect)}
                    className={cn(
                      "chunky-button text-xl py-6 px-8 transition-all border-2",
                      !isAnswering && "bg-slate-50 text-slate-700 border-slate-200",
                      isAnswering && isCorrect && "bg-emerald-500 text-white border-emerald-600 scale-105",
                      isAnswering && isSelected && !isCorrect && "bg-rose-500 text-white border-rose-600"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-8">
      <Card className="max-w-xl w-full p-12 rounded-[48px] text-center bg-white shadow-2xl">
        <Trophy className="w-24 h-24 text-emerald-600 mx-auto mb-8 animate-bounce" />
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Reading Complete!</h1>
        <p className="text-slate-500 text-lg mb-10">You've mastered today's story and its vocabulary.</p>
        <Button onClick={() => setPhase("selector")} className="w-full chunky-button chunky-primary h-16 text-xl">
          BACK TO SELECTOR
        </Button>
      </Card>
    </div>
  );
}
