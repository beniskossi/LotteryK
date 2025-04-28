'use client';

import type { LotteryCategory, LotteryDraw } from '@/types/lottery';
import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_PREFIX = 'kinglotto_';

export function useLotteryData(category: LotteryCategory) {
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [loading, setLoading] = useState(true);

  const storageKey = `${LOCAL_STORAGE_PREFIX}${category}`;

  // Load draws from localStorage on initial render
  useEffect(() => {
    try {
      const storedDraws = localStorage.getItem(storageKey);
      if (storedDraws) {
        setDraws(JSON.parse(storedDraws));
      }
    } catch (error) {
      console.error('Failed to load draws from localStorage:', error);
      // Handle potential parsing errors or corrupted data
      localStorage.removeItem(storageKey); // Clear corrupted data
    } finally {
      setLoading(false);
    }
  }, [category, storageKey]);

  // Save draws to localStorage whenever draws state changes
  useEffect(() => {
    if (!loading) { // Only save after initial load
      try {
        localStorage.setItem(storageKey, JSON.stringify(draws));
      } catch (error) {
        console.error('Failed to save draws to localStorage:', error);
        // Handle potential storage quota errors
      }
    }
  }, [draws, storageKey, loading]);

  const addDraw = useCallback(
    (newDraw: Omit<LotteryDraw, 'id'>) => {
      const drawWithId: LotteryDraw = { ...newDraw, id: Date.now().toString() };
      setDraws((prevDraws) => {
        // Sort by date descending when adding
        const updatedDraws = [...prevDraws, drawWithId];
        updatedDraws.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return updatedDraws;
      });
    },
    [] // Dependencies are managed within the function
  );

  const deleteDraw = useCallback((drawId: string) => {
    setDraws((prevDraws) => prevDraws.filter((draw) => draw.id !== drawId));
  }, []);

  const resetData = useCallback(() => {
    setDraws([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to remove draws from localStorage:', error);
    }
  }, [storageKey]);

  return { draws, loading, addDraw, deleteDraw, resetData };
}
