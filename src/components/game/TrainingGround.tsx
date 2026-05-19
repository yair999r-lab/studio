"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Trophy } from "lucide-react";
import { FeedbackModal } from "./FeedbackModal";
import { isSpellingCorrect } from "@/lib/levenshtein";
import vocabData from "@/app/lib/vocabulary.json";
import { cn } from "@/lib/utils";
import type { Mistake } from "@/hooks/use-game-state";

type Difficulty = "easy" | "medium" | "hard";

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
  const isReviewMode = !!mistakePool;
  const [phase, setPhase] = useState<"setup" | "active" | "summary">(isReviewMode ? "active" : "setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    translation: string;
    glossary?: Record<string, string>;
    isAlmost?: boolean;
  } | null>(null);
  const [sessionResults, setSessionResults] = useState({ correct: 0, wrong: 0 });

  useEffect(() => {
    if (isReviewMode && mistakePool && questions.length === 0) {
      startSession(mistakePool);
    }
  }, [isReviewMode, mistakePool, questions.length]);

  const startSession = (customPool?: Mistake[]) => {
    let poolWords = [];
    let poolSentences = [];

    if (customPool) {
      poolWords = customPool;
    } else {
      const activeWeeks = selectedWeek === null 
        ? vocabData.weeks 
        : vocabData.weeks.filter(w => w.week_id === selectedWeek);
      poolWords = activeWeeks.flatMap(w => w.words);
      poolSentences = activeWeeks.flatMap(w => w.sentences);
    }

    let generatedQuestions = [];
    
    if (customPool) {
      generatedQuestions = poolWords.map(word => {
        const distractors = vocabData.weeks.flatMap(w => w.words)
          .filter(w => w.id !== word.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const options = [...distractors, word].sort(() => Math.random() - 0.5);
        return { 
          type: "choice", 
          word, 
          options, 
          answer: word.hebrew, 
          text: word.english 
        };
      });
    } else {
      if (difficulty === "easy") {
        generatedQuestions = poolWords.sort(() => Math.random() - 0.5).slice(0, 10).map(word => {
          const distractors = poolWords.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3);
          const options = [...distractors, word].sort(() => Math.random() - 0.5);
          return { type: "choice", word, options, answer: word.hebrew, text: word.english };
        });
      } else if (difficulty === "medium") {
        generatedQuestions = poolSentences.sort(() => Math.random() - 0.5).slice(0, 10).map(s => ({
          type: "sentence_choice",
          sentence: s,
          options: [...s.answers].sort(() => Math.random() - 0.5),
          answer: s.answers.find(a => a.is_correct)?.words?.join(' / ') || ""
        }));
      } else {
        generatedQuestions = poolWords.sort(() => Math.random() - 0.5).slice(0, 10).map(word => ({
          type: "typing",
          word,
          text: word.hebrew,
          answer: word.english
        }));
      }
    }

    setQuestions(generatedQuestions);
    setPhase("active");
    setCurrentIndex(0);
    setSessionResults({ correct: 0, wrong: 0 });
  };

  const processAnswer = (isCorrect: boolean, q: any, almost: boolean = false) => {
    if (isCorrect) {
      setSessionResults(prev => ({ ...prev, correct: prev.correct + 1 }));
      onCorrect(q.word?.id || q.sentence?.id);
    } else {
      setSessionResults(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      if (q.word) onWrong(q.word);
    }

    setCurrentFeedback({
      isCorrect,
      isAlmost: almost,
      correctAnswer: q.answer,
      translation: q.sentence?.translation_hebrew || q.word?.hebrew || "",
      glossary: q.sentence?.glossary
    });
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setUserAnswer("");
    if (currentIndex + 1 >= questions.length) {
      setPhase("summary");
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-[40px] p-10 shadow-xl border border-white/50 bouncy-entrance">
          <div className="flex items-center gap-4 mb-10">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl hover:bg-white/50 p-2 transition-all duration-300 hover:scale-110">
              <ArrowLeft className="w-8 h-8 text-slate-400" />
            </Button>
            <h1 className="text-3xl font-headline font-bold text-slate-800">Training Ground</h1>
          </div>

          <div className="space-y-8">
            <section>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Select Difficulty</p>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "chunky-button capitalize text-lg py-6 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer",
                      difficulty === d ? "chunky-primary" : "bg-white/50 text-slate-400 border-slate-200"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Study Set</p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  variant={selectedWeek === null ? "default" : "outline"}
                  onClick={() => setSelectedWeek(null)}
                  className="rounded-xl px-6 py-6 font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                >All Weeks</Button>
                {vocabData.weeks.map(w => (
                  <Button 
                    key={w.week_id}
                    variant={selectedWeek === w.week_id ? "default" : "outline"}
                    onClick={() => setSelectedWeek(w.week_id)}
                    className="rounded-xl px-6 py-6 font-bold transition-all duration-300 hover:scale-105 active:scale-95"
                  >Week {w.week_id}</Button>
                ))}
              </div>
            </section>
          </div>

          <Button 
            onClick={() => startSession()}
            className="w-full chunky-button chunky-primary text-xl py-8 mt-12 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer"
          >
            START SESSION
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    const q = questions[currentIndex];
    if (!q) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 transition-all duration-300 hover:scale-110 active:scale-95"><ArrowLeft className="w-6 h-6"/></Button>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-primary font-bold">
                  {isReviewMode ? "Mistakes Review" : "Training"}: {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                  {isReviewMode ? "Review" : difficulty} MODE
                </span>
              </div>
              <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-4 bg-white/50" />
            </div>
          </header>

          <main className="bg-white/80 backdrop-blur-md rounded-[40px] p-12 shadow-xl border border-white/50 min-h-[450px] flex items-center justify-center">
            {q.type === "choice" && (
              <div className="w-full text-center space-y-12">
                <div className="space-y-4">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Translate this word</span>
                  <h2 className="text-6xl font-headline font-bold text-slate-800">{q.text}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                  {q.options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => processAnswer(opt.hebrew === q.answer, q)}
                      className="chunky-button bg-white/50 text-slate-700 border-slate-200 text-2xl py-8 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                      dir="rtl"
                    >
                      {opt.hebrew}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q.type === "sentence_choice" && (
              <div className="w-full text-center space-y-12">
                <div className="space-y-4">
                   <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Complete the sentence</span>
                   <h2 className="text-4xl font-headline font-medium text-slate-800 leading-relaxed px-8">
                     {q.sentence.text_with_blanks}
                   </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                  {q.options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => processAnswer(opt.is_correct, q)}
                      className="chunky-button bg-white/50 text-slate-700 border-slate-200 text-xl py-6 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      {opt.words ? opt.words.join(' / ') : opt.word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q.type === "typing" && (
              <div className="w-full text-center space-y-12">
                <div className="space-y-4">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Type the translation</span>
                  <h2 className="text-6xl font-headline font-bold text-slate-800" dir="rtl">{q.text}</h2>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (userAnswer.trim()) {
                      const { isCorrect, isAlmost } = isSpellingCorrect(q.word?.accepted_answers || q.answer, userAnswer);
                      processAnswer(isCorrect, q, isAlmost);
                    }
                  }}
                  className="w-full max-w-md mx-auto space-y-6"
                >
                  <Input 
                    autoFocus
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type in English..."
                    className="h-20 text-3xl text-center rounded-[32px] border-4 border-white shadow-sm focus:border-primary transition-all font-bold bg-white/50 backdrop-blur-sm"
                  />
                  <p className="text-slate-400 font-bold text-sm">PRESS ENTER TO SUBMIT</p>
                </form>
              </div>
            )}
          </main>
        </div>

        {showFeedback && currentFeedback && (
          <FeedbackModal 
            {...currentFeedback}
            onContinue={handleContinue}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white/80 backdrop-blur-md rounded-[40px] p-12 shadow-xl border border-white/50 text-center">
        <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-6 animate-bounce" />
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-4">{isReviewMode ? "Mistakes Cleared!" : "Training Complete!"}</h1>
        <p className="text-slate-500 text-lg mb-10 font-medium">You&apos;re building an incredible foundation.</p>
        
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-emerald-50/50 p-8 rounded-[32px] border border-emerald-100">
            <p className="text-emerald-700 font-bold text-5xl mb-2">{sessionResults.correct}</p>
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-widest">Mastered</p>
          </div>
          <div className="bg-rose-50/50 p-8 rounded-[32px] border border-rose-100">
            <p className="text-rose-700 font-bold text-5xl mb-2">{sessionResults.wrong}</p>
            <p className="text-rose-600 text-xs font-bold uppercase tracking-widest">Still Tough</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={() => startSession(mistakePool)} className="w-full chunky-button chunky-primary py-8 text-xl transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer">
            {isReviewMode ? "REVIEW AGAIN" : "TRAIN AGAIN"}
          </Button>
          <Button variant="ghost" onClick={onBack} className="w-full text-slate-400 font-bold transition-all duration-300 hover:scale-105 active:scale-95">RETURN TO LOBBY</Button>
        </div>
      </div>
    </div>
  );
}
