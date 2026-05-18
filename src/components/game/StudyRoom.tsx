
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search } from "lucide-react";
import vocabData from "@/app/lib/vocabulary.json";
import { cn } from "@/lib/utils";

export function StudyRoom({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const allWords = vocabData.weeks.flatMap(w => w.words);
  const filteredWords = allWords.filter(w => 
    (selectedWeek === null || w.week === selectedWeek) &&
    (w.english.toLowerCase().includes(search.toLowerCase()) || w.hebrew.includes(search))
  );

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background p-8 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl h-12 w-12 hover:bg-slate-100">
            <ArrowLeft className="w-8 h-8 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-4xl font-headline font-bold text-slate-800">Study Room</h1>
            <p className="text-slate-500">Brush up on your vocabulary</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input 
              placeholder="Search words..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-2 border-slate-200 focus:border-primary transition-colors bg-white shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            <Button 
              variant={selectedWeek === null ? "default" : "outline"}
              onClick={() => setSelectedWeek(null)}
              className="rounded-xl whitespace-nowrap"
            >
              All Weeks
            </Button>
            {vocabData.weeks.map(w => (
              <Button 
                key={w.id}
                variant={selectedWeek === w.id ? "default" : "outline"}
                onClick={() => setSelectedWeek(w.id)}
                className="rounded-xl whitespace-nowrap"
              >
                Week {w.id}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {filteredWords.map((word) => (
          <div 
            key={word.id} 
            className="card-3d-wrapper h-64 cursor-pointer"
            onClick={() => toggleFlip(word.id)}
          >
            <div className={cn(
              "card-3d-inner relative w-full h-full",
              flippedCards.has(word.id) && "flipped"
            )}>
              {/* Front */}
              <Card className="card-3d-front flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-slate-100 shadow-lg bg-white">
                <span className="text-sm font-bold text-primary uppercase tracking-widest mb-4 bg-primary/10 px-3 py-1 rounded-full">
                  {word.category}
                </span>
                <h3 className="text-4xl font-headline font-bold text-slate-800 text-center">{word.english}</h3>
                <p className="mt-8 text-slate-400 text-sm italic">Click to flip</p>
              </Card>

              {/* Back */}
              <Card className="card-3d-back flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-primary/20 shadow-xl bg-sky-50">
                <h3 className="text-4xl font-headline font-bold text-primary mb-2" dir="rtl">{word.hebrew}</h3>
                <p className="text-slate-600 text-center font-medium mt-4">
                  Common usage: Week {word.week}
                </p>
                <div className="mt-6 w-full border-t border-sky-100 pt-4 text-center">
                  <p className="text-xs text-sky-400 font-bold uppercase tracking-wider">Example context available in Training Ground</p>
                </div>
              </Card>
            </div>
          </div>
        ))}
        {filteredWords.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-2xl text-slate-400 font-headline">No words found match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
