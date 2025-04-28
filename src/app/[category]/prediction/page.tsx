'use client';

import type { LotteryCategory, HistoricalDataPoint } from '@/types/lottery';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { predictNextDraw, PredictNextDrawInput, PredictNextDrawOutput } from '@/ai/flows/predict-next-draw';
import { getBallColorClass } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from '@/components/ui/skeleton';

interface PredictionPageProps {
  params: { category: string };
}

export default function PredictionPage({ params }: PredictionPageProps) {
  const category = params.category as LotteryCategory;
  const { draws, loading: dataLoading } = useLotteryData(category);
  const [prediction, setPrediction] = useState<PredictNextDrawOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = useCallback(async () => {
    if (draws.length < 10) { // Require minimum data for prediction
        setError('Données historiques insuffisantes pour générer une prédiction fiable (minimum 10 tirages requis).');
        setPrediction(null);
        return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null); // Clear previous prediction

    try {
      // Prepare historical data in the required format for the AI flow
      const historicalData: HistoricalDataPoint[] = draws
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ensure chronological order
        .map(draw => ({
          date: draw.date,
          numbers: draw.numbers,
        }));

      const input: PredictNextDrawInput = {
        category: category,
        historicalData: historicalData,
      };

      const result = await predictNextDraw(input);
      // Sort predictions by confidence descending
      result.predictions.sort((a, b) => b.confidence - a.confidence);
      setPrediction(result);

    } catch (err) {
      console.error('Prediction failed:', err);
      setError('La prédiction a échoué. Veuillez réessayer.');
       setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, [draws, category]);

  // Automatically trigger prediction if there's enough data and no current prediction/error
  useEffect(() => {
    if (!dataLoading && draws.length >= 10 && !prediction && !error && !isLoading) {
     // handlePredict(); // Optional: auto-predict on load if desired
    }
  }, [dataLoading, draws.length, prediction, error, isLoading, handlePredict]);


   if (dataLoading) {
       return (
         <div className="space-y-6">
           <Skeleton className="h-8 w-1/2 mb-4" />
           <Skeleton className="h-10 w-full max-w-xs mx-auto" />
           <Card>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent>
                    <div className="flex justify-center space-x-4 p-4">
                       {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-16 rounded-full" />)}
                   </div>
                   <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
                </CardContent>
           </Card>
           <Skeleton className="h-10 w-full" />
         </div>
       );
   }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Prédiction du Prochain Tirage</h2>

        <Button onClick={handlePredict} disabled={isLoading || draws.length < 10} className="w-full max-w-xs mx-auto flex items-center justify-center">
            {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
            <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Prédiction en cours...' : 'Prédire le prochain tirage'}
        </Button>

        {draws.length < 10 && !dataLoading && (
             <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Données Insuffisantes</AlertTitle>
                <AlertDescription>
                 Il faut au moins 10 tirages enregistrés pour générer une prédiction. Actuellement: {draws.length}.
                </AlertDescription>
            </Alert>
        )}

      {error && (
        <Alert variant="destructive">
           <Info className="h-4 w-4" />
          <AlertTitle>Erreur de Prédiction</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {prediction && (
        <Card className="shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-xl">Numéros Probables pour {category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">Basé sur l'analyse des données historiques.</p>
            <div className="flex justify-center space-x-2 sm:space-x-4">
              {prediction.predictions.map(({ number, confidence }, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span
                    className={`flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full text-lg sm:text-xl font-bold text-white shadow ${getBallColorClass(number)}`}
                  >
                    {number}
                  </span>
                  <span className="mt-2 text-xs text-muted-foreground">
                    Confiance: {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-4">
                Note: Ces prédictions sont basées sur des probabilités et ne garantissent pas les résultats réels. Jouez de manière responsable.
            </p>
          </CardContent>
        </Card>
      )}

       {!prediction && !error && draws.length >= 10 && !isLoading && (
            <Alert variant="default" className="mt-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Prêt pour la Prédiction</AlertTitle>
                <AlertDescription>
                Cliquez sur le bouton ci-dessus pour générer une prédiction basée sur les {draws.length} tirages enregistrés pour la catégorie {category}.
                </AlertDescription>
            </Alert>
       )}

    </div>
  );
}
