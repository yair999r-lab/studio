"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FeedbackModal } from "./FeedbackModal";
import { ArrowLeft, BrainCircuit, Sparkles } from "lucide-react";
import type { Mistake } from "@/hooks/use-game-state";
import { cn } from "@/lib/utils";

export function MistakesReview({ 
  mistakePool, 
  onBack, 
  onCorrect, 
  onWrong 
}: { 
  mistakePool: Mistake[];
  onBack: () => void;
  onCorrect: (id: string) => void;
  onWrong: (id: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    translation: string;
  } | null>(null);

  const currentWord = mistakePool[currentIndex];

  const handleContinue = () => {
    setShowFeedback(false);
    if (currentIndex + 1 >= mistakePool.length) {
      onBack();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const markProgress = (correct: boolean) => {
    if (correct) onCorrect(currentWord.id);
    else onWrong(currentWord.id);

    setCurrentFeedback({
      isCorrect: correct,
      correctAnswer: currentWord.english,
      translation: currentWord.hebrew
    });
    setShowFeedback(true);
  };

  return (
    <div className="min-h-screen bg-indigo-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="flex items-center gap-6 mb-12">
          <Button variant="ghost" onClick={onBack} className="rounded-2xl bg-white/50"><ArrowLeft className="w-6 h-6"/></Button>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <span className="text-indigo-600 font-bold">Mistakes Review: {currentIndex + 1} / {mistakePool.length}</span>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-widest">
                 Review Mode
              </span>
            </div>
            <Progress value={((currentIndex + 1) / mistakePool.length) * 100} className="h-4 bg-white" />
          </div>
        </header>

        <main className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[48px] p-12 shadow-2xl border-t-8 border-indigo-500">
          <div className="text-center space-y-12">
            <div className="space-y-6">
               <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Do you remember this word?</span>
               <h2 className="text-6xl font-headline font-bold text-slate-800 leading-relaxed italic" dir="rtl">
                 {currentWord?.hebrew}
               </h2>
               <div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100">
                  <p className="text-slate-500 text-xl font-medium">How do you say this in English?</p>
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button onClick={() => markProgress(true)} className="chunky-button chunky-success text-xl py-8 flex-1">
                I REMEMBERED!
              </Button>
              <Button onClick={() => markProgress(false)} className="chunky-button chunky-error text-xl py-8 flex-1">
                I FORGOT IT
              </Button>
            </div>
          </div>
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