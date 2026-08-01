import { Module } from '@nitrostack/core';
import { SearchGroundingTools } from './search-grounding.tools.js';

@Module({
  name: 'search-grounding',
  description: 'Live search grounding for roadmap generation using Brave Search or Tavily',
  controllers: [SearchGroundingTools]
})
export class SearchGroundingModule {}
