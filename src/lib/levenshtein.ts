
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, (_, i) => i)
  );

  for (let i = 0; i <= a.length; i++) {
    matrix[i][0] = i;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[a.length][b.length];
}

export function isSpellingCorrect(target: string, input: string): { isCorrect: boolean; isAlmost: boolean } {
  const distance = getLevenshteinDistance(target.trim(), input.trim());
  if (distance === 0) return { isCorrect: true, isAlmost: false };
  
  // Rule: target <= 4 requires 100% accuracy. >= 5 allow 1 distance.
  if (target.length >= 5 && distance === 1) {
    return { isCorrect: true, isAlmost: true };
  }
  
  return { isCorrect: false, isAlmost: false };
}
