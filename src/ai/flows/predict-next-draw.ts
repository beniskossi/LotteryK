'use server';
/**
 * @fileOverview Predicts the next lottery draw numbers with confidence percentages.
 *
 * - predictNextDraw - A function that predicts the next draw numbers.
 * - PredictNextDrawInput - The input type for the predictNextDraw function.
 * - PredictNextDrawOutput - The return type for the predictNextDraw function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const PredictNextDrawInputSchema = z.object({
  category: z.enum(['GH18', 'CIV10', 'CIV13', 'CIV16']).describe('The lottery category.'),
  historicalData: z.array(
    z.object({
      date: z.string().describe('The draw date.'),
      numbers: z.array(z.number().int().min(1).max(90)).length(5).describe('The drawn numbers.'),
    })
  ).describe('Historical lottery draw data for the specified category.'),
});
export type PredictNextDrawInput = z.infer<typeof PredictNextDrawInputSchema>;

const PredictNextDrawOutputSchema = z.object({
  predictions: z.array(
    z.object({
      number: z.number().int().min(1).max(90).describe('The predicted number.'),
      confidence: z.number().min(0).max(1).describe('The confidence percentage (0-1) for the predicted number.'),
    })
  ).length(5).describe('The list of 5 predicted numbers with their confidence percentages.'),
});
export type PredictNextDrawOutput = z.infer<typeof PredictNextDrawOutputSchema>;

export async function predictNextDraw(input: PredictNextDrawInput): Promise<PredictNextDrawOutput> {
  return predictNextDrawFlow(input);
}

const predictNextDrawPrompt = ai.definePrompt({
  name: 'predictNextDrawPrompt',
  input: {
    schema: z.object({
      category: z.enum(['GH18', 'CIV10', 'CIV13', 'CIV16']).describe('The lottery category.'),
      historicalData: z.array(
        z.object({
          date: z.string().describe('The draw date.'),
          numbers: z.array(z.number().int().min(1).max(90)).length(5).describe('The drawn numbers.'),
        })
      ).describe('Historical lottery draw data for the specified category.'),
    }),
  },
  output: {
    schema: z.object({
      predictions: z.array(
        z.object({
          number: z.number().int().min(1).max(90).describe('The predicted number.'),
          confidence: z.number().min(0).max(1).describe('The confidence percentage (0-1) for the predicted number.'),
        })
      ).length(5).describe('The list of 5 predicted numbers with their confidence percentages.'),
    }),
  },
  prompt: `You are a lottery prediction expert. Analyze the historical lottery data and predict the next 5 numbers for the given category with confidence percentages.

Lottery Category: {{{category}}}
Historical Data:
{{#each historicalData}}
  Date: {{{date}}}, Numbers: {{#each numbers}}{{{this}}} {{/each}}
{{/each}}

Your prediction should be based on probability, number regularity, and historical trends. Provide a confidence percentage for each predicted number.
Ensure that numbers are between 1 and 90, and confidence percentages are between 0 and 1.

Predictions:
`,
});

const predictNextDrawFlow = ai.defineFlow<
  typeof PredictNextDrawInputSchema,
  typeof PredictNextDrawOutputSchema
>(
  {
    name: 'predictNextDrawFlow',
    inputSchema: PredictNextDrawInputSchema,
    outputSchema: PredictNextDrawOutputSchema,
  },
  async input => {
    const {output} = await predictNextDrawPrompt(input);
    return output!;
  }
);
