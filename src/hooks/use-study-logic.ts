
"use client";

import { useState, useEffect } from 'react';
import vocabData from '@/app/lib/vocabulary.json';

/**
 * Hook to implement the Core Learning Logic: Daily Time-Lock.
 * - Identifies the Current Active Week (highest week_id).
 * - Past weeks are fully unlocked.
 * - Current week is sliced into daily chunks (0-9, 10-19, etc.).
 */
export function useStudyLogic() {
  const [filteredVocab, setFilteredVocab] = useState<any>(vocabData);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!vocabData || !vocabData.weeks || !Array.isArray(vocabData.weeks)) {
      setIsReady(true);
      return;
    }

    const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    const maxWeekId = Math.max(...vocabData.weeks.map(w => w.week_id));

    const updatedWeeks = vocabData.weeks.map(week => {
      // Past weeks are 100% unlocked
      if (week.week_id < maxWeekId) {
        return week;
      }

      // Current Active Week chunking logic
      const words = Array.isArray(week.words) ? [...week.words] : [];
      let slicedWords;

      if (today === 0) {
        // Sunday: index 0 to 9
        slicedWords = words.slice(0, 10);
      } else if (today === 1) {
        // Monday: index 10 to 19
        slicedWords = words.slice(10, 20);
      } else if (today === 2) {
        // Tuesday: index 20 to 29
        slicedWords = words.slice(20, 30);
      } else if (today === 3) {
        // Wednesday: index 30 to 39
        slicedWords = words.slice(30, 40);
      } else {
        // Thu, Fri, Sat: ALL words
        slicedWords = words;
      }

      return { ...week, words: slicedWords };
    });

    setFilteredVocab({
      ...vocabData,
      weeks: updatedWeeks
    });
    setIsReady(true);
  }, []);

  return { filteredVocab, isReady };
}
