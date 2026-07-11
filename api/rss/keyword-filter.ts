// Keyword-based content filtering for Ethereum relevance
// Implements Method 3 Phase 2: Keyword Heuristics for Tier 2 sources

import * as fs from "fs";
import * as path from "path";

// Types
export interface KeywordConfig {
  version: string;
  description: string;
  lastUpdated: string;
  config: {
    thresholds: {
      autoApprove: number;
      autoReject: number;
      reviewQueue: {
        min: number;
        max: number;
      };
    };
    contextWeights: {
      title: number;
      snippet: number;
      url: number;
    };
    proximityBonus: {
      enabled: boolean;
      multiplier: number;
      maxDistance: number;
    };
  };
  keywords: Record<
    string,
    {
      weight: number;
      description: string;
      terms: string[];
    }
  >;
  contextualRules: Record<
    string,
    {
      description: string;
      pattern: string;
      weightModifier: number;
    }
  >;
  exclusionPatterns: {
    description: string;
    patterns: string[];
  };
}

export type FilterDecision = "approve" | "reject" | "review";

export interface FilterResult {
  score: number;
  decision: FilterDecision;
  details: {
    keywordMatches: Array<{
      term: string;
      category: string;
      weight: number;
      context: "title" | "snippet" | "url";
      frequency: number;
    }>;
    proximityBonuses: number;
    contextualRuleMatches: Array<{
      rule: string;
      modifier: number;
    }>;
    exclusionMatches: string[];
    breakdown: {
      titleScore: number;
      snippetScore: number;
      urlScore: number;
      totalKeywordScore: number;
      finalScore: number;
    };
  };
  reasoning: string;
}

export interface FilterInput {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Keyword Filter Class
 * Implements intelligent keyword-based filtering for Ethereum content relevance
 */
export class KeywordFilter {
  private config: KeywordConfig;
  private compiledPatterns: Map<string, RegExp>;
  private exclusionRegex: RegExp[];

  constructor(configPath?: string) {
    this.config = this.loadConfig(configPath);
    this.compiledPatterns = new Map();
    this.exclusionRegex = [];
    this.compilePatterns();
  }

  /**
   * Load keyword configuration from JSON file
   */
  private loadConfig(configPath?: string): KeywordConfig {
    try {
      const defaultPath = path.join(
        process.cwd(),
        "data",
        "keyword-filter-config.json",
      );
      const filePath = configPath || defaultPath;
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to load keyword config:", error);
      throw new Error(`Cannot load keyword filter configuration: ${error}`);
    }
  }

  /**
   * Compile regex patterns for performance
   */
  private compilePatterns(): void {
    // Compile contextual rules
    for (const [ruleName, rule] of Object.entries(
      this.config.contextualRules,
    )) {
      try {
        this.compiledPatterns.set(ruleName, new RegExp(rule.pattern, "i"));
      } catch (error) {
        console.warn(`Failed to compile pattern for rule ${ruleName}:`, error);
      }
    }

    // Compile exclusion patterns
    for (const pattern of this.config.exclusionPatterns.patterns) {
      try {
        this.exclusionRegex.push(new RegExp(pattern, "i"));
      } catch (error) {
        console.warn(`Failed to compile exclusion pattern ${pattern}:`, error);
      }
    }
  }

  /**
   * Main filtering function
   */
  public filter(input: FilterInput): FilterResult {
    const details = {
      keywordMatches: [] as Array<{
        term: string;
        category: string;
        weight: number;
        context: "title" | "snippet" | "url";
        frequency: number;
      }>,
      proximityBonuses: 0,
      contextualRuleMatches: [] as Array<{
        rule: string;
        modifier: number;
      }>,
      exclusionMatches: [] as string[],
      breakdown: {
        titleScore: 0,
        snippetScore: 0,
        urlScore: 0,
        totalKeywordScore: 0,
        finalScore: 0,
      },
    };

    // Check for exclusion patterns first
    const exclusions = this.checkExclusionPatterns(input);
    if (exclusions.length > 0) {
      details.exclusionMatches = exclusions;
      return {
        score: -1.0,
        decision: "reject",
        details,
        reasoning: `Matched exclusion patterns: ${exclusions.join(", ")}`,
      };
    }

    // Calculate keyword scores for each context
    const titleMatches = this.findKeywordMatches(input.title, "title");
    const snippetMatches = this.findKeywordMatches(input.snippet, "snippet");
    const urlMatches = this.findKeywordMatches(input.url, "url");

    // Combine all matches
    details.keywordMatches = [
      ...titleMatches,
      ...snippetMatches,
      ...urlMatches,
    ];

    // Calculate context-weighted scores
    details.breakdown.titleScore = this.calculateContextScore(
      titleMatches,
      "title",
    );
    details.breakdown.snippetScore = this.calculateContextScore(
      snippetMatches,
      "snippet",
    );
    details.breakdown.urlScore = this.calculateContextScore(urlMatches, "url");
    details.breakdown.totalKeywordScore =
      details.breakdown.titleScore +
      details.breakdown.snippetScore +
      details.breakdown.urlScore;

    // Calculate proximity bonuses
    if (this.config.config.proximityBonus.enabled) {
      details.proximityBonuses = this.calculateProximityBonuses(
        input,
        details.keywordMatches,
      );
    }

    // Apply contextual rules
    const contextualMatches = this.applyContextualRules(input);
    details.contextualRuleMatches = contextualMatches;
    const contextualBonus = contextualMatches.reduce(
      (sum, match) => sum + match.modifier,
      0,
    );

    // Calculate final score
    details.breakdown.finalScore =
      details.breakdown.totalKeywordScore +
      details.proximityBonuses +
      contextualBonus;

    // Make decision
    const decision = this.makeDecision(details.breakdown.finalScore);
    const reasoning = this.generateReasoning(details, decision);

    return {
      score: details.breakdown.finalScore,
      decision,
      details,
      reasoning,
    };
  }

  /**
   * Check for exclusion patterns
   */
  private checkExclusionPatterns(input: FilterInput): string[] {
    const matches: string[] = [];
    const text = `${input.title} ${input.snippet}`.toLowerCase();

    for (const regex of this.exclusionRegex) {
      if (regex.test(text)) {
        matches.push(regex.source);
      }
    }

    return matches;
  }

  /**
   * Find keyword matches in text
   */
  private findKeywordMatches(
    text: string,
    context: "title" | "snippet" | "url",
  ): Array<{
    term: string;
    category: string;
    weight: number;
    context: "title" | "snippet" | "url";
    frequency: number;
  }> {
    const matches = [];
    const lowerText = text.toLowerCase();

    for (const [category, categoryData] of Object.entries(
      this.config.keywords,
    )) {
      for (const term of categoryData.terms) {
        const frequency = this.countOccurrences(lowerText, term.toLowerCase());
        if (frequency > 0) {
          matches.push({
            term,
            category,
            weight: categoryData.weight,
            context,
            frequency,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Count occurrences of a term in text
   */
  private countOccurrences(text: string, term: string): number {
    if (term.endsWith("-")) {
      // Handle prefix matches like "eip-" or "erc-"
      const regex = new RegExp(`\\b${term.replace("-", "-\\d+")}`, "g");
      return (text.match(regex) || []).length;
    }

    const regex = new RegExp(
      `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "g",
    );
    return (text.match(regex) || []).length;
  }

  /**
   * Calculate context-weighted score
   */
  private calculateContextScore(
    matches: Array<{
      term: string;
      category: string;
      weight: number;
      context: "title" | "snippet" | "url";
      frequency: number;
    }>,
    context: "title" | "snippet" | "url",
  ): number {
    const contextWeight = this.config.config.contextWeights[context];

    return matches.reduce((score, match) => {
      return (
        score + match.weight * contextWeight * Math.min(match.frequency, 3)
      ); // Cap frequency impact
    }, 0);
  }

  /**
   * Calculate proximity bonuses for keywords appearing near each other
   */
  private calculateProximityBonuses(
    input: FilterInput,
    matches: Array<{
      term: string;
      category: string;
      weight: number;
      context: "title" | "snippet" | "url";
      frequency: number;
    }>,
  ): number {
    if (!this.config.config.proximityBonus.enabled || matches.length < 2) {
      return 0;
    }

    let totalBonus = 0;
    const text = `${input.title} ${input.snippet}`.toLowerCase();
    const { multiplier, maxDistance } = this.config.config.proximityBonus;

    // Find positions of all positive-weight keywords
    const positiveMatches = matches.filter((m) => m.weight > 0);

    for (let i = 0; i < positiveMatches.length; i++) {
      for (let j = i + 1; j < positiveMatches.length; j++) {
        const term1 = positiveMatches[i].term.toLowerCase();
        const term2 = positiveMatches[j].term.toLowerCase();

        const distance = this.getKeywordDistance(text, term1, term2);
        if (distance <= maxDistance) {
          const bonus =
            (positiveMatches[i].weight + positiveMatches[j].weight) *
            multiplier *
            (1 - distance / maxDistance);
          totalBonus += bonus;
        }
      }
    }

    return Math.min(totalBonus, 0.5); // Cap proximity bonus
  }

  /**
   * Get distance between two keywords in text
   */
  private getKeywordDistance(
    text: string,
    term1: string,
    term2: string,
  ): number {
    const words = text.split(/\s+/);
    const indices1 = words
      .map((word, idx) => (word.includes(term1) ? idx : -1))
      .filter((idx) => idx >= 0);
    const indices2 = words
      .map((word, idx) => (word.includes(term2) ? idx : -1))
      .filter((idx) => idx >= 0);

    let minDistance = Infinity;
    for (const idx1 of indices1) {
      for (const idx2 of indices2) {
        minDistance = Math.min(minDistance, Math.abs(idx1 - idx2));
      }
    }

    return minDistance === Infinity
      ? this.config.config.proximityBonus.maxDistance + 1
      : minDistance;
  }

  /**
   * Apply contextual rules
   */
  private applyContextualRules(input: FilterInput): Array<{
    rule: string;
    modifier: number;
  }> {
    const matches = [];
    const text = `${input.title} ${input.snippet}`.toLowerCase();

    for (const [ruleName, rule] of Object.entries(
      this.config.contextualRules,
    )) {
      const pattern = this.compiledPatterns.get(ruleName);
      if (pattern && pattern.test(text)) {
        matches.push({
          rule: ruleName,
          modifier: rule.weightModifier,
        });
      }
    }

    return matches;
  }

  /**
   * Make filtering decision based on score
   */
  private makeDecision(score: number): "approve" | "reject" | "review" {
    if (score >= this.config.config.thresholds.autoApprove) {
      return "approve";
    }
    if (score <= this.config.config.thresholds.autoReject) {
      return "reject";
    }
    return "review";
  }

  /**
   * Generate human-readable reasoning
   */
  private generateReasoning(
    details: any,
    decision: "approve" | "reject" | "review",
  ): string {
    const {
      breakdown,
      keywordMatches,
      exclusionMatches,
      contextualRuleMatches,
    } = details;

    if (exclusionMatches.length > 0) {
      return `Content rejected due to exclusion patterns: ${exclusionMatches.join(", ")}`;
    }

    const positiveMatches = keywordMatches.filter((m) => m.weight > 0);
    const negativeMatches = keywordMatches.filter((m) => m.weight < 0);

    let reasoning = `Score: ${breakdown.finalScore.toFixed(3)} `;

    if (positiveMatches.length > 0) {
      const topPositive = positiveMatches
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map((m) => m.term);
      reasoning += `| Positive: ${topPositive.join(", ")} `;
    }

    if (negativeMatches.length > 0) {
      const topNegative = negativeMatches
        .sort((a, b) => a.weight - b.weight)
        .slice(0, 2)
        .map((m) => m.term);
      reasoning += `| Negative: ${topNegative.join(", ")} `;
    }

    if (contextualRuleMatches.length > 0) {
      reasoning += `| Rules: ${contextualRuleMatches.map((r) => r.rule).join(", ")} `;
    }

    reasoning += `| Decision: ${decision.toUpperCase()}`;

    return reasoning;
  }

  /**
   * Get filter statistics
   */
  public getStats(): {
    version: string;
    keywordCategories: number;
    totalKeywords: number;
    contextualRules: number;
    exclusionPatterns: number;
    thresholds: any;
  } {
    const totalKeywords = Object.values(this.config.keywords).reduce(
      (sum, category) => sum + category.terms.length,
      0,
    );

    return {
      version: this.config.version,
      keywordCategories: Object.keys(this.config.keywords).length,
      totalKeywords,
      contextualRules: Object.keys(this.config.contextualRules).length,
      exclusionPatterns: this.config.exclusionPatterns.patterns.length,
      thresholds: this.config.config.thresholds,
    };
  }

  /**
   * Test the filter with sample content
   */
  public test(
    samples: FilterInput[],
  ): Array<FilterResult & { input: FilterInput }> {
    return samples.map((input) => ({
      input,
      ...this.filter(input),
    }));
  }
}

// Export convenience function
export function createKeywordFilter(configPath?: string): KeywordFilter {
  return new KeywordFilter(configPath);
}

// Export default instance
export const defaultKeywordFilter = new KeywordFilter();
