import { ToolDecorator as Tool, ExecutionContext, z } from '@nitrostack/core';

/**
 * Search Grounding Tools
 * 
 * Provides tools to search for live, current information about in-demand skills
 * using Brave Search API or Tavily API (fallback).
 * 
 * Assumption: BRAVE_API_KEY or TAVILY_API_KEY is set in .env.local
 */

export class SearchGroundingTools {
  /**
   * Search for in-demand skills using Brave Search API
   * Falls back to Tavily if Brave key is not available
   */
  // @ts-ignore - JSON.parse returns unknown, but we ensure it's JSON-serializable
  @Tool({
    name: 'search_in_demand_skills',
    description: 'Search for current, live information about in-demand skills for a given role',
    inputSchema: z.object({
      role: z.string().describe('Job role or title to search for (e.g., "backend developer", "data scientist")'),
      year: z.string().optional().describe('Year to search for (e.g., "2026"). Defaults to current year.')
    })
  })
  async searchInDemandSkills(input: any, ctx: ExecutionContext) {
    const year = input.year || new Date().getFullYear().toString();
    const query = `most in-demand skills for ${input.role} jobs ${year}`;

    try {
      // Try Brave Search first
      const braveKey = process.env.BRAVE_API_KEY;
      if (braveKey) {
        return await this.searchBrave(query, braveKey, ctx);
      }

      // Fallback to Tavily
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (tavilyKey) {
        return await this.searchTavily(query, tavilyKey, ctx);
      }

      // No API key available
      ctx.logger.warn('No search API key found (BRAVE_API_KEY or TAVILY_API_KEY)');
      return JSON.parse(JSON.stringify({
        query,
        results: [],
        error: 'No search API key configured. Set BRAVE_API_KEY or TAVILY_API_KEY in .env.local'
      })) as any;
    } catch (error) {
      ctx.logger.error('Search failed', { error, query });
      return JSON.parse(JSON.stringify({
        query,
        results: [],
        error: `Search failed: ${error instanceof Error ? error.message : String(error)}`
      })) as any;
    }
  }

  /**
   * Search using Brave Search API
   * Assumption: Brave Search API endpoint is https://api.search.brave.com/res/v1/web/search
   */
  private async searchBrave(query: string, apiKey: string, ctx: ExecutionContext) {
    try {
      // Construct URL with query params
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.append('q', query);
      url.searchParams.append('count', '5');

      const braveResponse = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey
        }
      });

      if (!braveResponse.ok) {
        throw new Error(`Brave Search API error: ${braveResponse.status} ${braveResponse.statusText}`);
      }

      const data = (await braveResponse.json()) as any;
      const webArray: any[] = data.web || [];
      const results = webArray.map((item: any) => ({
        title: String(item.title || ''),
        snippet: String(item.description || ''),
        url: String(item.url || '')
      }));

      return JSON.parse(JSON.stringify({ query, results, error: '' })) as any;
    } catch (error) {
      ctx.logger.error('Brave Search failed', { error, query });
      throw error;
    }
  }

  /**
   * Search using Tavily API (fallback)
   * Assumption: Tavily API endpoint is https://api.tavily.com/search
   */
  private async searchTavily(query: string, apiKey: string, ctx: ExecutionContext) {
    try {
      const tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          max_results: 5,
          include_answer: false
        })
      });

      if (!tavilyResponse.ok) {
        throw new Error(`Tavily API error: ${tavilyResponse.status} ${tavilyResponse.statusText}`);
      }

      const data = (await tavilyResponse.json()) as any;
      const tavilyArray: any[] = data.results || [];
      const results = tavilyArray.map((item: any) => ({
        title: String(item.title || ''),
        snippet: String(item.snippet || ''),
        url: String(item.url || '')
      }));

      return JSON.parse(JSON.stringify({ query, results, error: '' })) as any;
    } catch (error) {
      ctx.logger.error('Tavily Search failed', { error, query });
      throw error;
    }
  }
}
