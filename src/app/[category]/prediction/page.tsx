'use client';

import type { LotteryCategory, HistoricalDataPoint } from '@/types/lottery';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useState, useEffect, useCallback, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { predictNextDrawAlgorithm, AlgorithmInput, AlgorithmOutput } from '@/services/prediction-service';
import { getBallColorClass } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PredictionPageProps {
  params: Promise<{ category: string }>;
}

const MIN_DRAWS_REQUIRED = 10; // Minimum for basic prediction

export default function PredictionPage({ params }: PredictionPageProps) {
  const resolvedParams = use(params);
  const category = resolvedParams.category as LotteryCategory;
  const { draws, loading: dataLoading } = useLotteryData(category);
  const [prediction, setPrediction] = useState<AlgorithmOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisPerformed, setAnalysisPerformed] = useState(false);

  const handlePredict = useCallback(async () => {
    if (draws.length < MIN_DRAWS_REQUIRED) {
      setError(`Données historiques insuffisantes. Au moins ${MIN_DRAWS_REQUIRED} tirages sont requis.`);
      setPrediction(null);
      setAnalysisPerformed(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null);
    setAnalysisPerformed(false);

    try {
      // Prepare historical data, SORTED ASCENDING (oldest first) as required by the updated algorithm
      const historicalData: HistoricalDataPoint[] = [...draws]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort chronological order ASC
        .map(draw => ({
          date: draw.date,
          numbers: draw.numbers,
        }));

      const input: AlgorithmInput = {
        category: category,
        historicalData: historicalData,
      };

      const result = await predictNextDrawAlgorithm(input);

      if (result.predictions.length > 0) {
        // Algorithm already sorts, but ensure it
        result.predictions.sort((a, b) => b.confidence - a.confidence);
        setPrediction(result);
        setAnalysisPerformed(result.analysisPerformed); // Store analysis status
      } else if (draws.length >= MIN_DRAWS_REQUIRED) {
        console.warn("Prediction algorithm returned empty results despite sufficient data.");
        setError("La prédiction n'a pas pu générer de résultats. Vérifiez les données ou réessayez.");
        setPrediction(null);
        setAnalysisPerformed(false);
      }

    } catch (err) {
      console.error('Prediction failed:', err);
      setError('La prédiction a échoué. Veuillez réessayer.');
      setPrediction(null);
      setAnalysisPerformed(false);
    } finally {
      setIsLoading(false);
    }
  }, [draws, category]);

  // Optional: Auto-predict on load if desired
  // useEffect(() => {
  //   if (!dataLoading && draws.length >= MIN_DRAWS_REQUIRED && !prediction && !error && !isLoading) {
  //     handlePredict();
  //   }
  // }, [dataLoading, draws.length, prediction, error, isLoading, handlePredict]);


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

      <Button onClick={handlePredict} disabled={isLoading || draws.length < MIN_DRAWS_REQUIRED} className="w-full max-w-xs mx-auto flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <BrainCircuit className="mr-2 h-4 w-4" />
        )}
        {isLoading ? 'Prédiction en cours...' : 'Prédire le prochain tirage'}
      </Button>

      {draws.length < MIN_DRAWS_REQUIRED && !dataLoading && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Données Insuffisantes</AlertTitle>
          <AlertDescription>
           Il faut au moins {MIN_DRAWS_REQUIRED} tirages enregistrés pour générer une prédiction. Actuellement: {draws.length}.
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

      {prediction && prediction.predictions && prediction.predictions.length > 0 && (
        <Card className="shadow-lg text-center">
          <CardHeader>
            <CardTitle className="text-xl">Numéros Probables pour {category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Basé sur l'analyse algorithmique des données historiques
                {analysisPerformed ? " et l'analyse de l'erreur récente." : "."}
             </p>
            <div className="flex justify-center space-x-2 sm:space-x-4">
              {prediction.predictions.map(({ number, confidence }, index) => (
                <div key={index} className="flex flex-col items-center">
                  <span
                    className={`flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full text-lg sm:text-xl font-bold text-white shadow ${getBallColorClass(number)}`}
                  >
                    {number}
                  </span>
                  <span className="mt-2 text-xs text-muted-foreground">
                    Score: {(confidence * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-4">
                Note: Ces prédictions sont basées sur un algorithme et ne garantissent pas les résultats réels. Jouez de manière responsable.
            </p>
          </CardContent>
        </Card>
      )}

       {/* Show ready message */}
       {!prediction?.predictions?.length && !error && draws.length >= MIN_DRAWS_REQUIRED && !isLoading && (
            <Alert variant="default" className="mt-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Prêt pour la Prédiction</AlertTitle>
                <AlertDescription>
                 Cliquez sur le bouton ci-dessus pour générer une prédiction basée sur les {draws.length} tirages enregistrés pour {category}. L'algorithme utilise l'analyse de fréquence, de récence {draws.length >= 11 ? "et de l'erreur de la prédiction précédente." : "."}
                </AlertDescription>
            </Alert>
       )}

    </div>
  );
}
