
'use client';

import type { LotteryCategory, LotteryDraw } from '@/types/lottery';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLotteryData } from '@/hooks/useLotteryData';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from 'date-fns/locale'; // Import French locale
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from '@/hooks/use-toast';
import NumericKeypad from '@/components/numeric-keypad';
import { useState } from 'react';


interface DrawEntryFormProps {
  category: LotteryCategory;
}

const DrawSchema = z.object({
  date: z.date({
    required_error: "La date du tirage est requise.",
    invalid_type_error: "Format de date invalide.",
  }),
  numbers: z.array(z.string())
    .length(5, "Veuillez entrer 5 numéros.")
    .refine(
      (nums) => nums.every(numStr => {
        const num = parseInt(numStr, 10);
        return !isNaN(num) && num >= 1 && num <= 90;
      }),
      "Chaque numéro doit être entre 1 et 90."
    )
    .refine(
      (nums) => new Set(nums.map(n => parseInt(n, 10))).size === nums.length,
      "Les numéros ne doivent pas être dupliqués."
    ),
});

type DrawFormData = z.infer<typeof DrawSchema>;

export default function DrawEntryForm({ category }: DrawEntryFormProps) {
  const { addDraw } = useLotteryData(category);
  const { toast } = useToast();
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // State for Calendar Popover

   const form = useForm<DrawFormData>({
     resolver: zodResolver(DrawSchema),
     defaultValues: {
       date: new Date(),
       numbers: Array(5).fill(''),
     },
   });

  const onSubmit = (data: DrawFormData) => {
    const drawData: Omit<LotteryDraw, 'id'> = {
      date: format(data.date, 'yyyy-MM-dd'),
      numbers: data.numbers.map(Number),
    };
    addDraw(drawData);
    toast({
      title: "Succès",
      description: "Tirage enregistré avec succès.",
      variant: "default",
    });
    form.reset({ date: new Date(), numbers: Array(5).fill('') }); // Reset form after submission
    setActiveInputIndex(null); // Close keypad
    setIsCalendarOpen(false); // Ensure calendar is closed on submit
  };

  const handleNumberInput = (value: string) => {
    if (activeInputIndex === null) return;

    const currentNumbers = form.getValues('numbers');
    const newNumbers = [...currentNumbers];

    if (value === 'delete') {
        // If current input is empty, move to previous and delete
        if (newNumbers[activeInputIndex] === '' && activeInputIndex > 0) {
            newNumbers[activeInputIndex - 1] = '';
            form.setValue('numbers', newNumbers, { shouldValidate: true });
            setActiveInputIndex(activeInputIndex - 1);
        } else {
            newNumbers[activeInputIndex] = '';
            form.setValue('numbers', newNumbers, { shouldValidate: true });
        }
    } else {
      const currentVal = newNumbers[activeInputIndex];
      // Append or replace based on length
       if (currentVal.length < 2) {
           newNumbers[activeInputIndex] = currentVal + value;
           form.setValue('numbers', newNumbers, { shouldValidate: true });
           // Move to next input if 2 digits are entered
           if (newNumbers[activeInputIndex].length === 2 && activeInputIndex < 4) {
               setActiveInputIndex(activeInputIndex + 1);
           } else if (newNumbers[activeInputIndex].length === 2 && activeInputIndex === 4) {
               // Optionally close keypad or focus submit button
              // setActiveInputIndex(null);
           }
       } else {
            // If field already has 2 digits, move to next and insert
            if(activeInputIndex < 4) {
                newNumbers[activeInputIndex + 1] = value;
                form.setValue('numbers', newNumbers, { shouldValidate: true });
                setActiveInputIndex(activeInputIndex + 1);
            }
        }
    }
  };


  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="date">Date du Tirage</Label>
        <Controller
          name="date"
          control={form.control}
          render={({ field }) => (
             <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}> {/* Control Popover state */}
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date); // Update form value
                    setIsCalendarOpen(false); // Close popover on select
                  }}
                  initialFocus
                  locale={fr} // Use French locale for calendar
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {form.formState.errors.date && (
          <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Numéros (1-90)</Label>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Controller
              key={index}
              name={`numbers.${index}`}
              control={form.control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="text" // Use text to allow manual and keypad input
                  inputMode="numeric" // Hint for mobile keyboards (though we use custom)
                  maxLength={2}
                  placeholder="--"
                  className="text-center text-lg font-semibold h-14 rounded-full border-2 focus:border-accent focus:ring-accent shadow-inner appearance-none" // Style as circles
                  onFocus={() => setActiveInputIndex(index)}
                  // Prevent manual typing if desired, rely only on keypad
                  // readOnly
                />
              )}
            />
          ))}
        </div>
         {form.formState.errors.numbers && (
          <p className="text-sm text-destructive">
            {form.formState.errors.numbers.message || form.formState.errors.numbers.root?.message}
          </p>
        )}
      </div>

      {/* Conditionally render Numeric Keypad */}
       {activeInputIndex !== null && (
           <div className="mt-4">
               <NumericKeypad onInput={handleNumberInput} />
           </div>
       )}


      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {form.formState.isSubmitting ? 'Enregistrement...' : 'Enregistrer le Tirage'}
      </Button>
    </form>
  );
}

