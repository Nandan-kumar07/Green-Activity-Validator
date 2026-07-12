import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

export type ClassificationResult = {
  isValid: boolean;
  confidence: number;
  predictedLabel: string;
  reasoning: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  tree_planting: "Tree Planting",
  waste_cleaning: "Waste Cleaning",
  recycling: "Recycling",
  composting: "Composting",
  energy_saving: "Energy Saving",
};

export async function classifyActivityImage(
  imageBase64: string,
  mimeType: string,
  category: string
): Promise<ClassificationResult> {
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are an AI classifier for sustainability activities. Your job is to verify whether an uploaded image actually shows a ${categoryLabel} activity. 
          
Analyze the image carefully and respond with a JSON object with these exact fields:
- isValid (boolean): true if the image clearly shows ${categoryLabel} activity
- confidence (number between 0 and 1): how confident you are in your classification
- predictedLabel (string): what you see in the image (e.g., "Person planting a tree", "Cleaning up plastic waste", etc.)
- reasoning (string): brief 1-2 sentence explanation

Be strict but fair. The image should actually show environmental sustainability work.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please verify whether this image shows a legitimate "${categoryLabel}" sustainability activity. Return your analysis as JSON.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "{}";

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      isValid: Boolean(parsed.isValid),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      predictedLabel: String(parsed.predictedLabel || "Unknown activity"),
      reasoning: String(parsed.reasoning || ""),
    };
  } catch (err) {
    logger.error({ err, category }, "Image classification failed");
    // Return a conservative fallback
    return {
      isValid: false,
      confidence: 0.1,
      predictedLabel: "Classification failed",
      reasoning: "Unable to analyze the image at this time.",
    };
  }
}
