
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackModalProps = {
  isCorrect: boolean;
  correctAnswer: string;
  translation: string;
  glossary?: Record<string, string>;
  isAlmost?: boolean;
  onContinue: () => void;
};

export function FeedbackModal({ isCorrect, correctAnswer, translation, glossary, isAlmost, onContinue }: FeedbackModalProps) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") onContinue();
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onContinue]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-6 animate-in slide-in-from-bottom-full duration-300">
      <div className={cn(
        "max-w-3xl mx-auto rounded-3xl p-8 shadow-2xl border-t-8",
        isCorrect ? "bg-emerald-50 border-emerald-500" : "bg-orange-50 border-orange-500"
      )}>
        <div className="flex items-start gap-4 mb-4">
          {isCorrect ? (
            <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
          ) : (
            <XCircle className="w-10 h-10 text-orange-500 shrink-0" />
          )}
          <div>
            <h2 className={cn("text-2xl font-bold font-headline mb-1", isCorrect ? "text-emerald-700" : "text-orange-700")}>
              {isCorrect ? (isAlmost ? "Almost perfect!" : "Excellent!") : "Keep going!"}
            </h2>
            {!isCorrect && (
              <p className="text-orange-800 mb-2">
                Correct answer: <span className="font-bold">{correctAnswer}</span>
              </p>
            )}
            {isAlmost && (
              <p className="text-emerald-800 mb-2 italic">
                Note the spelling: <span className="font-bold">{correctAnswer}</span>
              </p>
            )}
            <div className="bg-white/50 p-4 rounded-2xl mb-4 text-slate-800">
              <p className="text-lg mb-2 font-medium" dir="rtl">{translation}</p>
              {glossary && Object.keys(glossary).length > 0 && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {Object.entries(glossary).map(([en, he]) => (
                    <span key={en} className="bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                      <strong>{en}:</strong> {he}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={onContinue}
            className={cn(
              "chunky-button min-w-[160px]",
              isCorrect ? "chunky-success" : "chunky-error"
            )}
          >
            CONTINUE (Enter)
          </Button>
        </div>
      </div>
    </div>
  );
}
