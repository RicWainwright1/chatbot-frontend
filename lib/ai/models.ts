export const DEFAULT_CHAT_MODEL = "anthropic/claude-sonnet-4-5";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  // Anthropic
  {
    id: "anthropic/claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    description: "Most powerful, 1M context, best for complex reasoning",
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    description: "Great balance of capability and speed",
  },
  {
    id: "anthropic/claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    description: "Fast and affordable for everyday tasks",
  },
  // OpenAI
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    description: "OpenAI flagship, 1M context, strong at coding",
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    description: "Fast and cost-effective for simple tasks",
  },
  // Perplexity
  {
    id: "perplexity/sonar-pro",
    name: "Perplexity Sonar Pro",
    provider: "perplexity",
    description: "Web-connected research with cited sources",
  },
];

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
