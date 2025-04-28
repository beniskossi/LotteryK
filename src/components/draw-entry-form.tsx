
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
import { useState, useRef, useEffect } from 'react'; // Import useRef and useEffect


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
        // Allow empty strings during input, but final validation requires numbers
        if (numStr === '') return true;
        const num = parseInt(numStr, 10);
        return !isNaN(num) && num >= 1 && num <= 90;
      }),
      "Chaque numéro doit être entre 1 et 90."
    )
    .refine(
        (nums) => nums.every(numStr => numStr !== ''), // Ensure all fields are filled before final submit validation
        "Veuillez entrer 5 numéros."
    )
    .refine(
      (nums) => {
         // Filter out empty strings before checking for duplicates
         const filledNums = nums.filter(n => n !== '').map(n => parseInt(n, 10));
         return new Set(filledNums).size === filledNums.length;
      },
      "Les numéros ne doivent pas être dupliqués."
    ),
});

type DrawFormData = z.infer<typeof DrawSchema>;

export default function DrawEntryForm({ category }: DrawEntryFormProps) {
  const { addDraw } = useLotteryData(category);
  const { toast } = useToast();
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(0); // Start focus on the first input
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // State for Calendar Popover
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Ref for input elements


   const form = useForm<DrawFormData>({
     resolver: zodResolver(DrawSchema),
     defaultValues: {
       date: new Date(),
       numbers: Array(5).fill(''),
     },
     mode: 'onChange', // Validate on change to give feedback
   });

   // Focus the first input on component mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
            setActiveInputIndex(0);
        }
    }, []); // Empty dependency array ensures this runs only once on mount


  const onSubmit = (data: DrawFormData) => {
    // Additional check just before submission, although schema should handle it
     const filledNumbers = data.numbers.map(n => n.trim()).filter(n => n !== '');
     if (filledNumbers.length !== 5) {
       form.setError('numbers', { type: 'manual', message: 'Veuillez entrer 5 numéros.' });
       // Find the first empty input and focus it
       const firstEmptyIndex = data.numbers.findIndex(n => n.trim() === '');
       if (firstEmptyIndex !== -1) {
            inputRefs.current[firstEmptyIndex]?.focus();
            setActiveInputIndex(firstEmptyIndex); // Ensure keypad targets correct input
       }
       return;
     }

    const drawData: Omit<LotteryDraw, 'id'> = {
      date: format(data.date, 'yyyy-MM-dd'),
      numbers: data.numbers.map(Number), // Convert valid strings to numbers
    };
    addDraw(drawData);
    toast({
      title: "Succès",
      description: "Tirage enregistré avec succès.",
      variant: "default",
    });
    form.reset({ date: new Date(), numbers: Array(5).fill('') }); // Reset form after submission
    inputRefs.current[0]?.focus(); // Focus first input after reset
    setActiveInputIndex(0);
    setIsCalendarOpen(false); // Ensure calendar is closed on submit
  };

  const handleNumberInput = (value: string) => {
    if (activeInputIndex === null) return;

    const currentNumbers = form.getValues('numbers');
    const newNumbers = [...currentNumbers];
    const currentIndex = activeInputIndex;

    if (value === 'delete') {
      const currentVal = newNumbers[currentIndex];
      if (currentVal.length > 0) {
        // Delete the last digit of the current input
        newNumbers[currentIndex] = currentVal.slice(0, -1);
        form.setValue(`numbers.${currentIndex}`, newNumbers[currentIndex], { shouldValidate: true });
        inputRefs.current[currentIndex]?.focus(); // Keep focus
      } else if (currentIndex > 0) {
        // Current input is empty, move focus to the previous input and delete its last digit
        const prevIndex = currentIndex - 1;
        // Check if prevIndex has content before deleting
        if (newNumbers[prevIndex].length > 0) {
            newNumbers[prevIndex] = newNumbers[prevIndex].slice(0, -1);
            form.setValue(`numbers.${prevIndex}`, newNumbers[prevIndex], { shouldValidate: true });
        }
        inputRefs.current[prevIndex]?.focus(); // Focus previous input
        setActiveInputIndex(prevIndex); // Update active index for keypad
      }
    } else { // Handle number input
      const currentVal = newNumbers[currentIndex];
      let nextVal = currentVal + value;

      // Ensure the number is valid (1-90) and handle leading zeros or invalid combinations
      if (nextVal.length === 1 && nextVal === '0') {
        nextVal = ''; // Prevent leading zero
      } else if (nextVal.length > 0) {
         const num = parseInt(nextVal, 10);
         if (isNaN(num) || num < 1 || num > 90) {
            // If the new value is invalid (e.g., > 90), don't update
            nextVal = currentVal; // Revert to previous value
            // Optionally provide feedback (e.g., shake animation or border color)
             toast({
                title: "Invalide",
                description: "Le numéro doit être entre 1 et 90.",
                variant: "destructive",
                duration: 2000, // Short duration for validation feedback
             });
             return; // Stop processing this input
         }
      }


      // Only allow up to 2 digits
      if (nextVal.length <= 2) {
        newNumbers[currentIndex] = nextVal;
        form.setValue(`numbers.${currentIndex}`, nextVal, { shouldValidate: true });

        // Move to the next input if 2 digits are entered OR if the number is >= 10
        const num = parseInt(nextVal, 10);
        if (nextVal.length === 2 || (!isNaN(num) && num >= 10 && num <=90)) {
            if (currentIndex < 4) {
                const nextIndex = currentIndex + 1;
                requestAnimationFrame(() => { // Use rAF to ensure state update before focus
                    inputRefs.current[nextIndex]?.focus();
                });
                setActiveInputIndex(nextIndex);
            } else {
                 // Last input filled, optionally close keypad or focus submit
                setActiveInputIndex(null); // Hide keypad (optional)
                // Consider focusing the submit button: submitButtonRef.current?.focus();
            }
        }
      } else if (currentVal.length < 2 && currentIndex < 4) {
          // If current input has 1 digit, and user types another, but nextVal > 2 digits (shouldn't happen with validation)
          // Move to next input and place the new digit there
          const nextIndex = currentIndex + 1;
          newNumbers[nextIndex] = value; // Place the single new digit here
          form.setValue(`numbers.${nextIndex}`, value, { shouldValidate: true });
          requestAnimationFrame(() => {
              inputRefs.current[nextIndex]?.focus();
           });
          setActiveInputIndex(nextIndex);
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
                  onClick={() => setIsCalendarOpen(true)} // Explicitly open on button click
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
                    if (date) { // Only update if a date is selected
                        field.onChange(date); // Update form value
                        setIsCalendarOpen(false); // Close popover on select
                    }
                  }}
                  initialFocus
                  locale={fr} // Use French locale for calendar
                  disabled={(date) => date > new Date()} // Disable future dates
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
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                   ref={(el) => {
                      inputRefs.current[index] = el;
                      // Forward the ref from Controller if needed, though typically not necessary here
                      // if (typeof field.ref === 'function') field.ref(el);
                      // else field.ref = el;
                    }}
                  type="text" // Use text to allow controlled input
                  inputMode="numeric" // Hint for mobile keyboards
                  pattern="[0-9]*" // Allow only numbers visually
                  maxLength={2}
                  placeholder="--"
                  className={cn(
                    "text-center text-lg font-semibold h-14 rounded-full border-2 focus:border-accent focus:ring-accent shadow-inner appearance-none", // Style as circles
                    fieldState.error ? "border-destructive focus:border-destructive focus:ring-destructive" : ""
                  )}
                  onFocus={() => setActiveInputIndex(index)}
                  // Prevent manual typing if relying solely on keypad
                  // readOnly
                  // Handle manual input changes if not readOnly
                   onChange={(e) => {
                       // Basic filtering for manual input if allowed
                       const value = e.target.value.replace(/[^0-9]/g, ''); // Remove non-digits
                       field.onChange(value); // Update form state
                       // Basic auto-tabbing for manual input
                       if (value.length === 2 && index < 4) {
                            inputRefs.current[index + 1]?.focus();
                            setActiveInputIndex(index + 1);
                       }
                   }}
                    onKeyDown={(e) => {
                       // Handle Backspace for manual input if allowed
                       if (e.key === 'Backspace' && field.value === '' && index > 0) {
                            e.preventDefault(); // Prevent default backspace behavior
                            inputRefs.current[index - 1]?.focus();
                            setActiveInputIndex(index - 1);
                           // Optionally delete the last char of the previous input
                            const prevValue = form.getValues(`numbers.${index - 1}`);
                            form.setValue(`numbers.${index - 1}`, prevValue.slice(0, -1), { shouldValidate: true });
                       }
                   }}
                />
              )}
            />
          ))}
        </div>
         {(form.formState.errors.numbers?.message || form.formState.errors.numbers?.root?.message) && (
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


      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !form.formState.isValid}>
        <PlusCircle className="mr-2 h-4 w-4" />
        {form.formState.isSubmitting ? 'Enregistrement...' : 'Enregistrer le Tirage'}
      </Button>
    </form>
  );
}
