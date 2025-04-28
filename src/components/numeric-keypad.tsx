'use client';

import { Button } from '@/components/ui/button';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils'; // Import cn utility function

interface NumericKeypadProps {
  onInput: (value: string) => void;
}

const keypadButtons = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  'delete', '0' // Combining delete and 0
];

export default function NumericKeypad({ onInput }: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-4 bg-muted rounded-lg shadow-md">
      {keypadButtons.map((btn) => (
        <Button
          key={btn}
          onClick={() => onInput(btn)}
          variant={btn === 'delete' ? 'destructive' : 'secondary'}
          size="lg"
          className={cn(
            'text-xl font-bold h-14 rounded-md',
            btn === 'delete' ? 'col-span-1' : '', // Adjust span if needed
            btn === '0' ? 'col-span-2' : '' // Make 0 wider
          )}
          aria-label={btn === 'delete' ? 'Supprimer' : `Numéro ${btn}`}
        >
          {btn === 'delete' ? <Delete className="h-6 w-6" /> : btn}
        </Button>
      ))}
    </div>
  );
}
