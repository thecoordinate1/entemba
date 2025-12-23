
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateProductDescriptionInputSchema = z.object({
    productName: z.string().describe('The name of the product.'),
    category: z.string().describe('The category of the product.'),
    attributes: z.record(z.string(), z.any()).describe('Key-value pairs of product attributes (e.g., brand, color, material).'),
    keywords: z.array(z.string()).optional().describe('Optional keywords to include in the description.'),
});

export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
    shortDescription: z.string().describe('A brief, catchy summary for product listings (1-2 sentences).'),
    fullDescription: z.string().describe('A detailed and persuasive product description using the provided attributes (1-2 paragraphs).'),
});

export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(
    input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
    return generateProductDescriptionFlow(input);
}

const generateProductDescriptionFlow = ai.defineFlow(
    {
        name: 'generateProductDescriptionFlow',
        inputSchema: GenerateProductDescriptionInputSchema,
        outputSchema: GenerateProductDescriptionOutputSchema,
    },
    async (input) => {
        const descriptionPrompt = ai.definePrompt({
            name: 'generateProductDescriptionPrompt',
            output: { schema: GenerateProductDescriptionOutputSchema },
            prompt: `You are a professional e-commerce copywriter. Your task is to write compelling product descriptions that drive sales.

**Product Details:**
- **Name:** ${input.productName}
- **Category:** ${input.category}
- **Attributes:**
${Object.entries(input.attributes)
                    .filter(([_, value]) => value && value.toString().trim() !== '')
                    .map(([key, value]) => `  - ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                    .join('\n')}
${input.keywords && input.keywords.length > 0 ? `- **Keywords:** ${input.keywords.join(', ')}` : ''}

**Instructions:**
1.  **Short Description:** Write a concise and engaging summary (max 200 characters) suitable for a product card or search result. Highlight the main benefit.
2.  **Full Description:** Write a detailed, persuasive description (approx. 100-200 words).
    -   Use a professional but enthusiastic tone.
    -   Incorporate the provided attributes naturally.
    -   Focus on benefits, not just features.
    -   Use proper formatting (paragraphs).
`
        });

        const { output } = await descriptionPrompt({});
        return output!;
    }
);
