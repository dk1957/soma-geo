# Soma AI - GEO Marketing Intelligence Platform

*Brand visibility optimization and competitive intelligence platform*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/hellousehaya-2024s-projects/v0-marketing-app-dashboard)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/jclk4RGxK8e)

## Overview

Soma AI is a comprehensive GEO (Generative Engine Optimization) and marketing intelligence platform that helps brands understand their visibility across AI search engines and improve their competitive positioning.

### Key Features

- **Multi-Category Brand Classification**: Support for complex business categorization with multi-select categories
- **Website Context Extraction**: Automatic analysis of brand websites for enhanced categorization
- **Enhanced Prompt Contextualization**: AI prompts that use brand target markets and business activities
- **Competitive Intelligence**: Automated competitor discovery and analysis
- **Market-Specific Insights**: Tailored analysis for different geographic markets

## Environment Variables

The application requires several environment variables for full functionality:

### Required Variables
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENROUTER_API_KEY` - OpenRouter API key for AI model access

### Optional Variables (Enhanced Features)
- `TAVILY_API_KEY` - Tavily API key for website content extraction and research capabilities
- `SERP_API_KEY` - SERP API key for search engine results analysis

### Setup
1. Copy the environment variables to your deployment platform (Vercel, etc.)
2. For local development, create a `.env.local` file with the required variables

## Recent Updates

### Multi-Select Brand Categories
- Expanded from single category selection to multi-category support
- 30+ specific business categories including marketing_advertising, digital_marketing, ai_optimization
- Enhanced business context for better AI prompt generation

### Website Context Extraction
- Automatic analysis of brand websites using Tavily API
- Intelligent category suggestions based on website content
- Enhanced product/service descriptions from website data

### Enhanced Contextualization
- Prompts now include multiple business categories, target markets, and business activities
- Better disambiguation for complex businesses (e.g., GEO companies vs generic software)
- Improved search term extraction with multi-category support

## Deployment

Your project is live at:

**[https://vercel.com/hellousehaya-2024s-projects/v0-marketing-app-dashboard](https://vercel.com/hellousehaya-2024s-projects/v0-marketing-app-dashboard)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/jclk4RGxK8e](https://v0.app/chat/projects/jclk4RGxK8e)**

## How It Works

1. **Brand Onboarding**: Users provide brand information including website and select multiple business categories
2. **Context Enrichment**: System automatically extracts additional context from brand website
3. **Ground Truth Collection**: Collects real-world user queries and competitor data
4. **Prompt Generation**: Creates contextually relevant prompts using enhanced brand information
5. **AI Model Testing**: Tests prompts against various AI models for optimization insights

## Technical Architecture

- **Frontend**: Next.js with TypeScript
- **Backend**: Next.js API routes
- **Database**: Supabase
- **AI Integration**: OpenRouter for multiple AI model access
- **Research**: Tavily API for web content extraction
- **Styling**: Tailwind CSS with shadcn/ui components
