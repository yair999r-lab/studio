"use client";

import { useState, useEffect } from 'react';

export type Mistake = {
  id: string;
  english: string;
  hebrew: string;
  category: string;
  mastery: number;
};

export function useGameState() {
  const [score, setScore] = useState<number>(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedScore = localStorage.getItem('lexileap_score');
    const storedMistakes = localStorage.getItem('lexileap_mistakes');
    const storedOnboarding = localStorage.getItem('lexileap_onboarding');

    if (storedScore) setScore(parseInt(storedScore));
    if (storedMistakes) setMistakes(JSON.parse(storedMistakes));
    if (!storedOnboarding) {
      setIsFirstTime(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('lexileap_score', score.toString());
  }, [score, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('lexileap_mistakes', JSON.stringify(mistakes));
  }, [mistakes, loaded]);

  const addScore = (amount: number) => setScore((prev) => prev + amount);

  const addMistake = (word: Omit<Mistake, 'mastery'>) => {
    setMistakes((prev) => {
      const existing = prev.find((m) => m.id === word.id);
      if (existing) {
        // If already in mistakes bank, reset mastery to 0
        return prev.map((m) => (m.id === word.id ? { ...m, mastery: 0 } : m));
      }
      return [...prev, { ...word, mastery: 0 }];
    });
  };

  const resolveMistake = (wordId: string, correct: boolean) => {
    setMistakes((prev) => {
      const existing = prev.find((m) => m.id === wordId);
      if (!existing) return prev;

      if (correct) {
        // Increment mastery. If mastery reaches 2, remove from bank
        const newMastery = existing.mastery + 1;
        if (newMastery >= 2) {
          return prev.filter((m) => m.id !== wordId);
        }
        return prev.map((m) => (m.id === wordId ? { ...m, mastery: newMastery } : m));
      } else {
        // Failed again, reset mastery
        return prev.map((m) => (m.id === wordId ? { ...m, mastery: 0 } : m));
      }
    });
  };

  const completeOnboarding = () => {
    setIsFirstTime(false);
    localStorage.setItem('lexileap_onboarding', 'done');
  };

  return {
    score,
    mistakes,
    isFirstTime,
    addScore,
    addMistake,
    resolveMistake,
    completeOnboarding,
    loaded
  };
}