import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { LOTTERY_CATEGORIES, type LotteryCategory } from '@/types/lottery';
import CategoryTabs from '@/components/category-tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CategoryLayoutProps {
  children: ReactNode;
  params: { category: string };
}

export async function generateStaticParams() {
  return LOTTERY_CATEGORIES.map((category) => ({
    category,
  }));
}

export function generateMetadata({ params }: CategoryLayoutProps): Metadata {
  const category = params.category as LotteryCategory;
  if (!LOTTERY_CATEGORIES.includes(category)) {
    return { title: 'Kinglotto - Catégorie Invalide' };
  }
  return {
    title: `Kinglotto - ${category}`,
    description: `Entrées, consultation, statistiques et prédictions pour la loterie ${category}.`,
  };
}

export default function CategoryLayout({ children, params }: CategoryLayoutProps) {
  const category = params.category as LotteryCategory;

  if (!LOTTERY_CATEGORIES.includes(category)) {
    return <p>Catégorie de loterie invalide.</p>;
  }

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="text-3xl font-bold text-center text-primary">{`Loterie ${category}`}</h1>
      <Card className="shadow-lg">
        <CardHeader className="p-0">
           <CategoryTabs category={category} />
        </CardHeader>
        <CardContent className="p-4 md:p-6">
           {children}
        </CardContent>
      </Card>
    </div>
  );
}
