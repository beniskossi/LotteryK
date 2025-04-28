'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOTTERY_CATEGORIES, type LotteryCategory } from '@/types/lottery';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Ticket } from 'lucide-react'; // Using Ticket icon for categories

export default function BottomNav() {
  const pathname = usePathname();
  const currentCategory = pathname.split('/')[1] as LotteryCategory; // Get the category from the path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {LOTTERY_CATEGORIES.map((category) => {
          const isActive = currentCategory === category;
          return (
            <Link key={category} href={`/${category}`} legacyBehavior>
              <Button
                variant="ghost"
                className={cn(
                  'flex flex-col items-center justify-center h-full w-full rounded-none px-2 py-1',
                  isActive ? 'text-accent font-semibold' : 'text-muted-foreground'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Ticket className="h-5 w-5 mb-0.5" />
                <span className="text-xs">{category}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
