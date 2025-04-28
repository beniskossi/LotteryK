'use server';
/**
 * @fileOverview Provides algorithmic prediction for lottery numbers, incorporating past error analysis.
 *
 * - predictNextDrawAlgorithm - Predicts the next draw based on historical data and recent error analysis.
 * - AlgorithmInput - Input type for the prediction algorithm.
 * - AlgorithmOutput - Output type for the prediction algorithm.
 * - HistoricalDataPoint - Represents a single historical draw.
 */

import type { LotteryCategory, HistoricalDataPoint } from '@/types/lottery';

// Input type remains similar to the AI flow, but without Zod for server-side logic simplicity here.
export interface AlgorithmInput {
  category: LotteryCategory;
  historicalData: HistoricalDataPoint[]; // Expects data sorted chronologically ASCENDING
}

// Output type also remains similar.
export interface AlgorithmOutput {
  predictions: {
    number: number;
    confidence: number; // Represents calculated score/probability (0-1)
  }[];
  analysisPerformed: boolean; // Flag indicating if error analysis was done
}

const MAX_NUMBER = 90;
const PREDICTION_COUNT = 5;
const BASE_RECENCY_WEIGHT = 0.4;
const BASE_FREQUENCY_WEIGHT = 0.6;
// Error Adjustment Factors (small values to avoid drastic swings)
const ERROR_PENALTY_FACTOR = 0.05; // Reduce score by 5% for each recent miss
const ERROR_BOOST_FACTOR = 0.03;   // Increase score by 3% for each recent unexpected hit
const MIN_DRAWS_FOR_BASIC_PREDICTION = 10;
const MIN_DRAWS_FOR_ERROR_ANALYSIS = 11; // Need n-1 for prediction + 1 for actual outcome

/**
 * Calculates scores based on frequency and recency.
 */
function calculateBaseScores(data: HistoricalDataPoint[]): Record<number, number> {
    const scores: Record<number, number> = {};
    const frequency: Record<number, number> = {};
    const lastSeen: Record<number, number> = {}; // Draw index from present (0 = most recent in this subset)
    const totalDraws = data.length;

    for (let i = 1; i <= MAX_NUMBER; i++) {
        scores[i] = 0;
        frequency[i] = 0;
        lastSeen[i] = totalDraws; // Assume not seen initially in this subset
    }

    data.forEach((draw, index) => {
        const drawIndexFromPresent = index; // 0 is the most recent in this specific dataset
        draw.numbers.forEach(num => {
            frequency[num]++;
            if (lastSeen[num] === totalDraws) {
                lastSeen[num] = drawIndexFromPresent;
            }
        });
    });

    let maxFrequency = 0;
    for (let i = 1; i <= MAX_NUMBER; i++) {
       if(frequency[i] > maxFrequency) maxFrequency = frequency[i];
    }

    for (let i = 1; i <= MAX_NUMBER; i++) {
        const normalizedFrequency = maxFrequency > 0 ? frequency[i] / maxFrequency : 0;
        const normalizedRecency = lastSeen[i] < totalDraws ? 1 - (lastSeen[i] / totalDraws) : 0;
        scores[i] = (normalizedFrequency * BASE_FREQUENCY_WEIGHT) + (normalizedRecency * BASE_RECENCY_WEIGHT);

         // Simple Boost/Penalty (based on general recency within this subset)
        if (lastSeen[i] < 5) {
          scores[i] *= 1.05; // 5% boost for very recent
        } else if (lastSeen[i] > totalDraws / 2 && totalDraws > 10) { // Only apply penalty if enough data
           scores[i] *= 0.95; // 5% penalty for not appearing recently
        }
    }

    return scores;
}

/**
 * Predicts the next lottery draw numbers based on an improved algorithm analyzing historical data.
 * Combines frequency and recency analysis, and incorporates analysis of the most recent prediction error.
 * @param input - The historical data (sorted ASC) and category.
 * @returns The predicted numbers with confidence scores and an analysis flag.
 */
export async function predictNextDrawAlgorithm(input: AlgorithmInput): Promise<AlgorithmOutput> {
  const { historicalData } = input;
  const totalDraws = historicalData.length;
  let analysisPerformed = false;

  if (totalDraws < MIN_DRAWS_FOR_BASIC_PREDICTION) {
    console.warn(`Insufficient data for basic prediction in category ${input.category}. Needs ${MIN_DRAWS_FOR_BASIC_PREDICTION} draws, got ${totalDraws}.`);
     return { predictions: [], analysisPerformed };
  }

  // Calculate initial scores based on ALL available data
  const currentScores = calculateBaseScores(historicalData);

  // --- Error Analysis Step (If enough data) ---
  if (totalDraws >= MIN_DRAWS_FOR_ERROR_ANALYSIS) {
    analysisPerformed = true;
    const mostRecentDraw = historicalData[totalDraws - 1]; // Last element is most recent
    const previousDraws = historicalData.slice(0, totalDraws - 1); // All except the last

    // Calculate what the prediction *would have been* for the most recent draw
    const retrospectiveScores = calculateBaseScores(previousDraws);

    // Get top 5 retrospective predictions
    const retrospectivePredictions = Object.entries(retrospectiveScores)
      .map(([num, score]) => ({ number: parseInt(num), score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, PREDICTION_COUNT)
      .map(p => p.number);

    const actualNumbers = new Set(mostRecentDraw.numbers);

    // Apply adjustments to CURRENT scores based on retrospective error
    for (let i = 1; i <= MAX_NUMBER; i++) {
        const wasPredictedRetrospectively = retrospectivePredictions.includes(i);
        const didAppear = actualNumbers.has(i);

        if (wasPredictedRetrospectively && !didAppear) {
            // Predicted but missed: Apply penalty
            currentScores[i] *= (1 - ERROR_PENALTY_FACTOR);
        } else if (!wasPredictedRetrospectively && didAppear) {
            // Appeared unexpectedly: Apply boost
             currentScores[i] *= (1 + ERROR_BOOST_FACTOR);
        }
        // Ensure score doesn't go negative (unlikely but possible with penalties)
         if (currentScores[i] < 0) currentScores[i] = 0;
    }
  }
   // --- End Error Analysis Step ---


   // Normalize adjusted scores and prepare final predictions
   let maxScore = 0;
   Object.values(currentScores).forEach(score => {
     if (score > maxScore) maxScore = score;
   });


  const sortedScores = Object.entries(currentScores)
    .map(([num, score]) => ({ number: parseInt(num), score: score }))
    .sort((a, b) => b.score - a.score); // Sort descending by adjusted score

  const predictions = sortedScores.slice(0, PREDICTION_COUNT).map(item => ({
    number: item.number,
    // Normalize confidence to 0-1 based on the max score achieved
    confidence: maxScore > 0 ? Math.min(1, item.score / maxScore) : 0, // Ensure confidence doesn't exceed 1
  }));

   // Ensure 5 predictions, padding if necessary
   while (predictions.length < PREDICTION_COUNT && predictions.length < MAX_NUMBER) {
       const nextBest = sortedScores.find(s => !predictions.some(p => p.number === s.number && s.number !== undefined));
       if (nextBest) {
           predictions.push({
               number: nextBest.number,
               confidence: maxScore > 0 ? Math.min(1, nextBest.score / maxScore) : 0,
           });
       } else {
           break; // Should not happen if MAX_NUMBER >= PREDICTION_COUNT
       }
   }


  // Sort final predictions by confidence descending before returning
   predictions.sort((a, b) => b.confidence - a.confidence);


  return { predictions, analysisPerformed };
}
