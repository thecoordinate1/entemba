
'use server';
/**
 * @fileOverview An AI flow to calculate delivery vehicle capacity for a product.
 *
 * - calculateDeliveryCapacity - A function that handles the capacity calculation.
 * - CalculateCapacityInput - The input type for the calculateDeliveryCapacity function.
 * - CalculateCapacityOutput - The return type for the calculateDeliveryCapacity function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define standard vehicle capacities. These can be moved to a config file later.
const VEHICLE_CAPACITIES = {
  bike: {
    name: 'Delivery Bike Box',
    dimensions_cm: { length: 50, width: 40, height: 40 },
    max_weight_kg: 15,
  },
  car: {
    name: 'Standard Car Trunk',
    dimensions_cm: { length: 120, width: 100, height: 50 },
    max_weight_kg: 100,
  },
};

const CalculateCapacityInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDimensions: z
    .object({
      length: z.number().describe('The length of the product in cm.'),
      width: z.number().describe('The width of the product in cm.'),
      height: z.number().describe('The height of the product in cm.'),
    })
    .describe('The dimensions of a single product unit.'),
  productWeight: z.number().describe('The weight of a single product unit in kg.'),
  vehicleType: z.enum(['bike', 'car']).describe("The type of delivery vehicle."),
});
export type CalculateCapacityInput = z.infer<typeof CalculateCapacityInputSchema>;

const CalculateCapacityOutputSchema = z.object({
  maxQuantity: z
    .number()
    .describe('The maximum integer quantity of the product that can fit in the vehicle.'),
  reasoning: z
    .string()
    .describe(
      'A brief explanation of the calculation, mentioning the limiting factor (e.g., volume or weight).'
    ),
});
export type CalculateCapacityOutput = z.infer<typeof CalculateCapacityOutputSchema>;

// Exported wrapper function to be called from the UI
export async function calculateDeliveryCapacity(
  input: CalculateCapacityInput
): Promise<CalculateCapacityOutput> {
  return calculateDeliveryCapacityFlow(input);
}

const calculateDeliveryCapacityFlow = ai.defineFlow(
  {
    name: 'calculateDeliveryCapacityFlow',
    inputSchema: CalculateCapacityInputSchema,
    outputSchema: CalculateCapacityOutputSchema,
  },
  async (input) => {
    const vehicle = VEHICLE_CAPACITIES[input.vehicleType];

    const capacityPrompt = ai.definePrompt({
        name: 'calculateDeliveryCapacityPrompt_revised',
        output: { schema: CalculateCapacityOutputSchema },
        prompt: `You are a logistics and packaging expert. Your task is to calculate how many units of a specific product can fit into a delivery vehicle.

You must consider both the volume and the total weight. The final quantity must respect BOTH constraints.

**Vehicle Details:**
- Vehicle Type: ${input.vehicleType}
- Vehicle Name: ${vehicle.name}
- Max Load (cm): ${vehicle.dimensions_cm.length}L x ${vehicle.dimensions_cm.width}W x ${vehicle.dimensions_cm.height}H
- Max Weight Capacity (kg): ${vehicle.max_weight_kg}

**Product Details:**
- Product Name: ${input.productName}
- Product Dimensions (cm): ${input.productDimensions.length}L x ${input.productDimensions.width}W x ${input.productDimensions.height}H
- Product Weight (kg): ${input.productWeight}

**Instructions:**
1.  Calculate the maximum number of units that can fit based on volume. Assume optimal packing, but be realistic. You can rotate the items to fit.
2.  Calculate the maximum number of units that can fit based on the vehicle's weight capacity.
3.  The final 'maxQuantity' should be the SMALLER of the two calculated quantities (from volume and weight). It must be an integer.
4.  In the 'reasoning' field, briefly explain your result. State the maximums for both volume and weight, and specify which one was the limiting factor.

Example reasoning: "Volume allows for 50 units, but the 15kg weight limit only allows for 25 units. Therefore, weight is the limiting factor."
`
    });

    const { output } = await capacityPrompt({});
    return output!;
  }
);
