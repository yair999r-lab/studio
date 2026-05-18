'use server';
/**
 * @fileOverview A Genkit flow that analyzes a user's Mistakes Bank
 * and generates personalized practice sentences incorporating multiple
 * words they've struggled with.
 *
 * - generateMistakeSentences - The main function to call the Genkit flow.
 * - GenerateMistakeSentencesInput - The input type for the flow.
 * - GenerateMistakeSentencesOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single word from the mistakes bank.
const MistakeWordSchema = z.object({
  id: z.string().describe('The unique ID of the word.'),
  english: z.string().describe('The English translation of the word.'),
  hebrew: z.string().describe('The Hebrew translation of the word.'),
  category: z.string().describe('The category of the word (e.g., verb, animal).'),
});

// Define the input schema for the sentence generation flow.
const GenerateMistakeSentencesInputSchema = z.object({
  mistakeWords: z.array(MistakeWordSchema).describe('A list of words the user has struggled with, including their English and Hebrew translations and categories.'),
});
export type GenerateMistakeSentencesInput = z.infer<typeof GenerateMistakeSentencesInputSchema>;

// Define the output schema for the sentence generation flow.
const GenerateMistakeSentencesOutputSchema = z.object({
  sentences: z.array(z.string()).describe('An array of unique and coherent practice sentences, each incorporating multiple provided words.'),
});
export type GenerateMistakeSentencesOutput = z.infer<typeof GenerateMistakeSentencesOutputSchema>;

// Define the prompt for generating practice sentences.
const generateMistakeSentencesPrompt = ai.definePrompt({
  name: 'generateMistakeSentencesPrompt',
  input: {schema: GenerateMistakeSentencesInputSchema},
  output: {schema: GenerateMistakeSentencesOutputSchema},
  prompt: `You are an expert English tutor. Your task is to help a student practice words they struggle with.
Given a list of words, create 3-5 unique and coherent English sentences. Each sentence must incorporate at least two of the provided words.
Focus on creating natural-sounding sentences that provide new contexts for these words. Do not translate the words, just use them in English sentences.
The output should be a JSON object with a 'sentences' key containing an array of strings.

Words to incorporate:
{{#each mistakeWords}}
- English: {{{english}}}, Hebrew: {{{hebrew}}}, Category: {{{category}}}
{{/each}}`,
});

// Define the Genkit flow for generating mistake-based sentences.
const generateMistakeSentencesFlow = ai.defineFlow(
  {
    name: 'generateMistakeSentencesFlow',
    inputSchema: GenerateMistakeSentencesInputSchema,
    outputSchema: GenerateMistakeSentencesOutputSchema,
  },
  async (input) => {
    // Call the prompt to generate sentences based on the input mistake words.
    const {output} = await generateMistakeSentencesPrompt(input);
    if (!output) {
        throw new Error('Failed to generate sentences.');
    }
    return output;
  }
);

/**
 * Generates personalized practice sentences by analyzing a list of words the user has struggled with.
 * Each generated sentence will incorporate multiple of these 'mistake' words in new contexts.
 * @param input An object containing an array of words from the user's mistakes bank.
 * @returns A Promise that resolves to an object containing an array of generated sentences.
 */
export async function generateMistakeSentences(
  input: GenerateMistakeSentencesInput
): Promise<GenerateMistakeSentencesOutput> {
  return generateMistakeSentencesFlow(input);
}
