# TIF Chat — Implementation Plan for Claude Code

> **Purpose**: Step-by-step instructions for building the TIF internal AI chatbot platform.
> **Base template**: [vercel/chatbot](https://github.com/vercel/chatbot) (Next.js + AI SDK)
> **Estimated time**: 5–8 working days

---

## Phase 1: Project Setup & Microsoft SSO

### 1.1 Fork and Clone the Template

```bash
# Clone the Vercel chatbot template
git clone https://github.com/vercel/chatbot.git tif-chat
cd tif-chat
pnpm install
```

### 1.2 Configure Environment Variables

Create `.env.local` with the following:

```env
# Authentication
AUTH_SECRET=<generate-random-secret>  # Run: openssl rand -base64 32

# Microsoft Entra ID (Azure AD)
AUTH_MICROSOFT_ENTRA_ID_ID=<azure-app-client-id>
AUTH_MICROSOFT_ENTRA_ID_SECRET=<azure-app-client-secret>
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=<tif-tenant-id>

# AI Providers
ANTHROPIC_API_KEY=<anthropic-api-key>
OPENAI_API_KEY=<openai-api-key>
PERPLEXITY_API_KEY=<perplexity-api-key>

# Database (Neon Postgres)
POSTGRES_URL=<neon-connection-string>

# File Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>

# MCP Servers
MCP_COMPANY_SERVER_URL=<company-mcp-sse-endpoint>
MCP_SURVEY_SERVER_URL=<tif-survey-tools-mcp-sse-endpoint>
```

### 1.3 Register Azure App for Microsoft SSO

**In the Azure Portal (portal.azure.com):**

1. Go to **Microsoft Entra ID** → **App registrations** → **New registration**
2. Name: `TIF Chat`
3. Supported account types: **Accounts in this organizational directory only** (single tenant)
4. Redirect URI: `https://<your-domain>/api/auth/callback/microsoft-entra-id`
   - For local dev also add: `http://localhost:3000/api/auth/callback/microsoft-entra-id`
5. Under **Certificates & secrets** → Create a new **Client secret** → Copy the value
6. Copy the **Application (client) ID** and **Directory (tenant) ID** from the Overview page

### 1.4 Configure Auth.js with Microsoft Entra ID

The template uses Auth.js. Modify the auth configuration:

**File: `app/(auth)/auth.config.ts`** (or wherever Auth.js is configured)

```typescript
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Replace the existing providers array with:
providers: [
  MicrosoftEntraID({
    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
    tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID!,
    authorization: {
      params: {
        scope: "openid profile email User.Read",
      },
    },
  }),
],
```

**Remove or replace** any existing auth providers (the template may have email/password or guest auth). Since we want Microsoft-only SSO:

- Remove any guest login buttons
- Remove email/password form if present
- The login page should show only "Sign in with Microsoft"

### 1.5 Update Login UI

Modify the login page (likely `app/(auth)/login/page.tsx`) to show a single Microsoft sign-in button:

- Remove email/password form fields
- Replace with a branded "Sign in with Microsoft" button
- Style using TIF branding (see Phase 4)

### 1.6 Set Up Database

```bash
# Run the existing database migration
pnpm db:migrate
```

This creates tables for: users, sessions, chats, messages, documents, suggestions, and votes. The schema is already defined in the template's Drizzle ORM config.

**What the database stores:**
- **Users** — synced from Microsoft SSO (email, name, avatar)
- **Sessions** — active login sessions
- **Chats** — conversation metadata (title, created_at, user_id)
- **Messages** — individual messages with role, content, model used
- **Documents** — any artifacts/documents generated in chat
- **Votes** — user feedback on messages (thumbs up/down)

### 1.7 Verify Basic Setup

```bash
pnpm dev
# Visit http://localhost:3000
# Should see login page → Click Microsoft SSO → Authenticate → See chat interface
```

---

## Phase 2: Multi-Model Provider Support

### 2.1 Install AI SDK Providers

```bash
pnpm add @ai-sdk/anthropic @ai-sdk/openai @ai-sdk/perplexity
```

### 2.2 Create Model Registry

Create a model configuration file:

**File: `lib/ai/models.ts`**

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { perplexity } from "@ai-sdk/perplexity";

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  model: any; // AI SDK model instance
}

export const models: ModelConfig[] = [
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Best for analysis, writing, and MCP tools",
    model: anthropic("claude-sonnet-4-5-20250929"),
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Fast and efficient for quick tasks",
    model: anthropic("claude-haiku-4-5-20251001"),
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    description: "General tasks and image understanding",
    model: openai("gpt-4o"),
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast and cost-effective",
    model: openai("gpt-4o-mini"),
  },
  {
    id: "perplexity-sonar",
    name: "Perplexity Sonar",
    provider: "Perplexity",
    description: "Research and web search",
    model: perplexity("sonar-pro"),
  },
];

export const DEFAULT_MODEL_ID = "claude-sonnet";

export function getModel(id: string) {
  return models.find((m) => m.id === id) ?? models[0];
}
```

### 2.3 Update Chat API Route

The template's chat route (likely `app/(chat)/api/chat/route.ts`) needs to accept a model ID and route to the correct provider:

```typescript
import { getModel } from "@/lib/ai/models";

// In the POST handler, extract model from request:
const { messages, id, modelId } = await request.json();
const selectedModel = getModel(modelId);

// Use in streamText call:
const result = streamText({
  model: selectedModel.model,
  messages,
  // ... rest of config
});
```

### 2.4 Add Model Selector to Chat UI

The template likely has a model selector component already. Update it to use the new model registry:

- Import `models` from `lib/ai/models`
- Show a dropdown grouped by provider (Anthropic / OpenAI / Perplexity)
- Store the selected model ID in chat state
- Pass the model ID with each API request

---

## Phase 3: MCP Server Integration

### 3.1 Install MCP Package

```bash
pnpm add @ai-sdk/mcp
```

### 3.2 Configure MCP Clients

**File: `lib/ai/mcp.ts`**

```typescript
import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";

export async function getCompanyTools() {
  const client = await createMCPClient({
    transport: {
      type: "sse",
      url: process.env.MCP_COMPANY_SERVER_URL!,
    },
  });
  return await client.tools();
}

export async function getSurveyTools() {
  const client = await createMCPClient({
    transport: {
      type: "sse",
      url: process.env.MCP_SURVEY_SERVER_URL!,
    },
  });
  return await client.tools();
}
```

### 3.3 Wire MCP Tools into Chat Route

In the chat API route, merge MCP tools with any existing tools:

```typescript
import { getCompanyTools, getSurveyTools } from "@/lib/ai/mcp";

// In the POST handler:
const [companyTools, surveyTools] = await Promise.all([
  getCompanyTools(),
  getSurveyTools(),
]);

const result = streamText({
  model: selectedModel.model,
  messages,
  tools: {
    ...companyTools,
    ...surveyTools,
    // ... any other built-in tools from the template
  },
});
```

### 3.4 Optional: Tool Mode Toggle

Consider adding a UI toggle so users can select which toolset is active:

- **All Tools** (default) — both company and survey tools available
- **Company Only** — general company tools
- **Survey Tools** — TIF survey querying tools
- **No Tools** — plain chat with no tool access

This prevents survey-specific tools from cluttering conversations that don't need them.

### 3.5 System Prompt Configuration

Update the system prompt to give the AI context about available tools:

```typescript
const systemPrompt = `You are TIF Chat, an AI assistant for The Insights Family.
You have access to company tools and survey data tools.

Company tools allow you to [describe company MCP capabilities].

Survey tools connect to TIF's survey database covering children and families
across 22 countries. You can query demographic data, entertainment brand
engagement (IP Currency Scores), media consumption patterns, and more.

Always use British English. Be professional but approachable.`;
```

---

## Phase 4: TIF Branding

### 4.1 Brand Colour Variables

Update the CSS custom properties in `app/globals.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

:root {
  /* TIF Brand Colours */
  --tif-navy: #2A317F;
  --tif-white: #FFFFFF;
  --tif-coral: #F86C6E;
  --tif-purple: #652581;
  --tif-ice-blue: #DFF3FC;
  --tif-accent-bar: #E4F3FA;
  --tif-light-bg: #E4F4F8;

  /* Map to the template's CSS variables */
  --background: 0 0% 100%;
  --foreground: 233 50% 33%;        /* TIF Navy as text */
  --primary: 233 50% 33%;           /* TIF Navy */
  --primary-foreground: 0 0% 100%;  /* White */
  --accent: 353 91% 70%;            /* TIF Coral */
  --muted: 199 76% 93%;             /* TIF Ice Blue */
  --muted-foreground: 233 50% 33%;

  font-family: 'Poppins', sans-serif;
}

.dark {
  --background: 233 50% 33%;        /* TIF Navy background */
  --foreground: 0 0% 100%;          /* White text */
  --primary: 353 91% 70%;           /* TIF Coral accent */
  --primary-foreground: 0 0% 100%;
  --accent: 277 55% 33%;            /* TIF Purple */
}
```

### 4.2 Update Tailwind Config

In `tailwind.config.ts`, extend with TIF brand colours:

```typescript
theme: {
  extend: {
    colors: {
      tif: {
        navy: '#2A317F',
        coral: '#F86C6E',
        purple: '#652581',
        'ice-blue': '#DFF3FC',
        'accent-bar': '#E4F3FA',
        'light-bg': '#E4F4F8',
      },
    },
    fontFamily: {
      sans: ['Poppins', 'sans-serif'],
    },
  },
},
```

### 4.3 Add TIF Logo

1. Place the TIF logo in `public/images/tif-logo.png`
2. Update the sidebar/header component to display it:
   - Replace the existing app name/logo with the TIF logo
   - Use the white logo variant on navy backgrounds
   - Use the dark logo variant on white backgrounds

### 4.4 Customise Chat Interface

Key components to brand:

- **Sidebar** — TIF Navy background with white text
- **Chat header** — show model name and TIF branding
- **Message bubbles** — subtle TIF colour accents
- **Input area** — TIF Navy focus ring
- **Login page** — TIF Navy background, white text, centred logo, "Sign in with Microsoft" button

---

## Phase 5: Testing & Deployment

### 5.1 Local Testing Checklist

- [ ] Microsoft SSO login works (redirects, creates user, starts session)
- [ ] Non-TIF Microsoft accounts are rejected
- [ ] Model selector shows all providers and switches correctly
- [ ] Anthropic Claude responds correctly
- [ ] OpenAI GPT responds correctly
- [ ] Perplexity Sonar responds correctly with citations
- [ ] Company MCP tools are listed and functional
- [ ] Survey MCP tools can query the TIF database
- [ ] Chat history persists across sessions
- [ ] File uploads work
- [ ] TIF branding renders correctly (colours, fonts, logo)
- [ ] Responsive design works on mobile/tablet

### 5.2 Deploy to Vercel

```bash
# Install Vercel CLI if not present
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables → Add all from .env.local
```

**Production checklist:**
- [ ] All environment variables set in Vercel dashboard
- [ ] Microsoft redirect URI updated to production URL
- [ ] Database migrations applied to production Neon instance
- [ ] MCP server endpoints accessible from Vercel's network
- [ ] Custom domain configured (e.g., chat.theinsightsfamily.com)

### 5.3 User Onboarding

- Share the URL with the team
- No account creation needed — Microsoft SSO handles it
- Optionally create a brief guide covering: model selection, available tools, how to start a survey query

---

## Quick Reference: Key Files to Modify

| File | What to Change |
|------|----------------|
| `app/(auth)/auth.config.ts` | Replace providers with Microsoft Entra ID |
| `app/(auth)/login/page.tsx` | Microsoft-only login UI |
| `app/(chat)/api/chat/route.ts` | Multi-model routing + MCP tools |
| `lib/ai/models.ts` | Model registry (create new) |
| `lib/ai/mcp.ts` | MCP client config (create new) |
| `app/globals.css` | TIF brand colours + Poppins font |
| `tailwind.config.ts` | TIF colour tokens + font |
| `components/sidebar.tsx` | TIF logo + navy theme |
| `components/model-selector.tsx` | Multi-provider model dropdown |
| `.env.local` | All API keys and config |

---

## Notes

- The Vercel Chatbot template is actively maintained. Check for updates before starting, especially to the AI SDK and Auth.js dependencies.
- If MCP servers require authentication, pass headers in the SSE transport config.
- Perplexity models return citations — consider displaying these in the UI.
- The template includes an artifact/document system — this works well with Claude's tool use for generating code, documents, etc.
- Consider rate limiting per user to manage API costs across the team.
