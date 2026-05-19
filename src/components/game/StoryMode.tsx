"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, BookOpen, CheckCircle, FileQuestion, GraduationCap, ChevronRight, HelpCircle } from "lucide-react";
import storyData from "@/app/lib/story.json";
import vocabData from "@/app/lib/vocabulary.json";
import { cn } from "@/lib/utils";

export function StoryMode({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("read");
  const [examAnswers, setExamAnswers] = useState<Record<number, number>>({});
  const [showExamResults, setShowExamResults] = useState(false);
  const [currentSelfQuestion, setCurrentSelfQuestion] = useState(0);
  const [selfRevealed, setSelfRevealed] = useState(false);
  const [selfScore, setSelfScore] = useState(0);

  // Flatten vocab for O(1) lookup
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
                <span className="font-bold text-primary underline decoration-primary/30 decoration-2 underline-offset-4 cursor-help bg-primary/5 px-0.5 rounded">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 text-white border-none p-3 rounded-xl shadow-xl">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Hebrew Translation</p>
                <p className="text-lg font-bold" dir="rtl">{translation}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return part;
    });
  };

  const calculateExamScore = () => {
    let correct = 0;
    storyData.multiple_choice.forEach((q, i) => {
      if (examAnswers[i] === q.correct_index) correct++;
    });
    return correct;
  };

  return (
    <div className="min-h-screen bg-[#fcfdff] p-6 pb-20 max-w-5xl mx-auto">
      <header className="flex items-center gap-6 mb-10">
        <Button variant="ghost" onClick={onBack} className="rounded-2xl h-12 w-12 p-0 hover:bg-slate-100">
          <ArrowLeft className="w-8 h-8 text-slate-400" />
        </Button>
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-800">{storyData.title}</h1>
          <p className="text-slate-400 text-sm font-medium">Immersive Reading & Comprehension</p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-slate-100 p-1.5 rounded-2xl w-full max-w-md h-auto gap-1">
          <TabsTrigger value="read" className="rounded-xl flex-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-2" /> Read
          </TabsTrigger>
          <TabsTrigger value="exam" className="rounded-xl flex-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GraduationCap className="w-4 h-4 mr-2" /> Exam
          </TabsTrigger>
          <TabsTrigger value="self" className="rounded-xl flex-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <HelpCircle className="w-4 h-4 mr-2" /> Review
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Read Story */}
        <TabsContent value="read" className="space-y-8 outline-none">
          <Card className="p-10 rounded-[40px] border-none shadow-[0_20px_60px_rgba(0,0,0,0.04)] bg-white">
            <div className="max-w-3xl mx-auto space-y-8">
              {storyData.paragraphs.map((para, i) => (
                <p key={i} className="text-xl leading-relaxed text-slate-700 font-medium tracking-tight">
                  {highlightText(para)}
                </p>
              ))}
            </div>
          </Card>
          <div className="flex justify-center">
             <Button onClick={() => setActiveTab("exam")} className="chunky-button chunky-primary px-12 py-8 text-xl">
               START THE EXAM <ChevronRight className="ml-2" />
             </Button>
          </div>
        </TabsContent>

        {/* Tab 2: Multiple Choice Exam */}
        <TabsContent value="exam" className="outline-none">
          {showExamResults ? (
            <Card className="p-12 text-center rounded-[40px] shadow-2xl border-none">
               <CheckCircle className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
               <h2 className="text-4xl font-headline font-bold text-slate-800 mb-2">Exam Complete!</h2>
               <p className="text-slate-400 mb-10">You scored {calculateExamScore()} out of {storyData.multiple_choice.length}</p>
               <Button onClick={() => { setShowExamResults(false); setExamAnswers({}); }} className="chunky-button chunky-primary py-6 px-12">
                 RETRY EXAM
               </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {storyData.multiple_choice.map((q, i) => (
                <Card key={i} className="p-8 rounded-[32px] border-2 border-slate-50 shadow-sm bg-white">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex gap-4">
                    <span className="text-primary/30">Q{i+1}.</span>
                    {q.question}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => setExamAnswers(prev => ({ ...prev, [i]: optIdx }))}
                        className={cn(
                          "p-5 rounded-2xl text-left font-bold transition-all border-2",
                          examAnswers[i] === optIdx 
                            ? "bg-primary text-white border-primary shadow-lg" 
                            : "bg-white text-slate-600 border-slate-100 hover:border-primary/20"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
              <div className="py-10 flex justify-center">
                <Button 
                  disabled={Object.keys(examAnswers).length < storyData.multiple_choice.length}
                  onClick={() => setShowExamResults(true)} 
                  className="chunky-button chunky-primary px-16 py-8 text-xl"
                >
                  SUBMIT EXAM
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Self-Assessment Review */}
        <TabsContent value="self" className="outline-none">
          <div className="max-w-3xl mx-auto space-y-12">
             <div className="text-center space-y-4">
               <h2 className="text-4xl font-headline font-bold text-slate-800">Open Assessment</h2>
               <p className="text-slate-400">Recall the details from the story. Test your depth.</p>
             </div>

             <Card className="p-12 rounded-[48px] border-none shadow-2xl bg-white text-center relative overflow-hidden min-h-[400px] flex flex-col justify-center">
                <div className="absolute top-0 inset-x-0 h-3 bg-primary/10" />
                
                <div className="space-y-10">
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">Question {currentSelfQuestion + 1} of {storyData.open_ended.length}</p>
                    <h3 className="text-3xl font-headline font-bold text-slate-800 leading-tight">
                      {storyData.open_ended[currentSelfQuestion].question}
                    </h3>
                  </div>

                  {selfRevealed ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="p-8 bg-emerald-50 rounded-[32px] border-2 border-emerald-100">
                        <p className="text-emerald-700 text-xl font-medium leading-relaxed italic">
                          "{storyData.open_ended[currentSelfQuestion].answer}"
                        </p>
                      </div>
                      <div className="space-y-6">
                        <p className="font-bold text-slate-500">Did your internal answer match the logic above?</p>
                        <div className="flex gap-4 justify-center">
                          <Button 
                            onClick={() => { setSelfScore(s => s+1); setSelfRevealed(false); if (currentSelfQuestion + 1 < storyData.open_ended.length) setCurrentSelfQuestion(c => c+1); else setActiveTab("read"); }}
                            className="chunky-button chunky-success px-10 py-6"
                          >
                            YES, I GOT IT!
                          </Button>
                          <Button 
                            onClick={() => { setSelfRevealed(false); if (currentSelfQuestion + 1 < storyData.open_ended.length) setCurrentSelfQuestion(c => c+1); else setActiveTab("read"); }}
                            className="chunky-button chunky-error px-10 py-6"
                          >
                            NOT QUITE
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setSelfRevealed(true)}
                      className="chunky-button chunky-primary py-8 px-12 text-xl mx-auto"
                    >
                      REVEAL ANSWER
                    </Button>
                  )}
                </div>
             </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
