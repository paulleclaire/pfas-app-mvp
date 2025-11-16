# Overview

This is a PFAS (Per- and Polyfluoroalkyl Substances) news aggregator application. It's a minimal Express.js server that fetches and displays recent news articles about PFAS from Google News RSS feeds. The application serves a static frontend and provides a REST API endpoint for retrieving aggregated news items.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture

**Framework**: Express.js (v4.21.0)
- Minimal server setup with ES6 module syntax
- RESTful API design pattern
- Stateless request handling

**Server Configuration**:
- Configurable port via environment variable (defaults to 5000)
- Static file serving from `/public` directory
- JSON-based API responses

## API Design

**Health Check Endpoint** (`/health`):
- Provides server status and uptime monitoring
- Returns JSON with `ok` status and process uptime
- Enables basic service health verification

**News Aggregation Endpoint** (`/api/news`):
- Aggregates RSS feeds from Google News
- Uses `rss-parser` library for feed parsing
- Fetches top 6 items per feed, returns top 10 overall
- Sorts articles by publication date (newest first)
- Transforms feed items to simplified schema: `title`, `link`, `pubDate`
- Error handling returns 500 status with error message

**Design Rationale**:
- Simple synchronous aggregation approach chosen for MVP
- No caching implemented yet (can be added as scaling requirement)
- Direct RSS parsing avoids need for database at this stage

## Frontend Architecture

**Static File Serving**:
- Frontend served from `/public` directory
- Separation of concerns: backend handles data, frontend handles presentation
- Allows independent development of UI

# External Dependencies

## NPM Packages

**express** (^4.21.0):
- Web application framework
- Handles routing, middleware, and static file serving
- Industry-standard choice for Node.js web servers

**rss-parser** (^3.13.0):
- RSS/Atom feed parsing library
- Simplifies XML parsing and normalization
- Handles various RSS feed formats automatically

## External Services

**Google News RSS** (news.google.com):
- Primary data source for PFAS-related news
- Query: `q=PFAS&hl=en-GB&gl=GB&ceid=GB:en`
- Configured for UK English news
- Free, no authentication required
- Feed URL array structure allows easy addition of multiple sources

**Limitations**:
- Dependent on Google News RSS availability
- No fallback mechanism if feed is unavailable
- Rate limiting not implemented (may be needed for production)