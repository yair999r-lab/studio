
"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight, 
  GraduationCap, 
  Trophy,
  MessageSquareText,
  CheckCircle2,
  XCircle
} from "lucide-react";
import vocabData from "@/app/lib/vocabulary.json";
import { cn } from "@/lib/utils";

type StoryPhase = "read" | "mcq" | "open" | "summary";

export function StoryMode({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<StoryPhase>("read");
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [currentOpenIndex, setCurrentOpenIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [mcqScore, setMcqScore] = useState(0);
  const [openResponses, setOpenResponses] = useState<Record<string, string>>({});

  // 1. Daily Time-Lock Logic to find the current story
  const selectedStory = useMemo(() => {
    const maxWeekId = Math.max(...vocabData.weeks.map(w => w.week_id));
    const currentWeek = vocabData.weeks.find(w => w.week_id === maxWeekId);
    if (!currentWeek) return null;

    const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    
    let story;
    if (today <= 3) {
      // Sun-Wed: Match today's day
      story = currentWeek.stories.find(s => s.day === today);
    } else {
      // Thu-Sat: Match weekly type
      story = currentWeek.stories.find(s => s.type === "weekly");
    }

    // Fallback to the first available story if logic finds nothing
    return story || currentWeek.stories[0];
  }, []);

  // 2. Vocabulary Mapping for Highlighting
  const vocabMap = useMemo(() => {
    const map = new Map<string, string>();
    vocabData.weeks.forEach(week => {
      week.words.forEach(word => {
        map.set(word.english.toLowerCase(), word.hebrew);
      });
    });
    return map;
  }, []);

  const highlightText = (text: string) => {
    if (!text) return "";
    const words = text.split(/(\s+)/);
    return words.map((part, i) => {
      const cleanWord = part.toLowerCase().replace(/[.,!?;:()"]/g, "").trim();
      const translation = vocabMap.get(cleanWord);

      if (translation) {
        return (
          <TooltipProvider key={i}>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span className="font-bold text-primary underline decoration-primary/30 decoration-2 underline-offset-4 cursor-help bg-primary/5 px-0.5 rounded transition-all hover:scale-110">
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

  const handleMcqAnswer = (idx: number, isCorrect: boolean) => {
    if (isAnswering) return;
    setSelectedAnswer(idx);
    setIsAnswering(true);
    
    if (isCorrect) setMcqScore(s => s + 1);

    setTimeout(() => {
      setIsAnswering(false);
      setSelectedAnswer(null);
      if (currentMcqIndex + 1 < selectedStory.mcq_questions.length) {
        setCurrentMcqIndex(i => i + 1);
      } else if (selectedStory.open_questions?.length > 0) {
        setPhase("open");
      } else {
        setPhase("summary");
      }
    }, 1500);
  };

  const handleNextOpen = () => {
    if (currentOpenIndex + 1 < selectedStory.open_questions.length) {
      setCurrentOpenIndex(i => i + 1);
    } else {
      setPhase("summary");
    }
  };

  if (!selectedStory) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">No story available for today.</p>
      </div>
    );
  }

  // Phase 1: Reading
  if (phase === "read") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl h-12 w-12 bg-white/80 shadow-md hover:scale-110 active:scale-95 transition-all">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Button>
            <h1 className="text-3xl font-headline font-bold text-slate-800">{selectedStory.title}</h1>
          </header>

          <Card className="p-12 rounded-[40px] border border-white/50 shadow-2xl bg-white/95 backdrop-blur-md mb-12">
            <div className="prose prose-slate max-w-none">
              <p className="text-xl leading-relaxed text-slate-700 font-medium tracking-tight whitespace-pre-wrap">
                {highlightText(selectedStory.content)}
              </p>
            </div>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={() => setPhase("mcq")} 
              className="chunky-button chunky-primary px-16 py-8 text-xl shadow-lg"
            >
              START QUESTIONS <ChevronRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase 2: MCQ
  if (phase === "mcq") {
    const q = selectedStory.mcq_questions[currentMcqIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <header className="mb-12">
            <div className="flex justify-between items-end mb-4">
               <span className="text-blue-700 font-bold drop-shadow-sm">Comprehension: {currentMcqIndex + 1} / {selectedStory.mcq_questions.length}</span>
               <GraduationCap className="text-blue-400 w-8 h-8" />
            </div>
            <Progress value={((currentMcqIndex + 1) / selectedStory.mcq_questions.length) * 100} className="h-4 bg-white/50 border-none shadow-inner" />
          </header>

          <Card className="p-12 rounded-[40px] border border-white/50 shadow-2xl bg-white/95 backdrop-blur-md text-center">
            <h2 className="text-3xl font-headline font-bold text-slate-800 mb-12 leading-tight px-4">
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
                    onClick={() => handleMcqAnswer(i, isCorrect)}
                    className={cn(
                      "chunky-button text-xl py-6 px-8 transition-all duration-300 shadow-md border-2",
                      !isAnswering && "bg-slate-50 text-slate-700 border-slate-200 hover:scale-105 active:scale-95 cursor-pointer",
                      isAnswering && isCorrect && "bg-emerald-500 text-white border-emerald-600 scale-105",
                      isAnswering && isSelected && !isCorrect && "bg-rose-500 text-white border-rose-600 animate-shake",
                      isAnswering && !isSelected && !isCorrect && "opacity-40 grayscale-[0.5]"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{opt}</span>
                      {isAnswering && isCorrect && <CheckCircle2 className="w-6 h-6" />}
                      {isAnswering && isSelected && !isCorrect && <XCircle className="w-6 h-6" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Phase 3: Open Questions
  if (phase === "open") {
    const q = selectedStory.open_questions[currentOpenIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <header className="mb-12">
            <div className="flex justify-between items-end mb-4">
               <span className="text-indigo-700 font-bold drop-shadow-sm">Reflection: {currentOpenIndex + 1} / {selectedStory.open_questions.length}</span>
               <MessageSquareText className="text-indigo-400 w-8 h-8" />
            </div>
            <Progress value={((currentOpenIndex + 1) / selectedStory.open_questions.length) * 100} className="h-4 bg-white/50 border-none shadow-inner" />
          </header>

          <Card className="p-12 rounded-[40px] border border-white/50 shadow-2xl bg-white/95 backdrop-blur-md">
            <div className="text-center mb-8">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Your Thoughts</span>
               <h2 className="text-2xl font-headline font-bold text-slate-800 leading-tight">
                 {q.question}
               </h2>
            </div>

            <Textarea 
              value={openResponses[q.id] || ""}
              onChange={(e) => setOpenResponses(prev => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Type your answer here..."
              className="min-h-[200px] rounded-[32px] p-8 text-lg bg-slate-50 border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
            />

            <div className="mt-12 flex justify-center">
              <Button 
                onClick={handleNextOpen}
                disabled={!openResponses[q.id]?.trim()}
                className="chunky-button chunky-primary px-16 py-8 text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentOpenIndex + 1 < selectedStory.open_questions.length ? "NEXT QUESTION" : "FINISH STORY"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Phase: Summary
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-8">
      <Card className="max-w-xl w-full p-12 rounded-[48px] border border-white/50 shadow-2xl bg-white/95 backdrop-blur-md text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Trophy className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Story Completed!</h1>
        <p className="text-slate-500 text-lg mb-10">You've successfully mastered today's reading challenge.</p>
        
        <div className="bg-blue-50 p-8 rounded-[32px] mb-10 border border-blue-100">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1">Comprehension Score</p>
          <p className="text-5xl font-bold text-blue-700">{mcqScore} / {selectedStory.mcq_questions.length}</p>
        </div>

        <Button 
          onClick={onBack} 
          className="w-full chunky-button chunky-primary py-8 text-xl shadow-md transition-all hover:scale-105 active:scale-95"
        >
          BACK TO STUDY ROOM
        </Button>
      </Card>
    </div>
  );
}
