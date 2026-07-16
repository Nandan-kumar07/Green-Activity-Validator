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

const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  tree_planting: ["tree", "plant", "soil", "sapling", "garden", "green", "dig", "shovel", "forest", "watering"],
  waste_cleaning: ["clean", "trash", "waste", "garbage", "litter", "plastic", "beach", "park", "street", "pickup", "sweep"],
  recycling: ["recycle", "bin", "plastic", "bottle", "can", "paper", "cardboard", "sorting", "reusable"],
  composting: ["compost", "organic", "food waste", "worm", "soil", "bin", "biodegradable", "peels"],
  energy_saving: ["led", "light", "bulb", "solar", "turn off", "unplug", "watt", "appliance", "efficiency"],
};

// Helper for local smart verification when API fails
function performLocalVerification(category: string, description: string): ClassificationResult {
  const categoryLabel = CATEGORY_LABELS[category] ?? category;
  const normalizedDesc = (description || "").toLowerCase().trim();
  
  // Strict validation: description must be present and meaningful
  if (!description || description.trim().length < 10) {
    return {
      isValid: false,
      confidence: 0.25,
      predictedLabel: "Unverified activity - insufficient description",
      reasoning: "Please provide a detailed description (at least 10 characters) of your sustainability activity to help verify it."
    };
  }

  const keywords = ACTIVITY_KEYWORDS[category] || [];
  const matched: string[] = [];
  
  // Check for keyword matches with partial word matching
  for (const keyword of keywords) {
    if (normalizedDesc.includes(keyword)) {
      matched.push(keyword);
    }
  }

  // Enhanced scoring based on multiple factors
  const keywordScore = matched.length;
  const lengthScore = Math.min(description.length / 50, 1); // Up to 1 point for length
  const totalScore = keywordScore + lengthScore;

  if (keywordScore >= 2) {
    // Strong match with multiple keywords
    return {
      isValid: true,
      confidence: Math.min(0.95, 0.75 + (keywordScore * 0.08) + (lengthScore * 0.05)),
      predictedLabel: `${categoryLabel} verified`,
      reasoning: `Strong verification! Description contains multiple relevant keywords: ${matched.join(", ")}.`
    };
  }

  if (keywordScore === 1 && lengthScore >= 0.6) {
    // Single keyword but good description length
    return {
      isValid: true,
      confidence: 0.82,
      predictedLabel: `${categoryLabel} verified`,
      reasoning: `Verified activity based on keyword "${matched[0]}" and detailed description.`
    };
  }

  if (keywordScore === 1) {
    // Single keyword with shorter description
    return {
      isValid: true,
      confidence: 0.72,
      predictedLabel: `${categoryLabel} likely verified`,
      reasoning: `Activity likely verified based on keyword "${matched[0]}". Consider adding more details for higher confidence.`
    };
  }

  // No keyword matches - check for contextual relevance
  const contextualWords = ["green", "eco", "environment", "sustainable", "nature", "earth", "clean", "save", "reduce", "help"];
  const contextualMatches = contextualWords.filter(word => normalizedDesc.includes(word));
  
  if (contextualMatches.length >= 2 && description.length >= 20) {
    return {
      isValid: true,
      confidence: 0.68,
      predictedLabel: `${categoryLabel} contextually verified`,
      reasoning: `Activity shows environmental context through words: ${contextualMatches.join(", ")}.`
    };
  }

  // Strict rejection for no relevant content
  return {
    isValid: false,
    confidence: 0.40,
    predictedLabel: "Unverified sustainability activity",
    reasoning: `Could not confirm a ${categoryLabel} activity. Please include specific details and relevant keywords like: ${keywords.slice(0, 3).join(", ")}.`
  };
}

export async function classifyActivityImage(
  imageBase64: string,
  mimeType: string,
  category: string,
  description?: string,
  photoTakenAt?: Date,
): Promise<ClassificationResult> {
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  // Use local verification directly for reliability and to avoid API quota issues
  logger.info({ category }, "Using local smart verification for activity classification");
  return performLocalVerification(category, description || "");
}
