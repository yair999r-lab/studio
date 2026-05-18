
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

type Difficulty = "easy" | "medium" | "hard";

export function TrainingGround({ 
  onBack, 
  onCorrect, 
  onWrong 
}: { 
  onBack: () => void; 
  onCorrect: (wordId: string) => void; 
  onWrong: (word: { id: string; english: string; hebrew: string; category: string }) => void;
}) {
  const [phase, setPhase] = useState<"setup" | "active" | "summary">("setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  
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

  const allWords = vocabData.weeks.flatMap(w => w.words);
  const allSentences = vocabData.weeks.flatMap(w => w.sentences);

  const startSession = () => {
    const pool = selectedWeek === null ? allWords : allWords.filter(w => w.week_id === selectedWeek);
    const poolSentences = selectedWeek === null ? allSentences : allSentences.filter(s => {
        // Find if this sentence belongs to the selected week
        const week = vocabData.weeks.find(w => w.week_id === selectedWeek);
        return week?.sentences.some(ws => ws.id === s.id);
    });

    let generatedQuestions = [];
    if (difficulty === "easy") {
      generatedQuestions = pool.sort(() => Math.random() - 0.5).slice(0, questionCount).map(word => {
        const distractors = allWords
          .filter(w => w.id !== word.id && w.category === word.category)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const options = [...distractors, word].sort(() => Math.random() - 0.5);
        return { type: "choice", word, options, answer: word.hebrew, text: word.english };
      });
    } else if (difficulty === "medium") {
      generatedQuestions = poolSentences.sort(() => Math.random() - 0.5).slice(0, questionCount).map(s => ({
        type: "sentence_choice",
        sentence: s,
        options: s.answers.sort(() => Math.random() - 0.5),
        answer: s.answers.find(a => a.is_correct)?.word
      }));
    } else {
      generatedQuestions = pool.sort(() => Math.random() - 0.5).slice(0, questionCount).map(word => ({
        type: "typing",
        word,
        text: word.hebrew,
        answer: word.english
      }));
    }

    setQuestions(generatedQuestions);
    setPhase("active");
    setCurrentIndex(0);
    setSessionResults({ correct: 0, wrong: 0 });
  };

  const handleChoice = (val: string) => {
    if (showFeedback) return;
    const q = questions[currentIndex];
    const isCorrect = val === q.answer;
    processAnswer(isCorrect, q);
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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-[40px] p-10 shadow-xl border-2 border-slate-100 bouncy-entrance">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl hover:bg-slate-50">
              <ArrowLeft className="w-6 h-6 text-slate-400" />
            </Button>
            <h1 className="text-3xl font-headline font-bold text-slate-800">Setup Training</h1>
          </div>

          <div className="space-y-8">
            <section>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Choose Difficulty</p>
              <div className="grid grid-cols-3 gap-4">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "chunky-button border-b-8 capitalize text-lg py-6",
                      difficulty === d ? "chunky-primary" : "bg-white text-slate-400 border-slate-200"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Select Week</p>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={selectedWeek === null ? "default" : "outline"}
                  onClick={() => setSelectedWeek(null)}
                  className="rounded-xl"
                >All Weeks</Button>
                {vocabData.weeks.map(w => (
                  <Button 
                    key={w.week_id}
                    variant={selectedWeek === w.week_id ? "default" : "outline"}
                    onClick={() => setSelectedWeek(w.week_id)}
                    className="rounded-xl"
                  >Week {w.week_id}</Button>
                ))}
              </div>
            </section>
          </div>

          <Button 
            onClick={startSession}
            className="w-full chunky-button chunky-primary text-xl py-8 mt-12"
          >
            START TRAINING
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    const q = questions[currentIndex];
    return (
      <div className="min-h-screen bg-background p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <header className="flex items-center gap-6 mb-12">
            <Button variant="ghost" onClick={onBack} className="rounded-2xl"><ArrowLeft className="w-6 h-6"/></Button>
            <div className="flex-1">
              <div className="flex justify-between items-end mb-2">
                <span className="text-primary font-bold">Progress: {currentIndex + 1} / {questions.length}</span>
                <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">{difficulty} MODE</span>
              </div>
              <Progress value={((currentIndex + 1) / questions.length) * 100} className="h-4 bg-slate-100" />
            </div>
          </header>

          <main className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[48px] p-12 shadow-xl border-b-8 border-slate-100">
            {q.type === "choice" && (
              <div className="w-full text-center space-y-12">
                <div className="space-y-4">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Translate this word</span>
                  <h2 className="text-6xl font-headline font-bold text-slate-800">{q.text}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                  {q.options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleChoice(opt.hebrew)}
                      className="chunky-button bg-white text-slate-700 border-slate-200 border-b-8 text-2xl py-8 text-center"
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
                   <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Complete the sentence</span>
                   <h2 className="text-4xl font-headline font-medium text-slate-800 leading-relaxed px-8">
                     {q.sentence.text_with_blanks}
                   </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mx-auto">
                  {q.options.map((opt: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleChoice(opt.word)}
                      className="chunky-button bg-white text-slate-700 border-slate-200 border-b-8 text-xl py-6"
                    >
                      {opt.word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q.type === "typing" && (
              <div className="w-full text-center space-y-12">
                <div className="space-y-4">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Type the translation</span>
                  <h2 className="text-6xl font-headline font-bold text-slate-800" dir="rtl">{q.text}</h2>
                </div>
                <div className="w-full max-w-md mx-auto space-y-6">
                  <Input 
                    autoFocus
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && userAnswer.trim()) {
                        const { isCorrect, isAlmost } = isSpellingCorrect(q.answer, userAnswer);
                        processAnswer(isCorrect, q, isAlmost);
                      }
                    }}
                    placeholder="Type in English..."
                    className="h-16 text-2xl text-center rounded-2xl border-2 border-slate-200 focus:border-primary"
                  />
                  <p className="text-slate-400 text-sm">Press ENTER to submit</p>
                </div>
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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-[40px] p-12 shadow-2xl border-t-8 border-primary text-center bouncy-entrance">
        <Trophy className="w-24 h-24 text-primary mx-auto mb-6" />
        <h1 className="text-4xl font-headline font-bold text-slate-800 mb-2">Training Complete!</h1>
        <p className="text-slate-500 text-lg mb-8">You&apos;re getting better every day.</p>
        
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="bg-emerald-50 p-6 rounded-[32px] border-2 border-emerald-100">
            <p className="text-emerald-700 font-bold text-4xl mb-1">{sessionResults.correct}</p>
            <p className="text-emerald-600 text-sm font-bold uppercase tracking-wider">Correct</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-[32px] border-2 border-orange-100">
            <p className="text-orange-700 font-bold text-4xl mb-1">{sessionResults.wrong}</p>
            <p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Mistakes</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={startSession} className="w-full chunky-button chunky-primary py-8 text-xl">TRAIN AGAIN</Button>
          <Button variant="ghost" onClick={onBack} className="w-full h-12 text-slate-400 font-bold">RETURN TO LOBBY</Button>
        </div>
      </div>
    </div>
  );
}
