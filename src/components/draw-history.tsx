'use client';

import type { LotteryCategory, LotteryDraw } from '@/types/lottery';
import { useLotteryData } from '@/hooks/useLotteryData';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from '@/components/ui/skeleton';
import { getBallColorClass } from '@/lib/utils'; // Import the utility function

interface DrawHistoryProps {
  category: LotteryCategory;
}

export default function DrawHistory({ category }: DrawHistoryProps) {
  const { draws, loading, deleteDraw, resetData } = useLotteryData(category);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
            <Skeleton className="h-6 w-24" />
            <div className="flex space-x-2">
              {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-8 w-8 rounded-full" />)}
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (draws.length === 0) {
    return <p className="text-center text-muted-foreground mt-4">Aucun tirage enregistré pour cette catégorie.</p>;
  }

  return (
    <div className="space-y-4">
       <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="float-right mb-2">
                    <Trash2 className="mr-2 h-4 w-4" /> Réinitialiser les Données
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                <AlertDialogDescription>
                    Cette action est irréversible et supprimera toutes les données de tirage pour la catégorie {category}.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={resetData} className="bg-destructive hover:bg-destructive/90">
                    Supprimer
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

       <ScrollArea className="h-[400px] w-full rounded-md border p-4 clear-right"> {/* Increased height */}
        <div className="space-y-3">
          {draws.map((draw) => (
            <div key={draw.id} className="flex items-center justify-between p-3 bg-card rounded-lg shadow hover:bg-muted/50 transition-colors">
              <span className="font-medium text-sm text-foreground whitespace-nowrap">
                {format(new Date(draw.date), 'PPP', { locale: fr })}
              </span>
              <div className="flex space-x-1 sm:space-x-2">
                {draw.numbers.map((num, index) => (
                  <span
                    key={index}
                    className={`flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-full text-sm sm:text-base font-bold text-white shadow ${getBallColorClass(num)}`} // Use utility function
                  >
                    {num}
                  </span>
                ))}
              </div>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Supprimer le tirage</span>
                  </Button>
                </AlertDialogTrigger>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce tirage?</AlertDialogTitle>
                    <AlertDialogDescription>
                       Voulez-vous vraiment supprimer le tirage du {format(new Date(draw.date), 'PPP', { locale: fr })}? Cette action est irréversible.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteDraw(draw.id)} className="bg-destructive hover:bg-destructive/90">
                        Supprimer
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
               </AlertDialog>

            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
