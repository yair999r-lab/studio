
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FeedbackModal } from "./FeedbackModal";
import { ArrowLeft, BrainCircuit, Loader2, Sparkles } from "lucide-react";
import { generateMistakeSentences } from "@/ai/flows/generate-mistake-sentences";
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
  const [loading, setLoading] = useState(true);
  const [aiSentences, setAiSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    translation: string;
    isAlmost?: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchAiPractice() {
      try {
        const result = await generateMistakeSentences({
          mistakeWords: mistakePool.map(m => ({
            id: m.id,
            english: m.english,
            hebrew: m.hebrew,
            category: m.category
          }))
        });
        setAiSentences(result.sentences);
      } catch (e) {
        console.error("AI Generation failed, falling back to basic review", e);
        // Basic fallback: just show individual words if AI fails
        setAiSentences(mistakePool.map(m => `How do you say "${m.hebrew}" in English?`));
      } finally {
        setLoading(false);
      }
    }

    if (mistakePool.length > 0) {
      fetchAiPractice();
    }
  }, [mistakePool]);

  const handleContinue = () => {
    setShowFeedback(false);
    if (currentIndex + 1 >= aiSentences.length) {
      onBack();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const markProgress = (correct: boolean) => {
    // For AI generated sentences, we simulate progress across all provided mistake words 
    // because multiple words are used per sentence.
    mistakePool.forEach(m => {
      if (correct) onCorrect(m.id);
      else onWrong(m.id);
    });

    setCurrentFeedback({
      isCorrect: correct,
      correctAnswer: "Review complete!",
      translation: "AI generated practice reinforces multiple concepts at once."
    });
    setShowFeedback(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-indigo-50">
        <div className="relative mb-8">
          <BrainCircuit className="w-24 h-24 text-primary animate-pulse" />
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-amber-400 animate-bounce" />
        </div>
        <h2 className="text-3xl font-headline font-bold text-indigo-900 mb-2">Analyzing Mistakes...</h2>
        <p className="text-indigo-600 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Our AI is crafting personalized practice sentences just for you
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="flex items-center gap-6 mb-12">
          <Button variant="ghost" onClick={onBack} className="rounded-2xl bg-white/50"><ArrowLeft className="w-6 h-6"/></Button>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-2">
              <span className="text-indigo-600 font-bold">Mistakes Mastery: {currentIndex + 1} / {aiSentences.length}</span>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> AI Practice
              </span>
            </div>
            <Progress value={((currentIndex + 1) / aiSentences.length) * 100} className="h-4 bg-white" />
          </div>
        </header>

        <main className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[48px] p-12 shadow-2xl border-t-8 border-indigo-500">
          <div className="text-center space-y-12">
            <div className="space-y-6">
               <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Read and Understand</span>
               <h2 className="text-4xl font-headline font-bold text-slate-800 leading-relaxed italic">
                 &quot;{aiSentences[currentIndex]}&quot;
               </h2>
               <div className="p-6 bg-slate-50 rounded-[32px] border-2 border-slate-100">
                  <p className="text-slate-500">Take a moment to identify the words from your mistake bank in this sentence.</p>
               </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button onClick={() => markProgress(true)} className="chunky-button chunky-success text-xl py-8 flex-1">
                I UNDERSTAND THIS
              </Button>
              <Button onClick={() => markProgress(false)} className="chunky-button chunky-error text-xl py-8 flex-1">
                STILL STRUGGLING
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
