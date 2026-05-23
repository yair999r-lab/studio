
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
  CheckCircle, 
  ChevronRight, 
  HelpCircle, 
  GraduationCap, 
  Trophy,
  MessageSquareText
} from "lucide-react";
import vocabData from "@/app/lib/vocabulary.json";
import { cn, shuffleArray } from "@/lib/utils";

type StoryPhase = "selection" | "read" | "mcq" | "open" | "summary";

export function StoryMode({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<StoryPhase>("selection");
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [currentMcqIndex, setCurrentMcqIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [mcqScore, setMcqScore] = useState(0);
  const [openResponses, setOpenResponses] = useState<Record<string, string>>({});

  // 1. Identify Current Active Week and Filter Logic
  const { currentStories, activeWeekTitle } = useMemo(() => {
    const maxWeekId = Math.max(...vocabData.weeks.map(w => w.week_id));
    const currentWeek = vocabData.weeks.find(w => w.week_id === maxWeekId);
    const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    
    if (!currentWeek) return { currentStories: [], activeWeekTitle: "" };

    // Find stories for today or the weekly story
    // Sun-Wed (0-3): Daily match
    // Thu-Sat (4-6): Weekly type
    const availableStories = currentWeek.stories.filter(s => {
      if (today <= 3) return s.day === today || s.type === "daily";
      return s.type === "weekly" || s.day >= 4;
    });

    return { 
      currentStories: availableStories, 
      activeWeekTitle: `Week ${maxWeekId}: ${currentWeek.title}` 
    };
  }, []);

  // 2. Word Map for Highlighting
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

  // Automatically select story if only one exists for today
  useEffect(() => {
    if (phase === "selection" && currentStories.length === 1) {
      setSelectedStory(currentStories[0]);
      setPhase("read");
    }
  }, [phase, currentStories]);

  const handleAnswer = (idx: number, isCorrect: boolean) => {
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

  const handleOpenResponse = (id: string, text: string) => {
    setOpenResponses(prev => ({ ...prev, [id]: text }));
  };

  // Phase: Selection
  if (phase === "selection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl h-14 w-14 bg-white/80 shadow-md hover:scale-110 active:scale-95 transition-all">
              <ArrowLeft className="w-8 h-8 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-4xl font-headline font-bold text-slate-800">Story Room</h1>
              <p className="text-slate-500 font-medium">{activeWeekTitle}</p>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentStories.length > 0 ? currentStories.map((story: any) => (
              <Card 
                key={story.id} 
                className="p-8 rounded-[32px] border-none shadow-xl bg-white/95 backdrop-blur-md hover:scale-105 transition-all cursor-pointer group"
                onClick={() => { setSelectedStory(story); setPhase("read"); }}
              >
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <BookOpen className="w-7 h-7 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-headline font-bold text-slate-800 mb-2">{story.title}</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{story.type} Practice</p>
              </Card>
            )) : (
              <Card className="col-span-full p-12 text-center rounded-[32px] bg-white/50 border-none shadow-inner">
                <p className="text-slate-500 text-xl font-medium">No stories available for this time chunk yet.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Phase: Reading
  if (phase === "read") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={() => setPhase("selection")} className="rounded-2xl h-12 w-12 bg-white/80 shadow-md hover:scale-110 active:scale-95 transition-all">
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </Button>
            <h1 className="text-3xl font-headline font-bold text-slate-800">{selectedStory.title}</h1>
          </header>

          <Card className="p-12 rounded-[40px] border-none shadow-2xl bg-white/95 backdrop-blur-md mb-12">
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
              START COMPREHENSION <ChevronRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: MCQ
  if (phase === "mcq") {
    const q = selectedStory.mcq_questions[currentMcqIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <header className="mb-12">
            <div className="flex justify-between items-end mb-4">
               <span className="text-blue-600 font-bold">Comprehension: {currentMcqIndex + 1} / {selectedStory.mcq_questions.length}</span>
               <GraduationCap className="text-blue-300 w-8 h-8" />
            </div>
            <Progress value={((currentMcqIndex + 1) / selectedStory.mcq_questions.length) * 100} className="h-4 bg-white/50 border-none" />
          </header>

          <Card className="p-12 rounded-[40px] border-none shadow-2xl bg-white/95 backdrop-blur-md text-center">
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
                    onClick={() => handleAnswer(i, isCorrect)}
                    className={cn(
                      "chunky-button text-xl py-6 px-8 transition-all duration-300 shadow-md border-2",
                      !isAnswering && "bg-slate-50 text-slate-700 border-slate-100 hover:scale-105 active:scale-95 cursor-pointer",
                      isAnswering && isCorrect && "bg-emerald-500 text-white border-emerald-600 scale-105",
                      isAnswering && isSelected && !isCorrect && "bg-rose-500 text-white border-rose-600 animate-shake",
                      isAnswering && !isSelected && !isCorrect && "opacity-40 grayscale-[0.5]"
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

  // Phase: Open Questions
  if (phase === "open") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-3xl w-full">
          <header className="text-center mb-12">
            <MessageSquareText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h1 className="text-3xl font-headline font-bold text-slate-800">Final Reflections</h1>
            <p className="text-slate-500 font-medium">Think about the story and type your answers below.</p>
          </header>

          <div className="space-y-8 mb-12">
            {selectedStory.open_questions.map((q: any, i: number) => (
              <Card key={q.id} className="p-8 rounded-[32px] border-none shadow-xl bg-white/95 backdrop-blur-md">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex gap-3">
                  <span className="text-blue-300">Q{i+1}.</span>
                  {q.question}
                </h3>
                <Textarea 
                  value={openResponses[q.id] || ""}
                  onChange={(e) => handleOpenResponse(q.id, e.target.value)}
                  placeholder="Type your thoughts here..."
                  className="min-h-[140px] rounded-[24px] p-6 text-lg bg-slate-50 border-slate-100 focus:border-blue-500 transition-all resize-none shadow-inner"
                />
              </Card>
            ))}
          </div>

          <div className="flex justify-center pb-20">
            <Button 
              onClick={() => setPhase("summary")} 
              className="chunky-button chunky-primary px-16 py-8 text-xl shadow-lg"
            >
              FINISH STORY <Trophy className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Phase: Summary
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-8">
      <Card className="max-w-xl w-full p-12 rounded-[48px] border-none shadow-2xl bg-white/95 backdrop-blur-md text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Trophy className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Story Complete!</h1>
        <p className="text-slate-500 text-lg mb-10">You've successfully mastered today's reading challenge.</p>
        
        <div className="bg-blue-50 p-8 rounded-[32px] mb-10">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-1">Quiz Score</p>
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
