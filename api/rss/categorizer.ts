// Category auto-tagging system for RSS feed items
// Uses keyword matching and domain-based categorization

import { readFileSync } from "fs";
import { join } from "path";

export interface CategoryKeywords {
  keywords: string[];
  domains: string[];
  weight: number;
}

export interface CategoryConfig {
  version: string;
  lastUpdated: string;
  categories: Record<string, CategoryKeywords>;
  multiCategoryRules: Record<string, any>;
  domainPriority: {
    description: string;
    enabled: boolean;
    minimumConfidence: number;
  };
  scoring: {
    titleWeight: number;
    descriptionWeight: number;
    domainWeight: number;
    minimumConfidence: number;
    multiCategoryThreshold: number;
  };
}

export interface CategoryScore {
  category: string;
  score: number;
  confidence: number;
  matchedKeywords: string[];
  source: "keywords" | "domain" | "hybrid";
}

export interface CategorizationResult {
  primaryCategory: string;
  secondaryCategory?: string;
  confidence: number;
  scores: CategoryScore[];
  requiresManualReview: boolean;
}

let cachedConfig: CategoryConfig | null = null;

/**
 * Load category keywords configuration
 */
export function loadCategoryConfig(): CategoryConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = join(process.cwd(), "data", "category-keywords.json");
    const configData = readFileSync(configPath, "utf-8");
    cachedConfig = JSON.parse(configData);
    return cachedConfig!;
  } catch (error) {
    console.error("Failed to load category keywords config:", error);
    throw new Error("Category configuration not found");
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Normalize text for keyword matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Count keyword matches in text
 */
function countKeywordMatches(
  text: string,
  keywords: string[],
): {
  count: number;
  matched: string[];
} {
  const normalizedText = normalizeText(text);
  const matched: string[] = [];
  let count = 0;

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword);
    // Use word boundary matching for single words, substring for phrases
    const isPhrase = keyword.includes(" ");

    if (isPhrase) {
      if (normalizedText.includes(normalizedKeyword)) {
        matched.push(keyword);
        count++;
      }
    } else {
      const regex = new RegExp(`\\b${normalizedKeyword}\\b`, "g");
      const matches = normalizedText.match(regex);
      if (matches) {
        matched.push(keyword);
        count += matches.length;
      }
    }
  }

  return { count, matched };
}

/**
 * Check if domain matches any category domains
 * Supports both domain-only and domain+path matching
 */
function checkDomainMatch(
  url: string,
  config: CategoryConfig,
): {
  category: string | null;
  confidence: number;
} {
  if (!url) {
    return { category: null, confidence: 0 };
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, "");
    const fullPath = domain + urlObj.pathname;

    for (const [categoryName, categoryData] of Object.entries(
      config.categories,
    )) {
      for (const categoryDomain of categoryData.domains) {
        // Check if categoryDomain includes a path
        if (categoryDomain.includes("/")) {
          // Path-based matching: check if URL starts with the pattern
          const normalizedPattern = categoryDomain.replace(/^www\./, "");
          if (fullPath.startsWith(normalizedPattern)) {
            return {
              category: categoryName,
              confidence: config.domainPriority.minimumConfidence,
            };
          }
        } else {
          // Domain-only matching
          if (
            domain === categoryDomain ||
            domain.endsWith(`.${categoryDomain}`)
          ) {
            return {
              category: categoryName,
              confidence: config.domainPriority.minimumConfidence,
            };
          }
        }
      }
    }
  } catch {
    // If URL parsing fails, fallback to simple domain extraction
    const domain = extractDomain(url);
    if (!domain) {
      return { category: null, confidence: 0 };
    }

    for (const [categoryName, categoryData] of Object.entries(
      config.categories,
    )) {
      for (const categoryDomain of categoryData.domains) {
        if (!categoryDomain.includes("/")) {
          if (
            domain === categoryDomain ||
            domain.endsWith(`.${categoryDomain}`)
          ) {
            return {
              category: categoryName,
              confidence: config.domainPriority.minimumConfidence,
            };
          }
        }
      }
    }
  }

  return { category: null, confidence: 0 };
}

/**
 * Calculate category scores based on keyword matching
 */
function calculateKeywordScores(
  title: string,
  description: string,
  config: CategoryConfig,
): CategoryScore[] {
  const scores: CategoryScore[] = [];
  const { titleWeight, descriptionWeight } = config.scoring;

  for (const [categoryName, categoryData] of Object.entries(
    config.categories,
  )) {
    const titleMatches = countKeywordMatches(title, categoryData.keywords);
    const descMatches = countKeywordMatches(description, categoryData.keywords);

    // Calculate weighted score
    const titleScore = titleMatches.count * titleWeight;
    const descScore = descMatches.count * descriptionWeight;
    const totalScore = (titleScore + descScore) * categoryData.weight;

    // Calculate confidence (normalize by total keywords)
    const totalKeywords = categoryData.keywords.length;
    const matchedKeywordCount = new Set([
      ...titleMatches.matched,
      ...descMatches.matched,
    ]).size;
    const confidence = Math.min(matchedKeywordCount / totalKeywords, 1.0);

    if (totalScore > 0) {
      scores.push({
        category: categoryName,
        score: totalScore,
        confidence,
        matchedKeywords: [
          ...new Set([...titleMatches.matched, ...descMatches.matched]),
        ],
        source: "keywords",
      });
    }
  }

  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Categorize content based on title, description, and URL
 */
export function categorizeContent(
  title: string,
  description: string = "",
  url: string = "",
): CategorizationResult {
  const config = loadCategoryConfig();

  // Step 1: Check for domain-based categorization
  const domainMatch = checkDomainMatch(url, config);
  if (
    config.domainPriority.enabled &&
    domainMatch.category &&
    domainMatch.confidence >= config.domainPriority.minimumConfidence
  ) {
    return {
      primaryCategory: domainMatch.category,
      confidence: domainMatch.confidence,
      scores: [
        {
          category: domainMatch.category,
          score: 100,
          confidence: domainMatch.confidence,
          matchedKeywords: [],
          source: "domain",
        },
      ],
      requiresManualReview: false,
    };
  }

  // Step 2: Keyword-based scoring
  const keywordScores = calculateKeywordScores(title, description, config);

  if (keywordScores.length === 0) {
    return {
      primaryCategory: "news", // Default fallback
      confidence: 0.1,
      scores: [],
      requiresManualReview: true,
    };
  }

  // Step 3: Determine primary and secondary categories
  const primaryScore = keywordScores[0];
  const secondaryScore = keywordScores.length > 1 ? keywordScores[1] : null;

  // Check if we should assign a secondary category
  const hasSecondaryCategory =
    secondaryScore &&
    secondaryScore.confidence >= config.scoring.multiCategoryThreshold &&
    secondaryScore.score >= primaryScore.score * 0.5;

  // Determine if manual review is needed
  const requiresManualReview =
    primaryScore.confidence < config.scoring.minimumConfidence ||
    (hasSecondaryCategory &&
      Math.abs(primaryScore.score - secondaryScore!.score) <
        primaryScore.score * 0.2);

  return {
    primaryCategory: primaryScore.category,
    secondaryCategory: hasSecondaryCategory
      ? secondaryScore!.category
      : undefined,
    confidence: primaryScore.confidence,
    scores: keywordScores,
    requiresManualReview: requiresManualReview || false,
  };
}

/**
 * Batch categorize multiple items
 */
export function categorizeItems(
  items: Array<{ title: string; description?: string; url?: string }>,
): CategorizationResult[] {
  return items.map((item) =>
    categorizeContent(item.title, item.description || "", item.url || ""),
  );
}

/**
 * Override category manually
 */
export function overrideCategory(
  originalResult: CategorizationResult,
  newCategory: string,
  reason?: string,
): CategorizationResult {
  return {
    ...originalResult,
    primaryCategory: newCategory,
    confidence: 1.0,
    requiresManualReview: false,
    // Optionally store override reason in metadata
  };
}

/**
 * Get category statistics from results
 */
export function getCategoryStats(results: CategorizationResult[]): {
  categories: Record<string, number>;
  averageConfidence: number;
  requiresReview: number;
  multiCategory: number;
} {
  const categories: Record<string, number> = {};
  let totalConfidence = 0;
  let requiresReview = 0;
  let multiCategory = 0;

  for (const result of results) {
    categories[result.primaryCategory] =
      (categories[result.primaryCategory] || 0) + 1;
    totalConfidence += result.confidence;

    if (result.requiresManualReview) {
      requiresReview++;
    }

    if (result.secondaryCategory) {
      multiCategory++;
    }
  }

  return {
    categories,
    averageConfidence:
      results.length > 0 ? totalConfidence / results.length : 0,
    requiresReview,
    multiCategory,
  };
}

/**
 * Test categorizer accuracy with labeled test data
 */
export function testAccuracy(
  testData: Array<{
    title: string;
    description: string;
    url: string;
    expectedCategory: string;
  }>,
): {
  accuracy: number;
  correct: number;
  total: number;
  errors: Array<{ item: any; expected: string; actual: string }>;
} {
  let correct = 0;
  const errors: Array<{ item: any; expected: string; actual: string }> = [];

  for (const testItem of testData) {
    const result = categorizeContent(
      testItem.title,
      testItem.description,
      testItem.url,
    );

    if (result.primaryCategory === testItem.expectedCategory) {
      correct++;
    } else {
      errors.push({
        item: testItem,
        expected: testItem.expectedCategory,
        actual: result.primaryCategory,
      });
    }
  }

  return {
    accuracy: testData.length > 0 ? correct / testData.length : 0,
    correct,
    total: testData.length,
    errors,
  };
}
