export const LOTTERY_CATEGORIES = ['GH18', 'CIV10', 'CIV13', 'CIV16'] as const;
export type LotteryCategory = typeof LOTTERY_CATEGORIES[number];

export interface LotteryDraw {
  id: string; // Unique ID for the draw (e.g., timestamp or UUID)
  date: string; // ISO date string (e.g., "2024-07-28")
  numbers: number[]; // Array of 5 numbers
}

export interface HistoricalDataPoint {
    date: string;
    numbers: number[];
}
