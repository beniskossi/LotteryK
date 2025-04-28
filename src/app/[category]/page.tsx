import type { LotteryCategory } from '@/types/lottery';
import DrawEntryForm from '@/components/draw-entry-form';
import DrawHistory from '@/components/draw-history';
import { Separator } from '@/components/ui/separator';

interface EntriesPageProps {
  params: { category: string };
}

export default function EntriesPage({ params }: EntriesPageProps) {
  const category = params.category as LotteryCategory;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-foreground">Enregistrer un Tirage</h2>
      <DrawEntryForm category={category} />
      <Separator className="my-6" />
      <h2 className="text-2xl font-semibold text-foreground">Historique des Tirages</h2>
      <DrawHistory category={category} />
    </div>
  );
}
