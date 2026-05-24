
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, Lock, Calendar } from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import { cn, shuffleArray } from "@/lib/utils";
import type { Mistake } from "@/hooks/use-game-state";

type Question = {
  type: "choice" | "sentence_choice";
  level: 1 | 2 | 3;
  text: string;
  hint?: string;
  options: any[];
  answer: string;
  wordId?: string;
};

export function TrainingGround({ 
  onBack, 
  onCorrect, 
  onWrong,
  mistakePool
}: { 
  onBack: () => void;
  onCorrect: (wordId: string) => void;
  onWrong: (word: any) => void;
  mistakePool?: Mistake[]; 
}) {
  const { filteredVocab, isReady } = useStudyLogic();
  const [phase, setPhase] = useState<"selector" | "active" | "summary">(!!mistakePool ? "active" : "selector");
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [results, setResults] = useState({ correct: 0, wrong: 0 });

  const today = new Date().getDay();
  const days = [
    { id: 1, label: "Day 1", sub: "Sunday", dayOfWeek: 0 },
    { id: 2, label: "Day 2", sub: "Monday", dayOfWeek: 1 },
    { id: 3, label: "Day 3", sub: "Tuesday", dayOfWeek: 2 },
    { id: 4, label: "Day 4", sub: "Wednesday", dayOfWeek: 3 },
  ];

  const startSession = (dayId: number) => {
    const vocab: any = filteredVocab;
    if (!vocab?.weeks?.[0]) return;
    const week = vocab.weeks[0];
    const dayWords = week.words.filter((w: any) => w.day === dayId);
    const daySentences = week.sentences.filter((s: any) => s.day === dayId);

    const generated: Question[] = [];

    // Level 1: Translation
    dayWords.forEach((word: any) => {
      const distractors = week.words.filter((w: any) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
      generated.push({
        type: "choice", level: 1, text: word.english, options: shuffleArray([...distractors, word]), answer: word.hebrew, wordId: word.id
      });
    });

    // Level 2: Fill in the Blanks
    daySentences.filter((s: any) => !s.id.startsWith('h')).forEach((s: any) => {
      generated.push({
        type: "sentence_choice", level: 2, text: s.text_with_blanks, hint: s.translation_hebrew, options: shuffleArray(s.answers), answer: s.answers.find((a: any) => a.is_correct)?.words.join(' ')
      });
    });

    // Level 3: Hebrew to English
    daySentences.filter((s: any) => s.id.startsWith('h')).forEach((s: any) => {
      generated.push({
        type: "sentence_choice", level: 3, text: s.text_with_blanks, options: shuffleArray(s.answers), answer: s.answers.find((a: any) => a.is_correct)?.words.join(' ')
      });
    });

    setQuestions(generated);
    setPhase("active");
    setCurrentIndex(0);
    setResults({ correct: 0, wrong: 0 });
  };

  useEffect(() => {
    if (mistakePool && isReady && questions.length === 0) {
      const generated = mistakePool.map(word => {
        const vocab: any = filteredVocab;
        const allWords = vocab.weeks?.[0]?.words || [];
        const distractors = allWords.filter((w: any) => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
        return {
          type: "choice" as const, level: 1 as const, text: word.english, options: shuffleArray([...distractors, word]), answer: word.hebrew, wordId: word.id
        };
      });
      setQuestions(generated);
    }
  }, [mistakePool, isReady, questions.length, filteredVocab]);

  const handleAnswer = (index: number, isCorrect: boolean) => {
    if (isAnswering) return;
    setSelectedAnswer(index);
    setIsAnswering(true);
    const q = questions[currentIndex];

    if (isCorrect) {
      setResults(r => ({ ...r, correct: r.correct + 1 }));
      if (q.wordId) onCorrect(q.wordId);
    } else {
      setResults(r => ({ ...r, wrong: r.wrong + 1 }));
      if (q.wordId) onWrong({ id: q.wordId, english: q.text, hebrew: q.answer });
    }

    setTimeout(() => {
      setIsAnswering(false);
      setSelectedAnswer(null);
      if (currentIndex + 1 >= questions.length) setPhase("summary");
      else setCurrentIndex(i => i + 1);
    }, 1200);
  };

  if (!isReady) return null;

  if (phase === "selector") {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl h-14 w-14 bg-white shadow-sm hover:scale-110 active:scale-95 transition-all">
              <ArrowLeft className="w-8 h-8 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-4xl font-headline font-bold text-slate-800">Daily Quiz</h1>
              <p className="text-slate-500 font-medium">Test Your Knowledge</p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {days.map((day) => {
              const isLocked = day.dayOfWeek > today;
              return (
                <Card 
                  key={day.id}
                  onClick={() => !isLocked && startSession(day.id)}
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
                    {isLocked ? "LOCKED" : "START QUIZ"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    const q = questions[currentIndex];
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="mb-12">
            <div className="flex justify-between items-end mb-4">
               <span className="text-primary font-bold">Progress: {currentIndex + 1} / {questions.length}</span>
               <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Level {q.level}</span>
            </div>
            <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-4 bg-white/50" />
          </header>

          <main className="bg-white/95 rounded-[40px] p-12 shadow-2xl text-center">
            <h2 className={cn("font-headline font-bold text-slate-800 mb-8", q.level > 1 ? "text-3xl" : "text-6xl")}>
              {q.text}
            </h2>
            {q.hint && <p className="text-slate-500 text-xl mb-8" dir="rtl">{q.hint}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
              {q.options.map((opt: any, i: number) => {
                const isCorrect = q.type === "choice" ? opt.hebrew === q.answer : opt.is_correct;
                const isSelected = selectedAnswer === i;
                return (
                  <button
                    key={i}
                    disabled={isAnswering}
                    onClick={() => handleAnswer(i, isCorrect)}
                    className={cn(
                      "chunky-button text-xl py-8 transition-all border-2",
                      !isAnswering && "bg-slate-50 text-slate-700 border-slate-200",
                      isAnswering && isCorrect && "bg-emerald-500 text-white border-emerald-600",
                      isAnswering && isSelected && !isCorrect && "bg-rose-500 text-white border-rose-600"
                    )}
                    dir={q.type === "choice" ? "rtl" : "ltr"}
                  >
                    {q.type === "choice" ? opt.hebrew : opt.words.join(' ')}
                  </button>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-8">
      <Card className="max-w-xl w-full p-12 rounded-[48px] text-center bg-white shadow-2xl">
        <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-8 animate-bounce" />
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">Quiz Complete!</h1>
        <p className="text-slate-500 text-lg mb-10">Score: {results.correct} / {questions.length}</p>
        <Button onClick={() => setPhase("selector")} className="w-full chunky-button chunky-primary h-16 text-xl">
          BACK TO SELECTOR
        </Button>
      </Card>
    </div>
  );
}
