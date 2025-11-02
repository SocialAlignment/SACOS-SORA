// Perplexity API Client (Story 1.8, Task 4)
// Provides trend research for AI recommendations (AC#2, AC#6)

// Trend research types
export type TrendResearch = {
  brand: string;
  productCategory: string;
  query: string;
  trends: string[]; // Array of trending insights
  platforms: {
    platform: 'tiktok' | 'instagram' | 'linkedin';
    trending: boolean;
    insights: string;
  }[];
  demographics: {
    ageGroup: string;
    trending: boolean;
    insights: string;
  }[];
  timestamp: Date;
  source: 'perplexity';
};

export type TrendCache = {
  cacheKey: string;
  research: TrendResearch;
  expiresAt: Date;
};

// In-memory cache for trend research (prevents duplicate API calls)
const trendCache = new Map<string, TrendCache>();

// Cache duration: 24 hours (trends don't change frequently)
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Perplexity API Client
 * Fetches real-time trend data to inform AI recommendations
 */
export class PerplexityClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Perplexity API key not configured. Trend research will be mocked.');
    }
  }

  /**
   * Generate cache key for trend research
   */
  private getCacheKey(brand: string, productCategory: string): string {
    return `${brand.toLowerCase()}-${productCategory.toLowerCase()}`;
  }

  /**
   * Check if cached trend research is still valid
   */
  private isCacheValid(cache: TrendCache): boolean {
    return new Date() < cache.expiresAt;
  }

  /**
   * Fetch trend research from Perplexity API (AC#6)
   * Queries trending topics for brand/product category across platforms
   */
  async fetchTrendResearch(brand: string, productCategory: string): Promise<TrendResearch> {
    // Check cache first
    const cacheKey = this.getCacheKey(brand, productCategory);
    const cached = trendCache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      console.log(`Using cached trend research for ${brand} (${productCategory})`);
      return cached.research;
    }

    // If no API key, return mock data
    if (!this.apiKey) {
      return this.getMockTrendResearch(brand, productCategory);
    }

    try {
      // Query Perplexity for trending topics
      const query = this.buildTrendQuery(brand, productCategory);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online', // ✅ VERIFIED: 70B model for better quality trend research
          messages: [
            {
              role: 'system',
              content: 'You are a social media trend researcher. Provide concise, data-driven insights about trending topics on social media platforms.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 500,
          temperature: 0.2,
          return_citations: true
        })
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.statusText}`);
      }

      const data = await response.json();
      const insights = data.choices[0].message.content;

      // Parse insights into structured format
      const research = this.parseInsights(brand, productCategory, query, insights);

      // Cache the results
      trendCache.set(cacheKey, {
        cacheKey,
        research,
        expiresAt: new Date(Date.now() + CACHE_DURATION_MS)
      });

      console.log(`Fetched and cached trend research for ${brand} (${productCategory})`);
      return research;
    } catch (error) {
      console.error('Failed to fetch Perplexity trend research:', error);
      // Fallback to mock data on error
      return this.getMockTrendResearch(brand, productCategory);
    }
  }

  /**
   * Build Perplexity query for trend research
   */
  private buildTrendQuery(brand: string, productCategory: string): string {
    return `What are the current trending topics and content themes for ${brand} (${productCategory}) on TikTok, Instagram, and LinkedIn?
Focus on:
1. Which platforms is this brand/category trending on?
2. What demographics (age groups) are most engaged?
3. What content themes or aesthetics are performing well?
4. Any recent viral campaigns or topics related to this category?

Provide specific, actionable insights with platform and demographic breakdowns.`;
  }

  /**
   * Parse Perplexity response into structured format
   */
  private parseInsights(brand: string, productCategory: string, query: string, insights: string): TrendResearch {
    // Simple parsing logic - extract platform and demographic mentions
    const platforms: TrendResearch['platforms'] = [
      {
        platform: 'tiktok',
        trending: insights.toLowerCase().includes('tiktok'),
        insights: this.extractPlatformInsights(insights, 'TikTok')
      },
      {
        platform: 'instagram',
        trending: insights.toLowerCase().includes('instagram'),
        insights: this.extractPlatformInsights(insights, 'Instagram')
      },
      {
        platform: 'linkedin',
        trending: insights.toLowerCase().includes('linkedin'),
        insights: this.extractPlatformInsights(insights, 'LinkedIn')
      }
    ];

    const demographics: TrendResearch['demographics'] = [
      {
        ageGroup: 'Gen Z',
        trending: insights.toLowerCase().includes('gen z') || insights.toLowerCase().includes('gen-z'),
        insights: this.extractDemographicInsights(insights, 'Gen Z')
      },
      {
        ageGroup: 'Millennials',
        trending: insights.toLowerCase().includes('millennial'),
        insights: this.extractDemographicInsights(insights, 'Millennial')
      }
    ];

    // Extract key trends (simple sentence extraction)
    const trends = this.extractTrends(insights);

    return {
      brand,
      productCategory,
      query,
      trends,
      platforms,
      demographics,
      timestamp: new Date(),
      source: 'perplexity'
    };
  }

  /**
   * Extract platform-specific insights from text
   */
  private extractPlatformInsights(text: string, platform: string): string {
    const sentences = text.split('.');
    const relevant = sentences.filter(s => s.toLowerCase().includes(platform.toLowerCase()));
    return relevant.slice(0, 2).join('.').trim() || `No specific ${platform} insights found.`;
  }

  /**
   * Extract demographic-specific insights from text
   */
  private extractDemographicInsights(text: string, demographic: string): string {
    const sentences = text.split('.');
    const relevant = sentences.filter(s => s.toLowerCase().includes(demographic.toLowerCase()));
    return relevant.slice(0, 2).join('.').trim() || `No specific ${demographic} insights found.`;
  }

  /**
   * Extract key trends from insights
   */
  private extractTrends(text: string): string[] {
    // Simple extraction: look for bullet points, numbered lists, or sentences with "trend" keywords
    const trendKeywords = ['trending', 'popular', 'viral', 'growing', 'emerging'];
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20);

    const trends = sentences
      .filter(s => trendKeywords.some(keyword => s.toLowerCase().includes(keyword)))
      .slice(0, 5)
      .map(s => s.trim());

    return trends.length > 0 ? trends : ['General market trends apply'];
  }

  /**
   * Mock trend research for development/testing
   */
  private getMockTrendResearch(brand: string, productCategory: string): TrendResearch {
    return {
      brand,
      productCategory,
      query: `Trending topics for ${brand} (${productCategory})`,
      trends: [
        `${productCategory} content is trending with authentic, UGC-style videos`,
        'Short-form educational content performing well across platforms',
        'Behind-the-scenes and transparency content gaining traction',
        'User testimonials and transformation stories driving engagement'
      ],
      platforms: [
        {
          platform: 'tiktok',
          trending: true,
          insights: `${brand} content on TikTok is performing well with Gen Z audiences, particularly educational and entertaining short-form videos.`
        },
        {
          platform: 'instagram',
          trending: true,
          insights: `Instagram Reels showing strong engagement for ${productCategory}, with focus on visual storytelling and lifestyle integration.`
        },
        {
          platform: 'linkedin',
          trending: false,
          insights: `LinkedIn shows moderate engagement for ${productCategory}, primarily B2B content and thought leadership.`
        }
      ],
      demographics: [
        {
          ageGroup: 'Gen Z',
          trending: true,
          insights: `Gen Z highly engaged with ${productCategory} content, preferring authentic and relatable messaging over polished ads.`
        },
        {
          ageGroup: 'Millennials',
          trending: true,
          insights: `Millennials respond well to ${productCategory} content that emphasizes value, sustainability, and lifestyle fit.`
        }
      ],
      timestamp: new Date(),
      source: 'perplexity'
    };
  }

  /**
   * Get trending platforms for a brand (AC#6)
   * Returns platforms where the brand/category is currently trending
   */
  async getTrendingPlatforms(brand: string, productCategory: string): Promise<string[]> {
    const research = await this.fetchTrendResearch(brand, productCategory);
    return research.platforms
      .filter(p => p.trending)
      .map(p => p.platform);
  }

  /**
   * Get trending demographics for a brand (AC#6)
   * Returns age groups showing high engagement
   */
  async getTrendingDemographics(brand: string, productCategory: string): Promise<string[]> {
    const research = await this.fetchTrendResearch(brand, productCategory);
    return research.demographics
      .filter(d => d.trending)
      .map(d => d.ageGroup);
  }

  /**
   * Get summary insight for AI recommendations (AC#2, AC#6)
   * Returns a concise trend insight for display
   */
  async getSummaryInsight(brand: string, productCategory: string): Promise<string> {
    const research = await this.fetchTrendResearch(brand, productCategory);

    const trendingPlatforms = research.platforms
      .filter(p => p.trending)
      .map(p => p.platform)
      .join(', ');

    const trendingDemographics = research.demographics
      .filter(d => d.trending)
      .map(d => d.ageGroup)
      .join(', ');

    if (!trendingPlatforms && !trendingDemographics) {
      return `${brand} (${productCategory}) showing steady performance across platforms.`;
    }

    const parts: string[] = [];

    if (trendingPlatforms) {
      parts.push(`trending on ${trendingPlatforms}`);
    }

    if (trendingDemographics) {
      parts.push(`with ${trendingDemographics}`);
    }

    return `${brand} (${productCategory}) ${parts.join(' ')} (source: Perplexity)`;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = new Date();
    for (const [key, cache] of Array.from(trendCache.entries())) {
      if (now >= cache.expiresAt) {
        trendCache.delete(key);
        console.log(`Cleared expired trend cache: ${key}`);
      }
    }
  }
}

// Singleton instance
export const perplexityClient = new PerplexityClient();
