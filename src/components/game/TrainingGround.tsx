
"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy, CheckCircle2, XCircle } from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import { cn, shuffleArray } from "@/lib/utils";
import type { Mistake } from "@/hooks/use-game-state";

type Difficulty = "easy" | "medium" | "hard";

type Question = {
  type: "choice" | "sentence_choice";
  level: 1 | 2 | 3;
  text: string;
  hint?: string;
  options: any[];
  answer: string;
  wordId?: string;
  sentenceId?: string;
};

type TrainingGroundProps = {
  onBack: () => void;
  onCorrect: (wordId: string) => void;
  onWrong: (word: any) => void;
  mistakePool?: Mistake[]; 
};

export function TrainingGround({ 
  onBack, 
  onCorrect, 
  onWrong,
  mistakePool
}: TrainingGroundProps) {
  const { filteredVocab, isReady } = useStudyLogic();
  const isReviewMode = !!mistakePool;
  
  const [phase, setPhase] = useState<"setup" | "active" | "summary">(isReviewMode ? "active" : "setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [sessionResults, setSessionResults] = useState({ correct: 0, wrong: 0 });

  useEffect(() => {
    const vocab: any = filteredVocab;
    if (isReviewMode && mistakePool && questions.length === 0 && isReady && vocab?.weeks) {
      const generated = mistakePool.map(word => {
        const allWords = vocab.weeks.flatMap((w: any) => w.words || []);
        const distractors = allWords
          .filter((w: any) => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const options = shuffleArray([...distractors, word]);
        return {
          type: "choice" as const,
          level: 1 as const,
          text: word.english,
          options,
          answer: word.hebrew,
          wordId: word.id
        };
      });
      setQuestions(generated);
    }
  }, [isReviewMode, mistakePool, questions.length, isReady, filteredVocab]);

  const startSession = () => {
    const vocab: any = filteredVocab;
    if (!vocab || !vocab.weeks) return;

    const activeWeeks = selectedWeek === null 
      ? vocab.weeks 
      : vocab.weeks.filter((w: any) => w.week_id === selectedWeek);
    
    const poolWords = activeWeeks.flatMap((w: any) => w.words || []);
    const poolSentences = activeWeeks.flatMap((w: any) => w.sentences || []);
    
    if (poolWords.length === 0) return;

    const generated: Question[] = [];

    const level1Words = shuffleArray(poolWords).slice(0, 5);
    level1Words.forEach((word: any) => {
      const distractors = poolWords
        .filter((w: any) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = shuffleArray([...distractors, word]);
      generated.push({
        type: "choice",
        level: 1,
        text: word.english,
        options,
        answer: word.hebrew,
        wordId: word.id
      });
    });

    const level2Sentences = poolSentences
      .filter((s: any) => s.answers.find((a: any) => a.is_correct)?.words.length === 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    level2Sentences.forEach((s: any) => {
      generated.push({
        type: "sentence_choice",
        level: 2,
        text: s.text_with_blanks,
        hint: s.translation_hebrew,
        options: shuffleArray(s.answers),
        answer: s.answers.find((a: any) => a.is_correct)?.words.join(' ') || "",
        sentenceId: s.id
      });
    });

    const level3Sentences = poolSentences
      .filter((s: any) => s.answers.find((a: any) => a.is_correct)?.words.length === 2)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    
    level3Sentences.forEach((s: any) => {
      generated.push({
        type: "sentence_choice",
        level: 3,
        text: s.text_with_blanks,
        options: shuffleArray(s.answers),
        answer: s.answers.find((a: any) => a.is_correct)?.words.join(' / ') || "",
        sentenceId: s.id
      });
    });

    while (generated.length < 10 && poolWords.length > generated.length) {
      const remaining = poolWords.filter((w: any) => !generated.find(q => q.wordId === w.id));
      if (remaining.length === 0) break;
      const word = remaining[0];
      const distractors = poolWords
        .filter((w: any) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      generated.push({
        type: "choice",
        level: 1,
        text: word.english,
        options: shuffleArray([...distractors, word]),
        answer: word.hebrew,
        wordId: word.id
      });
    }

    setQuestions(shuffleArray(generated));
    setPhase("active");
    setCurrentIndex(0);
    setSessionResults({ correct: 0, wrong: 0 });
  };

  const handleAnswer = (index: number, isCorrect: boolean) => {
    if (isAnswering) return;
    
    setSelectedAnswer(index);
    setIsAnswering(true);

    const q = questions[currentIndex];
    const vocab: any = filteredVocab;

    if (isCorrect) {
      setSessionResults(prev => ({ ...prev, correct: prev.correct + 1 }));
      if (q.wordId) onCorrect(q.wordId);
    } else {
      setSessionResults(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      if (q.wordId && vocab?.weeks) {
        const fullWord = vocab.weeks.flatMap((w: any) => w.words || []).find((w: any) => w.id === q.wordId);
        if (fullWord) onWrong(fullWord);
      }
    }

    setTimeout(() => {
      setIsAnswering(false);
      setSelectedAnswer(null);
      if (currentIndex + 1 >= questions.length) {
        setPhase("summary");
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 1500);
  };

  if (!isReady || !filteredVocab) return null;

  if (phase === "setup") {
    const vocab: any = filteredVocab;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-[40px] p-10 shadow-2xl border-none">
          <div className="flex items-center gap-4 mb-10">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl hover:bg-slate-100/50 p-2 transition-all duration-300 hover:scale-110">
              <ArrowLeft className="w-8 h-8 text-slate-400" />
            </Button>
            <h1 className="text-3xl font-headline font-bold text-slate-800">Daily Quiz</h1>
          </div>

          <div className="space-y-8">
            <section>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Study Set</p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant={selectedWeek === null ? "default" : "outline"}
                  onClick={() => setSelectedWeek(null)}
                  className="rounded-xl px-6 py-6 font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                >Daily Selection</Button>
                {vocab?.weeks?.map((w: any) => (
                  <Button 
                    key={w.week_id}
                    variant={selectedWeek === w.week_id ? "default" : "outline"}
                    onClick={() => setSelectedWeek(w.week_id)}
                    className="rounded-xl px-6 py-6 font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                  >Week {w.week_id}</Button>
                ))}
              </div>
            </section>
          </div>

          <Button 
            onClick={startSession}
            className="w-full chunky-button chunky-primary text-xl py-8 mt-12 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer shadow-lg"
          >
            START QUIZ
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    const q = questions[currentIndex];
    if (!q) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl bg-white/90 backdrop-blur-sm border-none shadow-md transition-all duration-300 hover:scale-110 active:scale-95"><ArrowLeft className="w-6 h-6"/></Button>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-primary font-bold drop-shadow-sm">
                  {isReviewMode ? "Mistakes Review" : "Daily Quiz"}: {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                  Level {q.level}
                </span>
              </div>
              <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-4 bg-white/50 border-none" />
            </div>
          </header>

          <main className="bg-white/95 backdrop-blur-md rounded-[40px] p-12 shadow-2xl border-none min-h-[500px] flex items-center justify-center">
            <div className="w-full text-center space-y-12">
              <div className="space-y-4">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  {q.type === "choice" ? "Translate this word" : "Complete the sentence"}
                </span>
                <h2 className={cn(
                  "font-headline font-bold text-slate-800 leading-tight transition-all duration-500",
                  q.type === "choice" ? "text-6xl" : "text-4xl px-8"
                )}>
                  {q.text}
                </h2>
                {q.hint && (
                  <p className="text-slate-500 text-xl font-medium" dir="rtl">{q.hint}</p>
                )}
              </div>

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
                        "chunky-button text-2xl py-8 transition-all duration-300 shadow-md border-2",
                        !isAnswering && "bg-slate-50 text-slate-700 border-slate-200 hover:scale-105 active:scale-95 cursor-pointer",
                        isAnswering && isCorrect && "bg-emerald-500 text-white border-emerald-600 scale-105",
                        isAnswering && isSelected && !isCorrect && "bg-rose-500 text-white border-rose-600 shake",
                        isAnswering && !isSelected && !isCorrect && "opacity-40 grayscale-[0.5]"
                      )}
                      dir={q.type === "choice" ? "rtl" : "ltr"}
                    >
                      {q.type === "choice" ? opt.hebrew : opt.words.join(' / ')}
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
        </div>

        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          .shake { animation: shake 0.2s ease-in-out infinite; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 flex items-center justify-center p-6">
      <div className="w-full max-xl bg-white/95 backdrop-blur-md rounded-[40px] p-12 shadow-2xl border-none text-center">
        <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6 animate-bounce" />
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">{isReviewMode ? "Review Complete!" : "Quiz Complete!"}</h1>
        <p className="text-slate-500 text-lg mb-10 font-medium">You're making great progress today.</p>
        
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-emerald-50 p-8 rounded-[32px] border-none shadow-sm">
            <p className="text-emerald-700 font-bold text-5xl mb-2">{sessionResults.correct}</p>
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Mastered</p>
          </div>
          <div className="bg-rose-50 p-8 rounded-[32px] border-none shadow-sm">
            <p className="text-rose-700 font-bold text-5xl mb-2">{sessionResults.wrong}</p>
            <p className="text-rose-600 text-xs font-bold uppercase tracking-widest">Mistakes</p>
          </div>
        </div>

        <div className="space-y-4">
          {!isReviewMode && (
            <Button onClick={startSession} className="w-full chunky-button chunky-primary py-8 text-xl transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer">
              RETRY QUIZ
            </Button>
          )}
          <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold transition-all duration-300 hover:scale-105 active:scale-95">BACK TO STUDY ROOM</Button>
        </div>
      </div>
    </div>
  );
}
