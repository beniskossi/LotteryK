'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LotteryCategory } from '@/types/lottery';
import { cn } from '@/lib/utils';
import { Pencil, Search, BarChart3, BrainCircuit } from 'lucide-react'; // Using appropriate icons

interface CategoryTabsProps {
  category: LotteryCategory;
}

const TABS = [
  { name: 'Entrées', path: '', icon: Pencil },
  { name: 'Consulter', path: '/consulter', icon: Search },
  { name: 'Statistiques', path: '/statistiques', icon: BarChart3 },
  { name: 'Prédiction', path: '/prediction', icon: BrainCircuit },
];

export default function CategoryTabs({ category }: CategoryTabsProps) {
  const pathname = usePathname();

  // Determine the active tab based on the current path segment after the category
  const currentSegment = pathname.split('/').pop() || '';
  const activeTabPathSegment = TABS.find(tab => `/${category}${tab.path}` === pathname)
    ? currentSegment
    : (LOTTERY_CATEGORIES.includes(currentSegment as LotteryCategory) ? '' : currentSegment); // Default to '' (Entrées) if only category is present


  // Find the value for Tabs based on path segment
  const activeValue = TABS.find(tab => tab.path.substring(1) === activeTabPathSegment)?.path || '';


  return (
    <Tabs value={activeValue} className="w-full">
      <TabsList className="grid w-full grid-cols-4 h-auto p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = `/${category}${tab.path}` === pathname;
          return (
            <TabsTrigger
              key={tab.name}
              value={tab.path}
              className={cn(
                "flex flex-col items-center h-auto py-2 px-1 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
                 // Removed text color change for better dark theme visibility
              )}
              asChild
            >
              <Link href={`/${category}${tab.path}`}>
                <Icon className={cn("mb-1 h-5 w-5", isActive ? "text-accent-foreground" : "text-muted-foreground")} />
                <span className="text-xs truncate">{tab.name}</span>
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
