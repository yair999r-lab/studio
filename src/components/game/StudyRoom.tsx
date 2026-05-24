
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, SortAsc, LayoutGrid } from "lucide-react";
import { useStudyLogic } from "@/hooks/use-study-logic";
import { cn } from "@/lib/utils";

export function StudyRoom({ onBack }: { onBack: () => void }) {
  const { filteredVocab, isReady } = useStudyLogic();
  const [search, setSearch] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isSortedAZ, setIsSortedAZ] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const allWords = useMemo(() => {
    const vocab: any = filteredVocab;
    if (!vocab || !vocab.weeks) return [];
    return vocab.weeks.flatMap((w: any) => w.words || []);
  }, [filteredVocab]);

  const filteredAndSortedWords = useMemo(() => {
    const vocab: any = filteredVocab;
    if (!vocab || !vocab.weeks || !allWords) return [];

    let words = allWords.filter(w => {
      const week = vocab.weeks.find((week: any) => week.week_id === selectedWeek);
      const belongsToSelectedWeek = selectedWeek === null || 
        (week && week.words && week.words.some((word: any) => word.id === w.id));
      
      const matchesSearch = w.english.toLowerCase().includes(search.toLowerCase()) || w.hebrew.includes(search);
      return belongsToSelectedWeek && matchesSearch;
    });

    const sorted = [...words].sort((a, b) => {
      const s = search.toLowerCase();
      if (s) {
        const aStarts = a.english.toLowerCase().startsWith(s);
        const bStarts = b.english.toLowerCase().startsWith(s);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
      }

      if (isSortedAZ) {
        return a.english.localeCompare(b.english);
      }
      return 0;
    });

    return sorted;
  }, [allWords, search, selectedWeek, isSortedAZ, filteredVocab]);

  const toggleFlip = (id: string) => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isReady || !filteredVocab || !filteredVocab.weeks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-200 p-8 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl h-14 w-14 bg-white/50 backdrop-blur-sm shadow-sm hover:scale-110 active:scale-95 transition-all">
              <ArrowLeft className="w-8 h-8 text-slate-600" />
            </Button>
            <div>
              <h1 className="text-4xl font-headline font-bold text-slate-800">Vocabulary Bank</h1>
              <p className="text-slate-500 font-medium">Master the Dictionary</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input 
                placeholder="Smart Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 h-14 rounded-2xl border-none bg-white/90 shadow-lg text-lg focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 scrollbar-hide">
              <Button 
                variant="outline"
                onClick={() => setIsSortedAZ(!isSortedAZ)}
                className={cn(
                  "h-14 rounded-2xl px-6 font-bold shadow-md transition-all flex-shrink-0",
                  isSortedAZ ? "bg-primary text-white border-primary" : "bg-white/80"
                )}
              >
                <SortAsc className="w-5 h-5 mr-2" /> A-Z
              </Button>
              <Button 
                variant={selectedWeek === null ? "default" : "outline"}
                onClick={() => setSelectedWeek(null)}
                className="h-14 rounded-2xl px-6 font-bold shadow-md bg-white/80 flex-shrink-0"
              >
                All
              </Button>
              {filteredVocab.weeks.map(w => (
                <Button 
                  key={w.week_id}
                  variant={selectedWeek === w.week_id ? "default" : "outline"}
                  onClick={() => setSelectedWeek(w.week_id)}
                  className="h-14 rounded-2xl px-6 font-bold shadow-md whitespace-nowrap bg-white/80 flex-shrink-0"
                >
                  Week {w.week_id}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredAndSortedWords.map((word) => (
            <div 
              key={word.id} 
              className="card-3d-wrapper h-72 cursor-pointer group"
              onClick={() => toggleFlip(word.id)}
            >
              <div className={cn(
                "card-3d-inner relative w-full h-full",
                flippedCards.has(word.id) && "flipped"
              )}>
                <Card className="card-3d-front flex flex-col items-center justify-center p-8 rounded-[40px] border-none shadow-xl bg-white/95 backdrop-blur-md transition-all group-hover:shadow-2xl">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest mb-6 bg-primary/10 px-4 py-1.5 rounded-full">
                    {word.category}
                  </span>
                  <h3 className="text-4xl font-headline font-bold text-slate-800 text-center leading-tight">{word.english}</h3>
                  <div className="mt-auto opacity-30 group-hover:opacity-100 transition-opacity">
                    <LayoutGrid className="w-6 h-6 text-slate-400" />
                  </div>
                </Card>

                <Card className="card-3d-back flex flex-col items-center justify-center p-8 rounded-[40px] border-none shadow-2xl bg-primary text-white">
                  <h3 className="text-5xl font-headline font-bold mb-4" dir="rtl">{word.hebrew}</h3>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-widest">
                    Hebrew Meaning
                  </p>
                </Card>
              </div>
            </div>
          ))}
        </div>
        
        {filteredAndSortedWords.length === 0 && isReady && (
          <div className="text-center py-20 bg-white/50 backdrop-blur rounded-[40px] shadow-inner">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-2xl font-bold text-slate-400">No words found for today's selection.</p>
          </div>
        )}
      </div>
    </div>
  );
}
