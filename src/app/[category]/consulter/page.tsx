'use client';

import type { LotteryCategory, LotteryDraw } from '@/types/lottery';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useState, useMemo, useCallback, use } from 'react'; // Added use
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBallColorClass } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type * as ReactType from 'react'; // Import React types

interface ConsultPageProps {
  params: Promise<{ category: string }>; // params is a Promise
}

type TimePeriod = 'all' | 'last_month' | 'last_quarter' | 'last_year';

export default function ConsultPage({ params }: ConsultPageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const category = resolvedParams.category as LotteryCategory;
  const { draws, loading } = useLotteryData(category);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleNumberChange = (event: ReactType.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '') {
      setSelectedNumber(null);
      setInputError(null);
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= 90) {
      setSelectedNumber(num);
      setInputError(null);
    } else {
      setSelectedNumber(null);
      setInputError('Veuillez entrer un nombre valide entre 1 et 90.');
    }
  };

  const filterDrawsByTimePeriod = useCallback((draws: LotteryDraw[], period: TimePeriod): LotteryDraw[] => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'last_quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'all':
      default:
        return draws; // No filtering needed
    }

    return draws.filter(draw => new Date(draw.date) >= startDate!);
  }, []);


  const filteredDraws = useMemo(() => {
       if (loading) return [];
       return filterDrawsByTimePeriod(draws, timePeriod);
   }, [draws, timePeriod, filterDrawsByTimePeriod, loading]);


  const analysisResults = useMemo(() => {
    if (!selectedNumber || filteredDraws.length === 0) {
      return { sameDrawFrequency: 0, nextDrawFrequency: 0, simultaneousNumbers: {} };
    }

    let sameDrawCount = 0;
    let nextDrawCount = 0;
    const simultaneousCounts: Record<number, number> = {};
    let totalOccurrences = 0;

    // Sort draws by date ascending for easier 'next draw' calculation
    const sortedDraws = [...filteredDraws].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 0; i < sortedDraws.length; i++) {
      const currentDraw = sortedDraws[i];
      const numbersInCurrentDraw = new Set(currentDraw.numbers);

      if (numbersInCurrentDraw.has(selectedNumber)) {
        totalOccurrences++;
        sameDrawCount++; // Count occurrence in the current draw

        // Analyze simultaneous numbers
        currentDraw.numbers.forEach(num => {
          if (num !== selectedNumber) {
            simultaneousCounts[num] = (simultaneousCounts[num] || 0) + 1;
          }
        });

        // Check the next draw (if exists)
        if (i + 1 < sortedDraws.length) {
          const nextDraw = sortedDraws[i + 1];
          if (nextDraw.numbers.includes(selectedNumber)) {
            nextDrawCount++;
          }
        }
      }
    }

    // Calculate frequencies (as percentages)
    const sameDrawFrequency = totalOccurrences > 0 ? (sameDrawCount / totalOccurrences) * 100 : 0; // Should always be 100% by definition here, maybe redefine? Let's count times number appeared vs times it appeared in next draw
    const nextDrawAppearanceCount = nextDrawCount; // Raw count of times it appeared in the next draw
    const nextDrawFrequency = totalOccurrences > 0 ? (nextDrawCount / totalOccurrences) * 100 : 0; // Percentage based on total occurrences of selected number


    // Sort simultaneous numbers by frequency
    const sortedSimultaneous = Object.entries(simultaneousCounts)
      .map(([num, count]) => ({ number: parseInt(num), count }))
      .sort((a, b) => b.count - a.count);


    return {
      totalOccurrences, // How many times the selected number appeared in the filtered period
      nextDrawAppearanceCount, // How many times it appeared in the *subsequent* draw
      nextDrawFrequency, // Percentage: (nextDrawAppearanceCount / totalOccurrences) * 100
      simultaneousNumbers: sortedSimultaneous,
    };

  }, [selectedNumber, filteredDraws]);


    if (loading) {
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Skeleton className="h-10 w-full" />
               <Skeleton className="h-10 w-full" />
            </div>
             <Skeleton className="h-4 w-1/3" />
             <Card>
                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
             </Card>
             <Card>
                <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
             </Card>
          </div>
        );
    }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Consulter les Données</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="selectedNumber">Numéro à Analyser (1-90)</Label>
          <Input
            id="selectedNumber"
            type="number"
            min="1"
            max="90"
            value={selectedNumber ?? ''}
            onChange={handleNumberChange}
            placeholder="Entrez un numéro"
            className={inputError ? 'border-destructive' : ''}
          />
          {inputError && <p className="text-sm text-destructive">{inputError}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="timePeriod">Période</Label>
             <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger id="timePeriod">
                <SelectValue placeholder="Choisir une période" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Toute la période</SelectItem>
                    <SelectItem value="last_month">Dernier mois</SelectItem>
                    <SelectItem value="last_quarter">Dernier trimestre</SelectItem>
                    <SelectItem value="last_year">Dernière année</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

       {!selectedNumber && !inputError && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Commencez votre Analyse</AlertTitle>
                <AlertDescription>
                Entrez un numéro entre 1 et 90 et choisissez une période pour voir les analyses de régularité et les numéros fréquemment tirés ensemble.
                </AlertDescription>
            </Alert>
       )}


      {selectedNumber && !inputError && (
        <div className="space-y-4 mt-6">
           <Alert variant="default" className="bg-card border-primary/50">
              <Info className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary font-semibold">Analyse pour le numéro {selectedNumber}</AlertTitle>
              <AlertDescription>
                Période sélectionnée: {
                  {'all': 'Toute la période', 'last_month': 'Dernier mois', 'last_quarter': 'Dernier trimestre', 'last_year': 'Dernière année'}[timePeriod]
                }. Nombre total d'apparitions: {analysisResults.totalOccurrences}.
              </AlertDescription>
            </Alert>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Régularité du Numéro</CardTitle>
            </CardHeader>
            <CardContent>
               {analysisResults.totalOccurrences > 0 ? (
                  <div className="space-y-2">
                    <p>
                        Apparu dans le tirage suivant: <span className="font-bold">{analysisResults.nextDrawAppearanceCount} fois</span>
                    </p>
                    <p>
                      Fréquence d'apparition dans le tirage suivant: <span className="font-bold">{analysisResults.nextDrawFrequency.toFixed(1)}%</span>
                    </p>
                  </div>
               ) : (
                    <p className="text-muted-foreground">Le numéro {selectedNumber} n'a pas été tiré pendant la période sélectionnée.</p>
               )}

            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Numéros Fréquemment Tirés Ensemble</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisResults.simultaneousNumbers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysisResults.simultaneousNumbers.slice(0, 15).map(({ number, count }) => ( // Show top 15
                    <div key={number} className="flex flex-col items-center p-2 bg-muted rounded-md text-center">
                       <span
                           className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold text-white shadow mb-1 ${getBallColorClass(number)}`}
                         >
                           {number}
                       </span>
                       <span className="text-xs text-muted-foreground">{count} fois</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                    {analysisResults.totalOccurrences > 0 ? `Aucun autre numéro n'a été tiré en même temps que ${selectedNumber} pendant cette période.` : `Le numéro ${selectedNumber} n'est pas apparu dans la période sélectionnée.`}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
