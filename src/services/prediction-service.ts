'use server';
/**
 * @fileOverview Provides algorithmic prediction for lottery numbers.
 *
 * - predictNextDrawAlgorithm - Predicts the next draw based on historical data.
 * - AlgorithmInput - Input type for the prediction algorithm.
 * - AlgorithmOutput - Output type for the prediction algorithm.
 * - HistoricalDataPoint - Represents a single historical draw.
 */

import type { LotteryCategory, HistoricalDataPoint } from '@/types/lottery';

// Input type remains similar to the AI flow, but without Zod for server-side logic simplicity here.
export interface AlgorithmInput {
  category: LotteryCategory;
  historicalData: HistoricalDataPoint[];
}

// Output type also remains similar.
export interface AlgorithmOutput {
  predictions: {
    number: number;
    confidence: number; // Represents calculated score/probability (0-1)
  }[];
}

const MAX_NUMBER = 90;
const PREDICTION_COUNT = 5;
const RECENCY_WEIGHT = 0.4;
const FREQUENCY_WEIGHT = 0.6;
// More advanced: Consider pair/triplet analysis, hot/cold streaks, etc.

/**
 * Predicts the next lottery draw numbers based on an improved algorithm analyzing historical data.
 * Combines frequency and recency analysis.
 * @param input - The historical data and category.
 * @returns The predicted numbers with confidence scores.
 */
export async function predictNextDrawAlgorithm(input: AlgorithmInput): Promise<AlgorithmOutput> {
  const { historicalData } = input;
  const totalDraws = historicalData.length;

  if (totalDraws < 10) {
    // Not enough data for a meaningful prediction
    // Return empty or a default state? For now, return empty with a console warning.
    console.warn(`Insufficient data for prediction in category ${input.category}. Needs at least 10 draws, got ${totalDraws}.`);
     return { predictions: [] }; // Or throw an error to be caught by the caller
     // Let's return empty for now, the UI handles this message already.
  }

  const scores: Record<number, number> = {};
  const frequency: Record<number, number> = {};
  const lastSeen: Record<number, number> = {}; // Draw index where number was last seen (0 = most recent)

  // Initialize scores, frequency, and lastSeen
  for (let i = 1; i <= MAX_NUMBER; i++) {
    scores[i] = 0;
    frequency[i] = 0;
    lastSeen[i] = totalDraws; // Assume initially not seen in the provided data
  }

  // Process historical data (assuming already sorted chronologically ASCENDING for recency)
  // The hook provides data sorted DESCENDING, so we reverse it or iterate backwards.
  // Let's iterate backwards for simplicity here.
  historicalData.forEach((draw, index) => {
    const drawIndexFromPresent = index; // 0 is the most recent draw
    draw.numbers.forEach(num => {
      frequency[num]++;
      if (lastSeen[num] === totalDraws) { // Only update if this is the first time seeing it (most recent)
         lastSeen[num] = drawIndexFromPresent;
      }
    });
  });

  // Calculate scores
  let maxFrequency = 0;
  for (let i = 1; i <= MAX_NUMBER; i++) {
     if(frequency[i] > maxFrequency) maxFrequency = frequency[i];
  }


  for (let i = 1; i <= MAX_NUMBER; i++) {
    // Normalize frequency (0-1)
    const normalizedFrequency = maxFrequency > 0 ? frequency[i] / maxFrequency : 0;

    // Normalize recency (0-1, where 1 is most recent)
    // Lower lastSeen index means more recent.
    const normalizedRecency = lastSeen[i] < totalDraws ? 1 - (lastSeen[i] / totalDraws) : 0;

    // Combine scores with weights
    scores[i] = (normalizedFrequency * FREQUENCY_WEIGHT) + (normalizedRecency * RECENCY_WEIGHT);

    // Simple Boost/Penalty (Example): Boost numbers that appeared in the last 5 draws slightly
     if (lastSeen[i] < 5) {
       scores[i] *= 1.1; // 10% boost
     }
     // Simple Penalty: Penalize numbers that haven't appeared in the last 50% of draws
     else if (lastSeen[i] > totalDraws / 2) {
        scores[i] *= 0.9; // 10% penalty
     }
  }

   // Find max score for final normalization
   let maxScore = 0;
   Object.values(scores).forEach(score => {
     if (score > maxScore) maxScore = score;
   });


  // Prepare predictions
  const sortedScores = Object.entries(scores)
    .map(([num, score]) => ({ number: parseInt(num), score: score }))
    .sort((a, b) => b.score - a.score); // Sort descending by score

  const predictions = sortedScores.slice(0, PREDICTION_COUNT).map(item => ({
    number: item.number,
    // Normalize confidence to 0-1 based on the max score achieved
    confidence: maxScore > 0 ? Math.min(1, item.score / maxScore) : 0, // Ensure confidence doesn't exceed 1
  }));

   // Ensure 5 predictions, even if scores are low/zero, padding if necessary
   while (predictions.length < PREDICTION_COUNT && predictions.length < MAX_NUMBER) {
       // Find the next number from sortedScores not already in predictions
       const nextBest = sortedScores.find(s => !predictions.some(p => p.number === s.number));
       if (nextBest) {
           predictions.push({
               number: nextBest.number,
               confidence: maxScore > 0 ? Math.min(1, nextBest.score / maxScore) : 0,
           });
       } else {
           // Should not happen if MAX_NUMBER >= PREDICTION_COUNT
           break;
       }
   }


  // Sort final predictions by confidence descending before returning
   predictions.sort((a, b) => b.confidence - a.confidence);


  return { predictions };
}
